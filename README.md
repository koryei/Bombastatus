<div align="center">

# Bombastatus

**Keep your Discord account online 24/7 with a status that changes by itself.**
Schedule it ("📚 busy at school", Mon–Fri 07:50–16:00), cycle it, or both, from your menu bar or a cheap VM.

[![CI](https://github.com/koryei/Bombastatus/actions/workflows/ci.yml/badge.svg)](https://github.com/koryei/Bombastatus/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node](https://img.shields.io/badge/node-%E2%89%A518-339933)
![Platforms](https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-supported-lightgrey)

</div>

> [!WARNING]
> **Use at your own risk.** Automating a regular user account ("self-botting") **violates Discord's Terms of Service** and can get your account **suspended or banned**. This project is for educational purposes and comes with no warranty. Prefer an account you can afford to lose. **Never share your token**: anyone who has it controls your account.

## Features

- 🟢 **Always online**: holds a persistent gateway connection with heartbeats and automatic reconnect (exponential backoff).
- 🗓️ **Schedules**: per-weekday time windows with their own status text, emoji and online state (online / idle / do not disturb). Overnight ranges like `23:30–06:30` work.
- 🔁 **Rotation**: when no schedule matches, it cycles through your list of statuses every N seconds, forever.
- 🌍 **Timezone-aware**: IANA timezones, daylight saving handled.
- 😎 **Custom emoji**: unicode, custom and animated Discord emoji.
- 🖥️ **Tray / menu bar app**: no window, no Dock or taskbar icon. Pause, resume and reload from the tray.
- 🐳 **Server-friendly**: Docker image and compose file for a VM, or run it under pm2.
- 🪶 **Tiny**: one runtime dependency (`ws`), JSON config.

## Quick start

Requires [Node.js 18+](https://nodejs.org).

```bash
git clone https://github.com/koryei/Bombastatus.git
cd Bombastatus
npm install

cp config.example.json config.json   # edit your schedules and statuses
cp .env.example .env                 # put your DISCORD_TOKEN in here

npm run tray    # menu bar / system tray app
# or
npm start       # plain terminal process (good for servers)
```

### Getting your token

In a **browser** (the desktop app hides DevTools), open [discord.com/app](https://discord.com/app) → `F12` → **Network** → filter `api` → click any request to `discord.com/api` → copy the `authorization` request header. Paste it into `.env`:

```
DISCORD_TOKEN=your-token-here
```

Changing your Discord password invalidates the token. Keep `.env` private; it is already in `.gitignore`.

## Tray / menu bar app

`npm run tray` puts a small dot in your macOS menu bar or Windows/Linux system tray.

| Dot | Meaning |
|---|---|
| 🟢 Green | Online |
| 🟠 Orange | Connecting / reconnecting |
| ⚪ Grey | Paused (account is offline) |
| 🔴 Red | Problem (missing or rejected token, bad config) |

The menu shows the current status and has **Pause / Resume**, **Reload config**, shortcuts to open `config.json` and `.env`, **Start at login** (installed app only) and **Quit**. On first run it creates `config.json` and `.env` if they're missing.

### Installable app

Download an installer from the [Releases](https://github.com/koryei/Bombastatus/releases) page (`.dmg`, `.exe` or `.AppImage`), or build one yourself:

```bash
npm run dist   # output in dist/
```

The installed app stores `config.json` and `.env` in its per-user app-data folder; use the tray menu to open them. Set `BOMBASTATUS_HOME` to use a different folder.

#### First launch (the app isn't notarized)

I don't pay for Apple/Microsoft code-signing certificates, so your OS will warn you the first time. This is expected.

**macOS**: if you see *"Bombastatus" is damaged and can't be opened* or *"can't be verified"*, the file is fine. macOS is just blocking a downloaded app that isn't notarized. Drag it to **Applications**, then run this once in Terminal:

```bash
xattr -cr /Applications/Bombastatus.app
```

Then open it normally. (Alternative: try to open it, then go to **System Settings → Privacy & Security** and click **Open Anyway**.)

**Windows**: on the SmartScreen "Windows protected your PC" screen, click **More info → Run anyway**.

**Linux**: make the AppImage executable and run it: `chmod +x Bombastatus-*.AppImage && ./Bombastatus-*.AppImage`.

If you'd rather not trust a prebuilt binary, [run it from source](#quick-start) instead.

## Configuration

`config.json` (see [`config.example.json`](config.example.json)):

```json
{
  "timezone": "America/New_York",
  "defaultPresence": "online",
  "rotationIntervalSeconds": 60,

  "schedules": [
    {
      "name": "school",
      "days": ["mon", "tue", "wed", "thu", "fri"],
      "start": "07:50",
      "end": "16:00",
      "status": { "text": "busy at school", "emoji": "📚", "presence": "dnd" }
    }
  ],

  "rotation": [
    { "text": "free right now", "emoji": "🟢" },
    { "text": "dm me", "emoji": "💬" }
  ]
}
```

| Key | Meaning |
|---|---|
| `timezone` | IANA zone such as `America/New_York`. Defaults to the machine's zone. |
| `defaultPresence` | `online`, `idle`, `dnd` or `invisible` when an entry doesn't set its own. |
| `rotationIntervalSeconds` | How often the rotation advances. Minimum 15, to stay clear of rate limits. |
| `schedules[]` | `name`, optional `days` (`mon`…`sun`; default every day), `start` / `end` (`HH:MM`, 24h), and `status` (`text`, `emoji`, `presence`). **First match wins.** |
| `rotation[]` | Statuses cycled forever when no schedule matches. Each has `text`, `emoji` and optional `presence`. |

### Emoji

`emoji` can be a unicode emoji or a custom Discord emoji. For a custom one, type `\:emojiname:` in Discord and copy the result (`<:pepe:123456789012345678>`, or `<a:name:id>` for animated):

```json
{ "text": "vibing", "emoji": "<a:dance:987654321098765432>" }
```

Custom emoji may require Nitro or membership in the emoji's server, depending on Discord's rules.

## Running 24/7

**Docker** (recommended for a VM):

```bash
cp config.example.json config.json && cp .env.example .env   # then edit both
docker compose up -d --build
docker compose logs -f
```

**pm2**:

```bash
npm install --omit=dev && npm i -g pm2
pm2 start src/index.js --name bombastatus
pm2 save && pm2 startup
```

Good hosts: Oracle Cloud Always Free, any ~$4/mo VPS, a Raspberry Pi, or your own Mac using the tray app. Serverless platforms won't work, because a persistent connection is required.

## How it works

```
config.json ──► schedule engine ──► runner ──► gateway client ──► Discord
 (rules)        (picks status       (ticks     (heartbeat,
                for "now")          1/sec)      reconnect, presence)
```

`src/schedule.js` is pure logic with unit tests; the runner only talks to Discord when the chosen status actually changes.

## Troubleshooting

- **`Token rejected` / red dot**: the token is wrong or was invalidated by a password change. Copy a fresh one.
- **Status doesn't show for others**: confirm you're not set to *invisible*, and that custom emoji are allowed for your account.
- **Discord emailed me about a new login**: expected when connecting from a new machine or VM. Verify it in your normal client.
- **macOS says the app is "damaged"**: run `xattr -cr /Applications/Bombastatus.app` once, then open it. See [First launch](#first-launch-the-app-isnt-notarized).
- **`Electron failed to install correctly`**: delete `node_modules/electron` and run `npm install` again. If it persists, run `node node_modules/electron/install.js`.

## Development

```bash
npm test        # unit tests (node:test, no extra tooling)
npm run tray    # run the tray app from source
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Security notes are in [SECURITY.md](SECURITY.md), and release notes in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
