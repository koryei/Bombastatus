const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Current weekday ("mon"...) and minutes since midnight in the given IANA timezone. */
export function localTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    day: get("weekday").slice(0, 3).toLowerCase(),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** True if a schedule entry is active at the given local day/minutes. Supports overnight ranges. */
export function isActive(entry, { day, minutes }) {
  const start = toMinutes(entry.start);
  const end = toMinutes(entry.end);
  const days = entry.days ?? DAYS;

  if (start <= end) {
    return days.includes(day) && minutes >= start && minutes < end;
  }
  // Overnight (e.g. 22:00-06:00): the early-morning part belongs to the previous day's entry.
  if (minutes >= start) return days.includes(day);
  if (minutes < end) return days.includes(DAYS[(DAYS.indexOf(day) + 6) % 7]);
  return false;
}

/**
 * Decide which status should be showing.
 * First matching schedule wins; otherwise rotate through config.rotation.
 */
export function pickStatus(config, now = new Date()) {
  const local = localTime(now, config.timezone);
  const match = (config.schedules ?? []).find((s) => isActive(s, local));
  if (match) return { key: `schedule:${match.name}`, ...match.status };

  const list = config.rotation ?? [];
  if (list.length === 0) return { key: "none", text: null };
  const step = Math.floor(now.getTime() / 1000 / config.rotationIntervalSeconds);
  const idx = step % list.length;
  return { key: `rotation:${idx}`, ...list[idx] };
}
