# Bombastatus plan

## Goal
Open-source (MIT) tool that keeps the owner's own Discord account online 24/7 on a VM, switching custom status on a schedule and on a timed rotation.

## Decisions
- **Own user account (self-bot), not a bot account.** Owner chose this knowingly; ToS-violation/ban risk is documented in the README.
- **Node.js 18+, single dependency (`ws`)**: cross-platform, easy to host.
- **Gateway presence (op 3)** drives both online state and custom status (activity type 4), over one persistent connection with heartbeat and exponential-backoff reconnect.
- **Config-driven**: `config.json` has timezone-aware schedules (first match wins, overnight supported) and a rotation fallback. Token lives only in `.env`.
- **Hosting**: Docker (`restart: always`) or pm2 on any small VM. Not Vercel (needs a persistent connection).

## Status
- [x] Schedule engine and tests
- [x] Gateway client
- [x] Docker, README, LICENSE
- [x] Tray / menu bar mode (Electron, `src/tray/`)
- [x] Live connection confirmed (via tray smoke test)
- [ ] Verify tray icon visually, `npm run dist`, start-at-login
- [ ] Verify custom status renders for other users
- [x] Publish to GitHub (koryei/Bombastatus), CI, release workflow, v0.1.0

## Ideas
- Gateway resume instead of re-identify
- Per-status expiry, random rotation order
- Hot-reload `config.json`
