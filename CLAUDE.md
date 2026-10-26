# Bombastatus

Open-source Node.js tool that keeps the owner's Discord user account online 24/7 and changes its custom status on a schedule plus a timed rotation. See `PLAN.md` for decisions.

- `src/schedule.js`: pure logic that picks the status for a given time (tested in `test/`)
- `src/gateway.js`: minimal Discord gateway client (heartbeat, reconnect, presence)
- `src/runner.js`: wires schedule to gateway; shared by both entry points
- `src/config.js`: `.env` and `config.json` loading
- `src/index.js`: CLI/Docker entry (`npm start`)
- `src/tray/`: Electron tray / menu bar entry (`npm run tray`, `npm run dist`); Electron is a devDependency so Docker skips it

Key decisions: self-bot on the owner's own account (ToS risk documented in README); the only dependency is `ws`; secrets live in `.env` and are never committed.

Status: code and unit tests done. Gateway connect and status set were confirmed live in both CLI and tray modes. Tray icon appearance, `npm run dist` and start-at-login are not verified. Published at github.com/koryei/Bombastatus (v0.1.0); CI in `.github/workflows/`, installers built by the release workflow on `v*` tags.

Gotcha: if Electron's install leaves `node_modules/electron/path.txt` missing or `dist/` incomplete, unzip the cached zip from `~/Library/Caches/electron` into `dist/` and write `path.txt` (`Electron.app/Contents/MacOS/Electron` on mac).

Commands: `npm install`, `npm test`, `npm start`.
