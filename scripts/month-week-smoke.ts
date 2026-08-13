import assert from "node:assert/strict";
import { getMonthClippedWeek, listMonthClippedWeeks } from "../src/lib/month-week";

assert.deepEqual(
  listMonthClippedWeeks("2026-07-01").map(({ weekStartDate, weekEndDate }) => [weekStartDate, weekEndDate]),
  [
    ["2026-07-01", "2026-07-05"],
    ["2026-07-06", "2026-07-12"],
    ["2026-07-13", "2026-07-19"],
    ["2026-07-20", "2026-07-26"],
    ["2026-07-27", "2026-07-31"],
  ],
);
assert.deepEqual(getMonthClippedWeek("2026-07-08"), {
  periodMonth: "2026-07-01",
  weekStartDate: "2026-07-06",
  weekEndDate: "2026-07-12",
});

console.log("Month-clipped week checks passed.");
