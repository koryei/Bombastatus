# Changelog

## 0.1.1

- Fix: the macOS app is now ad-hoc signed, so it is no longer reported as "damaged" because of a broken signature on Apple Silicon.
- Docs: first-launch instructions for macOS (`xattr -cr`), Windows (SmartScreen) and Linux (AppImage).

## 0.1.0

First release.

- Keep a Discord account online 24/7 over a persistent gateway connection with automatic reconnect.
- Timezone-aware schedules (days, time ranges, overnight ranges) with a rotating fallback list.
- Unicode and custom (including animated) Discord emoji in statuses.
- Tray / menu bar app (macOS, Windows, Linux) with Pause/Resume, Reload config and quick access to config files.
- Docker image and compose file for running on a VM.
- Installers built by CI for macOS, Windows and Linux.
