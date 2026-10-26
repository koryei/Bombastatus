import { Gateway } from "./gateway.js";
import { pickStatus } from "./schedule.js";

/**
 * Wires the schedule engine to the gateway. Shared by the CLI and the tray app.
 * onUpdate receives { connection, status } whenever either changes.
 */
export function createRunner({ token, config, log = console.log, onUpdate = () => {} }) {
  let gateway = null;
  let timer = null;
  let lastKey = null;
  const state = { connection: "stopped", status: null };
  const emit = () => onUpdate({ ...state });

  function tick() {
    const status = pickStatus(config);
    if (status.key === lastKey) return;
    lastKey = status.key;
    state.status = status;
    log(`status -> ${status.key}: ${status.emoji ?? ""} ${status.text ?? "(none)"}`);
    gateway.setPresence({
      presence: status.presence ?? config.defaultPresence ?? "online",
      text: status.text,
      emoji: status.emoji,
    });
    emit();
  }

  return {
    state,
    start() {
      if (gateway) return;
      lastKey = null;
      gateway = new Gateway(token, log, (connection) => {
        state.connection = connection;
        emit();
      });
      tick();
      gateway.connect();
      timer = setInterval(tick, 1000);
    },
    stop() {
      clearInterval(timer);
      timer = null;
      gateway?.stop();
      gateway = null;
      state.connection = "stopped";
      emit();
    },
  };
}
