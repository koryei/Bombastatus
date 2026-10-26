import { app, Tray, Menu, nativeImage, shell } from "electron";
import { existsSync, copyFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, loadConfig } from "../config.js";
import { createRunner } from "../runner.js";
import { dotPng, COLORS } from "./icon.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Dev: use the project folder. Packaged: use the per-user app data folder.
const home = process.env.BOMBASTATUS_HOME ?? (app.isPackaged ? app.getPath("userData") : root);
const configPath = join(home, "config.json");
const envPath = join(home, ".env");

if (!app.requestSingleInstanceLock()) app.quit();
if (process.platform === "darwin") app.dock?.hide(); // menu bar only, no Dock icon

function ensureFiles() {
  if (!existsSync(configPath)) copyFileSync(join(root, "config.example.json"), configPath);
  if (!existsSync(envPath)) writeFileSync(envPath, "DISCORD_TOKEN=\n");
}

const icons = Object.fromEntries(
  Object.entries(COLORS).map(([k, rgb]) => [
    k,
    nativeImage.createFromBuffer(dotPng(rgb), { scaleFactor: 2 }),
  ])
);

let tray = null;
let runner = null;
let paused = false;
let problem = null; // human-readable setup error, if any
let snapshot = { connection: "stopped", status: null };

function startRunner() {
  runner?.stop();
  runner = null;
  problem = null;
  delete process.env.DISCORD_TOKEN;
  try {
    ensureFiles();
    loadEnv(home);
    const token = process.env.DISCORD_TOKEN;
    if (!token) throw new Error("No token yet: add DISCORD_TOKEN to .env");
    const config = loadConfig(configPath);
    runner = createRunner({ token, config, onUpdate: onRunnerUpdate });
    if (!paused) runner.start();
  } catch (err) {
    problem = err.message;
  }
  refresh();
}

function onRunnerUpdate(s) {
  snapshot = s;
  refresh();
}

function statusLine() {
  if (problem) return problem;
  if (paused) return "Paused (account offline)";
  const { connection, status } = snapshot;
  if (connection === "auth-failed") return "Token rejected: check .env";
  const shown = status?.text ? `${status.emoji ?? ""} ${status.text}`.trim() : "no status";
  return connection === "connected" ? `Online: ${shown}` : `Connecting…`;
}

function iconKey() {
  if (problem || snapshot.connection === "auth-failed") return "error";
  if (paused) return "stopped";
  return snapshot.connection === "connected" ? "connected" : "disconnected";
}

function refresh() {
  if (!tray) return;
  tray.setImage(icons[iconKey()]);
  tray.setToolTip(`Bombastatus: ${statusLine()}`);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: statusLine(), enabled: false },
      { type: "separator" },
      {
        label: paused ? "Resume" : "Pause",
        enabled: !problem,
        click: () => {
          paused = !paused;
          paused ? runner?.stop() : runner?.start();
          refresh();
        },
      },
      { label: "Reload config", click: startRunner },
      { label: "Open config.json", click: () => shell.openPath(configPath) },
      { label: "Open .env (token)", click: () => shell.openPath(envPath) },
      ...(app.isPackaged
        ? [
            {
              label: "Start at login",
              type: "checkbox",
              checked: app.getLoginItemSettings().openAtLogin,
              click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
            },
          ]
        : []),
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ])
  );
}

app.whenReady().then(() => {
  tray = new Tray(icons.stopped);
  startRunner();
});

// Keep running with no windows; the tray is the whole UI.
app.on("window-all-closed", () => {});
app.on("before-quit", () => runner?.stop());
