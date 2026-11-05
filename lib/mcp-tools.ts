import { requireScopes, type McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import {
  addDog,
  bookAppointment,
  findDogByName,
  listAppointments,
  listDogs,
} from "@/lib/db";
import { getSubFromAuth } from "@/lib/auth0-mcp";
import {
  GROOMING_SERVICES,
  formatServiceLine,
  getService,
} from "@/lib/services";

function json(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function resolveService(input: string) {
  const lower = input.trim().toLowerCase();
  return GROOMING_SERVICES.find(
    (service) =>
      service.id === input ||
      service.name.toLowerCase() === lower ||
      service.name.toLowerCase().includes(lower),
  );
}

export function registerMcpTools(server: McpServer) {
  server.registerTool(
    "list_dogs",
    {
      title: "List dogs",
      description:
        "List the signed-in customer's dogs and Anna's grooming service menu.",
      inputSchema: z.object({}),
      scopeChallenge: requireScopes("bookings:read"),
    },
    async (_args, ctx) => {
      const auth = ctx.http?.authInfo;
      if (!auth) return json({ error: "Unauthenticated" });
      const dogs = await listDogs(getSubFromAuth(auth));
      return json({
        dogs: dogs.map((dog) => ({
          name: dog.name,
          breed: dog.breed,
          notes: dog.notes,
        })),
        services: GROOMING_SERVICES.map((service) => ({
          id: service.id,
          menu: formatServiceLine(service),
          blurb: service.blurb,
        })),
      });
    },
  );

  server.registerTool(
    "add_dog",
    {
      title: "Add a dog",
      description: "Register a dog for the signed-in customer.",
      inputSchema: z.object({
        name: z.string().describe("Dog's name"),
        breed: z.string().describe("Breed"),
        notes: z.string().optional().describe("Coat, temperament, or care notes"),
      }),
      scopeChallenge: requireScopes("bookings:write"),
    },
    async ({ name, breed, notes }, ctx) => {
      const auth = ctx.http?.authInfo;
      if (!auth) return json({ error: "Unauthenticated" });
      const dog = await addDog(getSubFromAuth(auth), { name, breed, notes });
      return json({
        added: { name: dog.name, breed: dog.breed, notes: dog.notes },
      });
    },
  );

  server.registerTool(
    "list_appointments",
    {
      title: "List appointments",
      description: "List upcoming grooming appointments for the signed-in customer.",
      inputSchema: z.object({}),
      scopeChallenge: requireScopes("bookings:read"),
    },
    async (_args, ctx) => {
      const auth = ctx.http?.authInfo;
      if (!auth) return json({ error: "Unauthenticated" });
      const appointments = await listAppointments(getSubFromAuth(auth));
      return json({
        appointments: appointments.map((appointment) => {
          const service = getService(appointment.service_id);
          return {
            dog: appointment.dog_name,
            service: service ? formatServiceLine(service) : appointment.service_id,
            date: appointment.date,
            time: appointment.time,
            notes: appointment.notes,
            calendar: appointment.calendar_event_link ?? null,
          };
        }),
      });
    },
  );

  server.registerTool(
    "book_appointment",
    {
      title: "Book an appointment",
      description:
        "Book a grooming appointment for one of the signed-in customer's dogs. Use list_dogs first to see valid service names.",
      inputSchema: z.object({
        dog_name: z.string().describe("Name of an already-registered dog"),
        service: z
          .string()
          .describe(
            "Service id or name: bath-brush, full-groom, puppy-intro, nail-paw",
          ),
        date: z.string().describe("Visit date as YYYY-MM-DD"),
        time: z.string().describe("Time slot as HH:MM, e.g. 10:30"),
        notes: z.string().optional().describe("Optional visit notes"),
      }),
      scopeChallenge: requireScopes("bookings:write"),
    },
    async ({ dog_name, service, date, time, notes }, ctx) => {
      const auth = ctx.http?.authInfo;
      if (!auth) return json({ error: "Unauthenticated" });
      const sub = getSubFromAuth(auth);
      const dog = await findDogByName(sub, dog_name);
      if (!dog) {
        return json({
          error: `No dog named "${dog_name}" on this customer's roster. Call list_dogs or add_dog first.`,
        });
      }
      const resolved = resolveService(service);
      if (!resolved) {
        return json({
          error: `Unknown service "${service}".`,
          services: GROOMING_SERVICES.map(formatServiceLine),
        });
      }
      const appointment = await bookAppointment(sub, {
        dogId: dog.id,
        serviceId: resolved.id,
        date,
        time,
        notes,
      });
      return json({
        booked: {
          dog: dog.name,
          service: formatServiceLine(resolved),
          date: appointment.date,
          time: appointment.time,
        },
        hint: "Refresh http://localhost:3000 — the new visit is already in the web UI.",
      });
    },
  );
}
