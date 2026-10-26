import test from "node:test";
import assert from "node:assert/strict";
import { parseEmoji } from "../src/gateway.js";

test("unicode emoji", () => {
  assert.deepEqual(parseEmoji("📚"), { name: "📚" });
});

test("custom emoji mention", () => {
  assert.deepEqual(parseEmoji("<:pepe:123456789>"), { name: "pepe", id: "123456789", animated: false });
});

test("animated custom emoji mention", () => {
  assert.deepEqual(parseEmoji("<a:dance:987654321>"), { name: "dance", id: "987654321", animated: true });
});

test("explicit object and empty", () => {
  assert.deepEqual(parseEmoji({ name: "x", id: "1" }), { name: "x", id: "1" });
  assert.equal(parseEmoji(null), undefined);
});
