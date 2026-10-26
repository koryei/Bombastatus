import WebSocket from "ws";

const GATEWAY_URL = "wss://gateway.discord.gg/?v=9&encoding=json";

/**
 * Turn a config emoji into Discord's activity emoji object.
 * Accepts a unicode emoji ("📚"), a custom emoji mention ("<:name:123>" / "<a:name:123>"),
 * or an explicit { name, id, animated } object.
 */
export function parseEmoji(emoji) {
  if (!emoji) return undefined;
  if (typeof emoji === "object") return emoji;
  const m = emoji.match(/^<(a?):(\w+):(\d+)>$/);
  if (m) return { name: m[2], id: m[3], animated: m[1] === "a" };
  return { name: emoji };
}

/**
 * Minimal Discord gateway client: stays connected, heartbeats, reconnects,
 * and lets the caller push presence updates (online state + custom status).
 */
export class Gateway {
  constructor(token, log = console.log, onState = () => {}) {
    this.token = token;
    this.log = log;
    this.onState = onState; // "connected" | "disconnected" | "auth-failed"
    this.ws = null;
    this.seq = null;
    this.heartbeat = null;
    this.ready = false;
    this.presence = null;
    this.backoff = 1000;
    this.stopped = false;
  }

  connect() {
    this.ws = new WebSocket(GATEWAY_URL);
    this.ws.on("message", (raw) => this.#onMessage(JSON.parse(raw)));
    this.ws.on("close", (code) => this.#onClose(code));
    this.ws.on("error", (err) => this.log(`gateway error: ${err.message}`));
  }

  stop() {
    this.stopped = true;
    clearInterval(this.heartbeat);
    this.ws?.close(1000);
  }

  /** Set presence; re-sent automatically after a reconnect. */
  setPresence({ presence = "online", text = null, emoji = null }) {
    const parsed = parseEmoji(emoji);
    const activities =
      text || parsed
        ? [{ type: 4, name: "Custom Status", state: text ?? "", ...(parsed && { emoji: parsed }) }]
        : [];
    this.presence = { since: null, activities, status: presence, afk: false };
    if (this.ready) this.#send(3, this.presence);
  }

  #send(op, d) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify({ op, d }));
  }

  #onMessage({ op, d, s, t }) {
    if (s != null) this.seq = s;
    switch (op) {
      case 10: // Hello
        clearInterval(this.heartbeat);
        this.heartbeat = setInterval(() => this.#send(1, this.seq), d.heartbeat_interval);
        this.#send(2, {
          token: this.token,
          capabilities: 0,
          properties: { os: process.platform, browser: "Chrome", device: "" },
          presence: this.presence ?? { since: null, activities: [], status: "online", afk: false },
        });
        break;
      case 0:
        if (t === "READY") {
          this.ready = true;
          this.backoff = 1000;
          this.log(`connected as ${d.user?.username ?? "unknown"}`);
          this.onState("connected");
          if (this.presence) this.#send(3, this.presence);
        }
        break;
      case 7: // Reconnect requested
      case 9: // Invalid session
        this.ws.close(4000);
        break;
    }
  }

  #onClose(code) {
    clearInterval(this.heartbeat);
    this.ready = false;
    if (this.stopped) return;
    if (code === 4004) {
      this.log("authentication failed (4004): check DISCORD_TOKEN. Not retrying.");
      this.stopped = true;
      this.onState("auth-failed");
      return;
    }
    this.onState("disconnected");
    this.log(`disconnected (${code}), reconnecting in ${this.backoff / 1000}s`);
    setTimeout(() => this.connect(), this.backoff);
    this.backoff = Math.min(this.backoff * 2, 60_000);
  }
}
