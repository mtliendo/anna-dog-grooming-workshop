import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import path from "node:path";
import {
  createPostgresClient,
  POSTGRES_SCHEMA,
  type DbClient,
} from "@/lib/db-postgres";
import { SAMPLE_DOG, getService } from "@/lib/services";

/**
 * Local libsql / SQLite file. Pure JS — no node-gyp, no Xcode CLT, no Python.
 * The file URL matches the workshop README: file:./data/anna-grooming.db
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_URL = "file:./data/anna-grooming.db";

// Hosted deployments set DATABASE_URL (Postgres); the workshop uses the file.
const POSTGRES_URL = process.env.DATABASE_URL?.trim();

let client: DbClient | null = null;
let initPromise: Promise<DbClient> | null = null;

export type Dog = {
  id: number;
  user_sub: string;
  name: string;
  breed: string;
  notes: string | null;
  created_at: string;
};

export type Appointment = {
  id: number;
  user_sub: string;
  dog_id: number;
  service_id: string;
  date: string;
  time: string;
  notes: string | null;
  created_at: string;
  calendar_event_id?: string | null;
  calendar_event_link?: string | null;
  dog_name?: string;
  dog_breed?: string;
};

function getClient(): DbClient {
  if (!client && POSTGRES_URL) {
    client = createPostgresClient(POSTGRES_URL);
  }
  if (!client) {
    mkdirSync(DATA_DIR, { recursive: true });
    client = createClient({ url: DB_URL });
  }
  return client;
}

// Shared promise: concurrent first calls (e.g. the home page's two reads) create the schema once.
export function initDb(): Promise<DbClient> {
  initPromise ??= createSchema().catch((error) => {
    initPromise = null;
    throw error;
  });
  return initPromise;
}

async function createSchema(): Promise<DbClient> {
  const db = getClient();

  if (POSTGRES_URL) {
    await db.executeMultiple(POSTGRES_SCHEMA);
    return db;
  }

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS dogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_sub TEXT NOT NULL,
      name TEXT NOT NULL,
      breed TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_sub TEXT NOT NULL,
      dog_id INTEGER NOT NULL,
      service_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (dog_id) REFERENCES dogs(id)
    );

    CREATE INDEX IF NOT EXISTS idx_dogs_user ON dogs(user_sub);
    CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_sub);
  `);

  // Phase 1 databases carry over — add Token Vault columns only if missing.
  await ensureColumn(db, "appointments", "calendar_event_id", "TEXT");
  await ensureColumn(db, "appointments", "calendar_event_link", "TEXT");

  return db;
}

async function ensureColumn(
  db: DbClient,
  table: string,
  column: string,
  type: string,
) {
  try {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column/i.test(message)) {
      throw error;
    }
  }
}

export async function listDogs(userSub: string): Promise<Dog[]> {
  const db = await initDb();
  const result = await db.execute({
    sql: "SELECT * FROM dogs WHERE user_sub = ? ORDER BY created_at DESC",
    args: [userSub],
  });
  return result.rows as unknown as Dog[];
}

export async function findDogByName(
  userSub: string,
  name: string,
): Promise<Dog | null> {
  const db = await initDb();
  const result = await db.execute({
    sql: "SELECT * FROM dogs WHERE user_sub = ? AND lower(name) = lower(?) LIMIT 1",
    args: [userSub, name.trim()],
  });
  return (result.rows[0] as unknown as Dog) ?? null;
}

export async function addDog(
  userSub: string,
  input: { name: string; breed: string; notes?: string },
): Promise<Dog> {
  const db = await initDb();
  const result = await db.execute({
    sql: `INSERT INTO dogs (user_sub, name, breed, notes)
          VALUES (?, ?, ?, ?)
          RETURNING *`,
    args: [userSub, input.name.trim(), input.breed.trim(), input.notes?.trim() || null],
  });
  return result.rows[0] as unknown as Dog;
}

export async function addSampleDog(userSub: string): Promise<Dog> {
  return addDog(userSub, SAMPLE_DOG);
}

export async function deleteDog(userSub: string, dogId: number): Promise<void> {
  const db = await initDb();
  await db.execute({
    sql: "DELETE FROM appointments WHERE user_sub = ? AND dog_id = ?",
    args: [userSub, dogId],
  });
  await db.execute({
    sql: "DELETE FROM dogs WHERE user_sub = ? AND id = ?",
    args: [userSub, dogId],
  });
}

export async function listAppointments(userSub: string): Promise<Appointment[]> {
  const db = await initDb();
  const result = await db.execute({
    sql: `SELECT a.*, d.name AS dog_name, d.breed AS dog_breed
          FROM appointments a
          JOIN dogs d ON d.id = a.dog_id
          WHERE a.user_sub = ?
          ORDER BY a.date ASC, a.time ASC`,
    args: [userSub],
  });
  return result.rows as unknown as Appointment[];
}

export async function bookAppointment(
  userSub: string,
  input: {
    dogId: number;
    serviceId: string;
    date: string;
    time: string;
    notes?: string;
  },
): Promise<Appointment> {
  const service = getService(input.serviceId);
  if (!service) {
    throw new Error("Unknown grooming service.");
  }

  const db = await initDb();
  const dog = await db.execute({
    sql: "SELECT id FROM dogs WHERE id = ? AND user_sub = ?",
    args: [input.dogId, userSub],
  });
  if (dog.rows.length === 0) {
    throw new Error("That dog is not on your roster.");
  }

  const result = await db.execute({
    sql: `INSERT INTO appointments (user_sub, dog_id, service_id, date, time, notes)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      userSub,
      input.dogId,
      input.serviceId,
      input.date,
      input.time,
      input.notes?.trim() || null,
    ],
  });
  return result.rows[0] as unknown as Appointment;
}

export async function cancelAppointment(
  userSub: string,
  appointmentId: number,
): Promise<void> {
  const db = await initDb();
  await db.execute({
    sql: "DELETE FROM appointments WHERE user_sub = ? AND id = ?",
    args: [userSub, appointmentId],
  });
}

export async function saveCalendarEvent(
  userSub: string,
  appointmentId: number,
  event: { id: string; htmlLink: string },
): Promise<void> {
  const db = await initDb();
  await db.execute({
    sql: `UPDATE appointments
          SET calendar_event_id = ?, calendar_event_link = ?
          WHERE user_sub = ? AND id = ?`,
    args: [event.id, event.htmlLink, userSub, appointmentId],
  });
}

export async function getAppointment(
  userSub: string,
  appointmentId: number,
): Promise<Appointment | null> {
  const db = await initDb();
  const result = await db.execute({
    sql: `SELECT a.*, d.name AS dog_name, d.breed AS dog_breed
          FROM appointments a
          JOIN dogs d ON d.id = a.dog_id
          WHERE a.user_sub = ? AND a.id = ?`,
    args: [userSub, appointmentId],
  });
  return (result.rows[0] as unknown as Appointment) ?? null;
}
