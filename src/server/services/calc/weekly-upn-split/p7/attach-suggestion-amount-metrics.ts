import { buildLpUpnKey, compareDecimal, multiply10 } from "../weekly-upn-split.helpers";
import type { WeeklyP7Row, WeeklyP8Row, WeeklyPurchasePriceRow } from "../weekly-upn-split.types";

export function attachSuggestionAmountMetrics(
  rows: WeeklyP7Row[],
  purchasePriceRows: WeeklyPurchasePriceRow[]
): WeeklyP8Row[] {
  const priceByLpUpn = new Map<string, number | null>();

  for (const row of purchasePriceRows) {
    if (row.dealerType.trim().toUpperCase() !== "LP") continue;
    const unitPrice =
      row.bscStdSellPrice !== null && compareDecimal(row.bscStdSellPrice, 0) > 0
        ? row.bscStdSellPrice
        : null;
    priceByLpUpn.set(buildLpUpnKey(row.dealerCode, row.upn), unitPrice);
  }

  return rows.map((row) => {
    const amUnitPrice = priceByLpUpn.get(buildLpUpnKey(row.lpCode, row.upn)) ?? null;

    return {
      ...row,
      amUnitPrice,
      aoOrSuggestAmount:
        row.adOrSuggestQty === null || amUnitPrice === null
          ? null
          : multiply10(row.adOrSuggestQty, amUnitPrice),
    };
  });
}
