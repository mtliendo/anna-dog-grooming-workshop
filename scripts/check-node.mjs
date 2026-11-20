#!/usr/bin/env node
// Fails fast with a readable fix when the running Node.js is too old.
// Kept dependency-free and plain ESM so it runs on any Node.js 18+.
import { fileURLToPath } from "node:url";

export const REQUIREMENTS = {
  app: {
    label: "this workshop app (Next.js 16)",
    range: ">=20.9.0",
  },
  inspector: {
    label: "MCP Inspector 2.16.0",
    range: "^22.23.4 || ^24.22.1 || >=26.12.1",
  },
};

export const RECOMMENDED = "24";

function parseVersion(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(version.trim());
  if (!match) throw new Error(`Unrecognized version: ${version}`);
  return match.slice(1, 4).map(Number);
}

function compare(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function satisfiesComparator(version, comparator) {
  const trimmed = comparator.trim();
  if (trimmed.startsWith(">=")) {
    return compare(version, parseVersion(trimmed.slice(2))) >= 0;
  }
  if (trimmed.startsWith("^")) {
    const min = parseVersion(trimmed.slice(1));
    return version[0] === min[0] && compare(version, min) >= 0;
  }
  throw new Error(`Unsupported range: ${comparator}`);
}

export function satisfies(version, range) {
  const parsed = parseVersion(version);
  return range.split("||").some((part) => satisfiesComparator(parsed, part));
}

export function checkNode(target = "app", version = process.version) {
  const requirement = REQUIREMENTS[target];
  if (!requirement) throw new Error(`Unknown target: ${target}`);
  if (satisfies(version, requirement.range)) return { ok: true };
  return {
    ok: false,
    message: [
      `Node.js ${version} is too old for ${requirement.label}.`,
      `Required: ${requirement.range}.`,
      `Fix: install Node.js ${RECOMMENDED} LTS (for example \`nvm install ${RECOMMENDED} && nvm use ${RECOMMENDED}\`),`,
      "then run `npm install` again.",
    ].join("\n"),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = checkNode(process.argv[2] ?? "app");
  if (!result.ok) {
    console.error(`\n${result.message}\n`);
    process.exit(1);
  }
}
