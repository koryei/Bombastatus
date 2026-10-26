import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, loadEnv } from "../src/config.js";

const tmp = () => mkdtempSync(join(tmpdir(), "bombastatus-"));

test("loadConfig fills defaults and enforces the 15s minimum interval", () => {
  const file = join(tmp(), "config.json");
  writeFileSync(file, JSON.stringify({ rotationIntervalSeconds: 3, rotation: [] }));
  const config = loadConfig(file);
  assert.equal(config.rotationIntervalSeconds, 15);
  assert.ok(config.timezone);
});

test("loadConfig reports a missing file readably", () => {
  assert.throws(() => loadConfig(join(tmp(), "nope.json")), /Missing .*config\.example\.json/);
});

test("loadConfig reports invalid JSON readably", () => {
  const file = join(tmp(), "config.json");
  writeFileSync(file, "{ not json");
  assert.throws(() => loadConfig(file), /not valid JSON/);
});

test("loadEnv reads quoted values and never overrides existing variables", () => {
  const dir = tmp();
  writeFileSync(join(dir, ".env"), 'BS_TEST_A="hello"\nBS_TEST_B=world\n');
  process.env.BS_TEST_B = "keep";
  loadEnv(dir);
  assert.equal(process.env.BS_TEST_A, "hello");
  assert.equal(process.env.BS_TEST_B, "keep");
});
