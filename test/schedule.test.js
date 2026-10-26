import test from "node:test";
import assert from "node:assert/strict";
import { pickStatus } from "../src/schedule.js";

const config = {
  timezone: "UTC",
  rotationIntervalSeconds: 60,
  schedules: [
    { name: "school", days: ["mon", "tue", "wed", "thu", "fri"], start: "07:50", end: "16:00", status: { text: "school" } },
    { name: "sleep", start: "23:30", end: "06:30", status: { text: "sleep" } },
  ],
  rotation: [{ text: "a" }, { text: "b" }],
};

const at = (iso) => pickStatus(config, new Date(iso));

test("weekday school hours", () => {
  assert.equal(at("2026-10-26T08:00:00Z").text, "school"); // Monday
  assert.equal(at("2026-10-26T15:59:00Z").text, "school");
});

test("school ends at 16:00 and skips weekends", () => {
  assert.notEqual(at("2026-10-26T16:00:00Z").text, "school");
  assert.notEqual(at("2026-10-24T09:00:00Z").text, "school"); // Saturday
});

test("overnight schedule spans midnight", () => {
  assert.equal(at("2026-10-26T23:45:00Z").text, "sleep");
  assert.equal(at("2026-10-27T02:00:00Z").text, "sleep");
});

test("rotation cycles outside schedules", () => {
  const a = at("2026-10-24T12:00:00Z");
  const b = at("2026-10-24T12:01:00Z");
  assert.notEqual(a.text, b.text);
});
