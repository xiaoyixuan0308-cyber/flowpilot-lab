import {
  add10,
  buildLpUpnKey,
  buildUpnKey,
  indexBySum,
  subtract10,
} from "../weekly-upn-split.helpers";
import type { WeeklyDealerDnRow, WeeklyOpenOrderRow, WeeklyP2Row, WeeklyP3Row } from "../weekly-upn-split.types";

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

function isLpDealerType(value: string | null | undefined) {
  return (value ?? "").trim().toUpperCase() === "LP";
}

function buildBuLpUpnKey(scBu: string, lpCode: string, upn: string) {
  return `${scBu}||${buildLpUpnKey(lpCode, upn)}`;
}

function buildBuUpnKey(scBu: string, upn: string) {
  return `${scBu}||${buildUpnKey(upn)}`;
}

export function attachDeliveryOpenOrderMetrics(
  rows: WeeklyP2Row[],
  dnRows: WeeklyDealerDnRow[],
  openOrderRows: WeeklyOpenOrderRow[]
): WeeklyP3Row[] {
  const lpUpnDelivered = indexBySum(
    dnRows.filter((row) => row.soldToPt && row.material && isLpDealerType(row.dealerType)),
    (row) => buildBuLpUpnKey(row.scBu, row.soldToPt!, row.material!),
    (row) => row.deliveryQty
  );
  const upnDelivered = indexBySum(
    dnRows.filter((row) => row.material),
    (row) => buildBuUpnKey(row.scBu, row.material!),
    (row) => row.deliveryQty
  );
  const lpUpnOr = indexBySum(
    openOrderRows.filter(
      (row) => row.customer && row.material && isLpDealerType(row.dealerType) && isOrType(row.dctp)
    ),
    (row) => buildBuLpUpnKey(row.scBu, row.customer!, row.material!),
    (row) => row.openQty
  );
  const upnOr = indexBySum(
    openOrderRows.filter((row) => row.material && isOrType(row.dctp)),
    (row) => buildBuUpnKey(row.scBu, row.material!),
    (row) => row.openQty
  );
  const lpDealerUpnOr = indexBySum(
    openOrderRows.filter((row) => row.material && isLpDealerType(row.dealerType) && isOrType(row.dctp)),
    (row) => buildBuUpnKey(row.scBu, row.material!),
    (row) => row.openQty
  );
  const lpUpnNonOr = indexBySum(
    openOrderRows.filter(
      (row) =>
        row.customer &&
        row.material &&
        isLpDealerType(row.dealerType) &&
        isNonOrType(row.dctp)
    ),
    (row) => buildBuLpUpnKey(row.scBu, row.customer!, row.material!),
    (row) => row.openQty
  );
  const upnNonOr = indexBySum(
    openOrderRows.filter((row) => row.material && isNonOrType(row.dctp)),
    (row) => buildBuUpnKey(row.scBu, row.material!),
    (row) => row.openQty
  );
  const lpDealerUpnNonOr = indexBySum(
    openOrderRows.filter(
      (row) => row.material && isLpDealerType(row.dealerType) && isNonOrType(row.dctp)
    ),
    (row) => buildBuUpnKey(row.scBu, row.material!),
    (row) => row.openQty
  );
  const upnOpenOrder = indexBySum(
    openOrderRows.filter((row) => row.material),
    (row) => buildBuUpnKey(row.scBu, row.material!),
    (row) => row.openQty
  );
  const scopedDeliveredByUpn = new Map<string, number>();
  const seenLpUpn = new Set<string>();

  for (const row of rows) {
    const lpUpnKey = buildBuLpUpnKey(row.scBu, row.lpCode, row.upn);
    if (seenLpUpn.has(lpUpnKey)) continue;
    seenLpUpn.add(lpUpnKey);
    scopedDeliveredByUpn.set(
      buildBuUpnKey(row.scBu, row.upn),
      add10(scopedDeliveredByUpn.get(buildBuUpnKey(row.scBu, row.upn)) ?? 0, lpUpnDelivered.get(lpUpnKey) ?? 0)
    );
  }

  return rows.map((row) => {
    const lpUpnKey = buildBuLpUpnKey(row.scBu, row.lpCode, row.upn);
    const upnKey = buildBuUpnKey(row.scBu, row.upn);
    const lMonthDeliveredQty = lpUpnDelivered.get(lpUpnKey) ?? 0;
    const oMonthDeliveredTotalQty = upnDelivered.get(upnKey) ?? 0;
    const pOpenOrderOrQty = lpUpnOr.get(lpUpnKey) ?? 0;
    const sOpenOrderOrTotalQty = upnOr.get(upnKey) ?? 0;
    const tOpenOrderNonOrQty = lpUpnNonOr.get(lpUpnKey) ?? 0;
    const wOpenOrderNonOrTotalQty = upnNonOr.get(upnKey) ?? 0;
    const nOtherDealerMonthDeliveredQty = subtract10(
      oMonthDeliveredTotalQty,
      scopedDeliveredByUpn.get(upnKey) ?? 0
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
        lpDealerUpnOr.get(upnKey) ?? 0
      ),
      vOtherDealerOpenOrderNonOrQty: subtract10(
        wOpenOrderNonOrTotalQty,
        lpDealerUpnNonOr.get(upnKey) ?? 0
      ),
      nOtherDealerMonthDeliveredQty,
      xOpenOrderTotalQty: upnOpenOrder.get(upnKey) ?? 0,
    };
  });
}
