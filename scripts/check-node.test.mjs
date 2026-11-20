import assert from "node:assert/strict";
import test from "node:test";
import { checkNode, satisfies } from "./check-node.mjs";

test("app needs Node.js 20.9 or newer", () => {
  assert.equal(checkNode("app", "v20.0.0").ok, false);
  assert.equal(checkNode("app", "v20.8.1").ok, false);
  assert.equal(checkNode("app", "v20.9.0").ok, true);
  assert.equal(checkNode("app", "v24.22.2").ok, true);
});

test("MCP Inspector 2.16.0 needs 22.23.4+, 24.22.1+ or 26.12.1+", () => {
  assert.equal(checkNode("inspector", "v20.9.0").ok, false);
  assert.equal(checkNode("inspector", "v22.12.0").ok, false);
  assert.equal(checkNode("inspector", "v22.23.4").ok, true);
  assert.equal(checkNode("inspector", "v23.11.0").ok, false);
  assert.equal(checkNode("inspector", "v24.22.0").ok, false);
  assert.equal(checkNode("inspector", "v24.22.1").ok, true);
  assert.equal(checkNode("inspector", "v26.12.1").ok, true);
});

test("failure message names the fix", () => {
  const { message } = checkNode("app", "v20.0.0");
  assert.match(message, /v20\.0\.0 is too old/);
  assert.match(message, /nvm install 24/);
});

test("satisfies handles caret and >= ranges", () => {
  assert.equal(satisfies("24.0.0", "^24.0.0"), true);
  assert.equal(satisfies("25.0.0", "^24.0.0"), false);
  assert.equal(satisfies("30.1.0", ">=26.12.1"), true);
});
