import assert from "node:assert/strict";
import test from "node:test";
import { POSTGRES_SCHEMA, toPostgresPlaceholders } from "../lib/db-postgres.ts";

test("rewrites ? placeholders to numbered Postgres params", () => {
  assert.equal(
    toPostgresPlaceholders("SELECT * FROM dogs WHERE user_sub = ? AND id = ?"),
    "SELECT * FROM dogs WHERE user_sub = $1 AND id = $2",
  );
  assert.equal(toPostgresPlaceholders("SELECT 1"), "SELECT 1");
});

test("Postgres schema includes the Token Vault columns", () => {
  assert.match(POSTGRES_SCHEMA, /calendar_event_id TEXT/);
  assert.match(POSTGRES_SCHEMA, /calendar_event_link TEXT/);
});
