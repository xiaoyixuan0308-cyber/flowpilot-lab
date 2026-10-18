import {
  add10,
  buildChannelSkuKey,
  buildSkuKey,
  indexBySum,
  isPrimaryChannelDealerType,
  subtract10,
} from "../weekly-sku-split.helpers";
import type { WeeklyDealerDnRow, WeeklyOpenOrderRow, WeeklyP2Row, WeeklyP3Row } from "../weekly-sku-split.types";

function normalizeDctp(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase();
}

function isOrType(value: string | null | undefined) {
  return normalizeDctp(value) === "OR";
}

function isNonOrType(value: string | null | undefined) {
  const normalized = normalizeDctp(value);
  return normalized.length > 0 && normalized !== "OR";
}

function buildBuChannelSkuKey(businessUnit: string, channelCode: string, sku: string) {
  return `${businessUnit}||${buildChannelSkuKey(channelCode, sku)}`;
}

function buildBuSkuKey(businessUnit: string, sku: string) {
  return `${businessUnit}||${buildSkuKey(sku)}`;
}

export function attachDeliveryOpenOrderMetrics(
  rows: WeeklyP2Row[],
  dnRows: WeeklyDealerDnRow[],
  openOrderRows: WeeklyOpenOrderRow[]
): WeeklyP3Row[] {
  const channelSkuDelivered = indexBySum(
    dnRows.filter((row) => row.soldToPt && row.material && isPrimaryChannelDealerType(row.dealerType)),
    (row) => buildBuChannelSkuKey(row.businessUnit, row.soldToPt!, row.material!),
    (row) => row.deliveryQty
  );
  const skuDelivered = indexBySum(
    dnRows.filter((row) => row.material),
    (row) => buildBuSkuKey(row.businessUnit, row.material!),
    (row) => row.deliveryQty
  );
  const channelSkuOr = indexBySum(
    openOrderRows.filter(
      (row) => row.customer && row.material && isPrimaryChannelDealerType(row.dealerType) && isOrType(row.dctp)
    ),
    (row) => buildBuChannelSkuKey(row.businessUnit, row.customer!, row.material!),
    (row) => row.openQty
  );
  const skuOr = indexBySum(
    openOrderRows.filter((row) => row.material && isOrType(row.dctp)),
    (row) => buildBuSkuKey(row.businessUnit, row.material!),
    (row) => row.openQty
  );
  const channelDealerSkuOr = indexBySum(
    openOrderRows.filter((row) => row.material && isPrimaryChannelDealerType(row.dealerType) && isOrType(row.dctp)),
    (row) => buildBuSkuKey(row.businessUnit, row.material!),
    (row) => row.openQty
  );
  const channelSkuNonOr = indexBySum(
    openOrderRows.filter(
      (row) =>
        row.customer &&
        row.material &&
        isPrimaryChannelDealerType(row.dealerType) &&
        isNonOrType(row.dctp)
    ),
    (row) => buildBuChannelSkuKey(row.businessUnit, row.customer!, row.material!),
    (row) => row.openQty
  );
  const skuNonOr = indexBySum(
    openOrderRows.filter((row) => row.material && isNonOrType(row.dctp)),
    (row) => buildBuSkuKey(row.businessUnit, row.material!),
    (row) => row.openQty
  );
  const channelDealerSkuNonOr = indexBySum(
    openOrderRows.filter(
      (row) => row.material && isPrimaryChannelDealerType(row.dealerType) && isNonOrType(row.dctp)
    ),
    (row) => buildBuSkuKey(row.businessUnit, row.material!),
    (row) => row.openQty
  );
  const skuOpenOrder = indexBySum(
    openOrderRows.filter((row) => row.material),
    (row) => buildBuSkuKey(row.businessUnit, row.material!),
    (row) => row.openQty
  );
  const scopedDeliveredBySku = new Map<string, number>();
  const seenChannelSku = new Set<string>();

  for (const row of rows) {
    const channelSkuKey = buildBuChannelSkuKey(row.businessUnit, row.channelCode, row.sku);
    if (seenChannelSku.has(channelSkuKey)) continue;
    seenChannelSku.add(channelSkuKey);
    scopedDeliveredBySku.set(
      buildBuSkuKey(row.businessUnit, row.sku),
      add10(scopedDeliveredBySku.get(buildBuSkuKey(row.businessUnit, row.sku)) ?? 0, channelSkuDelivered.get(channelSkuKey) ?? 0)
    );
  }

  return rows.map((row) => {
    const channelSkuKey = buildBuChannelSkuKey(row.businessUnit, row.channelCode, row.sku);
    const skuKey = buildBuSkuKey(row.businessUnit, row.sku);
    const lMonthDeliveredQty = channelSkuDelivered.get(channelSkuKey) ?? 0;
    const oMonthDeliveredTotalQty = skuDelivered.get(skuKey) ?? 0;
    const pOpenOrderOrQty = channelSkuOr.get(channelSkuKey) ?? 0;
    const sOpenOrderOrTotalQty = skuOr.get(skuKey) ?? 0;
    const tOpenOrderNonOrQty = channelSkuNonOr.get(channelSkuKey) ?? 0;
    const wOpenOrderNonOrTotalQty = skuNonOr.get(skuKey) ?? 0;
    const nOtherDealerMonthDeliveredQty = subtract10(
      oMonthDeliveredTotalQty,
      scopedDeliveredBySku.get(skuKey) ?? 0
    );

    return {
      ...row,
      lMonthDeliveredQty,
      oMonthDeliveredTotalQty,
      pOpenOrderOrQty,
      sOpenOrderOrTotalQty,
      tOpenOrderNonOrQty,
      wOpenOrderNonOrTotalQty,
      rOtherDealerOpenOrderOrQty: subtract10(
        sOpenOrderOrTotalQty,
        channelDealerSkuOr.get(skuKey) ?? 0
      ),
      vOtherDealerOpenOrderNonOrQty: subtract10(
        wOpenOrderNonOrTotalQty,
        channelDealerSkuNonOr.get(skuKey) ?? 0
      ),
      nOtherDealerMonthDeliveredQty,
      xOpenOrderTotalQty: skuOpenOrder.get(skuKey) ?? 0,
    };
  });
}
