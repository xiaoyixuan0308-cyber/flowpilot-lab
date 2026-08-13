import assert from "node:assert/strict";
import { mapBuPatternAmountWeeklyRows } from "@/server/services/import/import-row-mappers";

const base = {
  period_week: "2026-07-06",
  period_month: "2026-07-01",
  sc_bu: "SCBU-TEST",
  actual_amount: "800",
  month_target_amount: "900",
  month_limit_amount: "1000",
  currency_code: "USD",
};

const [valid] = mapBuPatternAmountWeeklyRows([base], 7.15);
assert.equal(valid.sc_bu, "SCBU-TEST");
assert.equal(valid.actual_amount, 800);
assert.equal(valid.month_target_amount, 900);
assert.equal(valid.month_limit_amount, 1000);

const [futureWeek] = mapBuPatternAmountWeeklyRows(
  [{ ...base, period_week: "2026-07-13", actual_amount: "" }],
  7.15,
);
assert.equal(futureWeek.actual_amount, null);

assert.throws(
  () =>
    mapBuPatternAmountWeeklyRows(
      [{ ...base, actual_amount: "901", month_target_amount: "900" }],
      7.15,
    ),
  /actual_amount \(901\) cannot exceed month_target_amount \(900\)/,
);

assert.throws(
  () =>
    mapBuPatternAmountWeeklyRows(
      [{ ...base, month_target_amount: "1001", month_limit_amount: "1000" }],
      7.15,
    ),
  /month_target_amount \(1001\) cannot exceed month_limit_amount \(1000\)/,
);

assert.throws(
  () => mapBuPatternAmountWeeklyRows([base, base], 7.15),
  /duplicate key detected/,
);

console.log("SCBU budget import validation: PASS");
