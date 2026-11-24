import assert from "node:assert/strict";
import test from "node:test";
import { CHECK_TIME_SLOTS, otherCheckTimes, toCheckTimeSlots } from "../src/lib/checkTimes.ts";

test("check time slots run from 01:00 to 24:00", () => {
  assert.equal(CHECK_TIME_SLOTS.length, 24);
  assert.equal(CHECK_TIME_SLOTS[0], "01:00");
  assert.equal(CHECK_TIME_SLOTS[23], "24:00");
});

test("00:00 from the server shows as the 24:00 slot", () => {
  assert.deepEqual(toCheckTimeSlots(["00:00", "09:00"]), { "24:00": true, "09:00": true });
  for (const slot of Object.keys(toCheckTimeSlots(["00:00", "13:00"]))) assert.ok(CHECK_TIME_SLOTS.includes(slot), slot);
});

test("times that are not on the hour are kept aside, not dropped", () => {
  const times = ["00:00", "09:00", "09:30", "13:15"];
  assert.deepEqual(toCheckTimeSlots(times), { "24:00": true, "09:00": true });
  assert.deepEqual(otherCheckTimes(times), ["09:30", "13:15"]);
});
