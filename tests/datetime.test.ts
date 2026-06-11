import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMatchDate, getTimeUntil } from "../lib/utils";

test("formatea hora del partido en zona horaria de Peru", () => {
  const formatted = formatMatchDate("2026-06-10T08:00:00.000Z");

  assert.equal(formatted.includes("03:00"), true);
  assert.equal(formatted.includes("hora Peru"), true);
});

test("muestra countdown preciso por dias y horas", () => {
  const baseNow = new Date("2026-06-10T00:00:00.000Z").getTime();

  assert.equal(getTimeUntil("2026-06-12T05:00:00.000Z", baseNow), "2 dias 5h");
  assert.equal(getTimeUntil("2026-06-10T04:45:00.000Z", baseNow), "4h 45m");
  assert.equal(getTimeUntil("2026-06-10T00:20:00.000Z", baseNow), "20m");
});
