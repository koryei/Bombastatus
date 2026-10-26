import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/** Load KEY=value pairs from <dir>/.env into process.env (no extra dependency). */
export function loadEnv(dir) {
  const file = join(dir, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/** Read config.json and fill in defaults. Throws a readable error if missing/invalid. */
export function loadConfig(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}. Copy config.example.json to config.json and edit it.`);
  }
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(`${path} is not valid JSON: ${err.message}`);
  }
  config.timezone ??= Intl.DateTimeFormat().resolvedOptions().timeZone;
  config.rotationIntervalSeconds = Math.max(config.rotationIntervalSeconds ?? 60, 15);
  return config;
}
