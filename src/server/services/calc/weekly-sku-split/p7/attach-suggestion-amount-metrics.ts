import { buildChannelSkuKey, compareDecimal, multiply10 } from "../weekly-sku-split.helpers";
import type { WeeklyP7Row, WeeklyP8Row, WeeklyPurchasePriceRow } from "../weekly-sku-split.types";

export function attachSuggestionAmountMetrics(
  rows: WeeklyP7Row[],
  purchasePriceRows: WeeklyPurchasePriceRow[]
): WeeklyP8Row[] {
  const priceByChannelSku = new Map<string, number | null>();

  for (const row of purchasePriceRows) {
    if (row.dealerType.trim().toUpperCase() !== "CHANNEL") continue;
    const unitPrice =
      row.centralWarehouseStdSellPrice !== null && compareDecimal(row.centralWarehouseStdSellPrice, 0) > 0
        ? row.centralWarehouseStdSellPrice
        : null;
    priceByChannelSku.set(buildChannelSkuKey(row.dealerCode, row.sku), unitPrice);
  }

  return rows.map((row) => {
    const amUnitPrice = priceByChannelSku.get(buildChannelSkuKey(row.channelCode, row.sku)) ?? null;

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
