import { loadEnv, loadConfig } from "./config.js";
import { createRunner } from "./runner.js";

loadEnv(process.cwd());

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("Missing DISCORD_TOKEN (set it in .env or the environment).");
  process.exit(1);
}

let config;
try {
  config = loadConfig(process.env.CONFIG_PATH ?? "config.json");
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const runner = createRunner({
  token,
  config,
  log,
  onUpdate: ({ connection }) => {
    if (connection === "auth-failed") {
      log("authentication failed: check DISCORD_TOKEN. Exiting.");
      process.exit(1);
    }
  },
});
runner.start();

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    runner.stop();
    process.exit(0);
  });
}
