import type {
  FcstLpPl5Row,
  FcstT2Pl5Row,
  T2PurchaseRow,
} from "../upn-split.types";
import { aggregateByKey, getPrevMonth, getYearMonth } from "../upn-split.helpers";
import { toDealerPl5Key, toDealerPl5UpnKey } from "./p1-key-utils";

export interface P1TimeWindowAggregates {
  year: string;
  month: string;
  dealerPl5TMap: Map<string, number>;
  dealerPl5UMap: Map<string, number>;
  dealerPl5VMap: Map<string, number>;
  dealerPl5Upn6mSum: Map<string, number>;
  dealerPl56mSum: Map<string, number>;
  dealerPl5UpnHMap: Map<string, number>;
  wMap: Map<string, number>;
}

function collectSixMonthPurchases(periodMonth: string, t2Purchases: T2PurchaseRow[]) {
  const sixMonthPurchases: T2PurchaseRow[] = [];

  for (let i = 1; i <= 6; i++) {
    const prev = getYearMonth(getPrevMonth(periodMonth, i));
    sixMonthPurchases.push(
      ...t2Purchases.filter((row) => row.year === prev.year && row.month === prev.month)
    );
  }

  return sixMonthPurchases;
}

/**
 * drawio P1
 * 构建当前计算周期需要的时间窗口聚合：
 * - T / U / V
 * - 6个月历史
 * - MTD
 * - W
 */
export function buildP1TimeWindowAggregates(params: {
  periodMonth: string;
  t2Purchases: T2PurchaseRow[];
  fcstT2Pl5: FcstT2Pl5Row[];
  fcstLpPl5: FcstLpPl5Row[];
}): P1TimeWindowAggregates {
  const { periodMonth, t2Purchases, fcstT2Pl5, fcstLpPl5 } = params;
  const { year, month } = getYearMonth(periodMonth);

  const m2 = getYearMonth(getPrevMonth(periodMonth, 2));
  const m1 = getYearMonth(getPrevMonth(periodMonth, 1));

  const tPurchases = t2Purchases.filter((row) => row.year === m2.year && row.month === m2.month);
  const dealerPl5TMap = aggregateByKey(
    tPurchases,
    (row) => toDealerPl5Key(row.sc_bu, row.parentdealerlpcode, row.pl5_code),
    (row) => row.qty
  );

  const uPurchases = t2Purchases.filter((row) => row.year === m1.year && row.month === m1.month);
  const dealerPl5UMap = aggregateByKey(
    uPurchases,
    (row) => toDealerPl5Key(row.sc_bu, row.parentdealerlpcode, row.pl5_code),
    (row) => row.qty
  );

  const vFcst = fcstT2Pl5.filter((row) => row.year === year && row.month === month);
  const dealerPl5VMap = aggregateByKey(
    vFcst,
    (row) => toDealerPl5Key(row.sc_bu, row.parentdealerlpcode, row.pl5_code),
    (row) => row.fcst_qty
  );

  const sixMonthPurchases = collectSixMonthPurchases(periodMonth, t2Purchases);
  const dealerPl5Upn6mSum = aggregateByKey(
    sixMonthPurchases,
    (row) => toDealerPl5UpnKey(row.sc_bu, row.parentdealerlpcode, row.pl5_code, row.upn),
    (row) => row.qty
  );
  const dealerPl56mSum = aggregateByKey(
    sixMonthPurchases,
    (row) => toDealerPl5Key(row.sc_bu, row.parentdealerlpcode, row.pl5_code),
    (row) => row.qty
  );

  const mtdPurchases = t2Purchases.filter((row) => row.year === year && row.month === month);
  const dealerPl5UpnHMap = aggregateByKey(
    mtdPurchases,
    (row) => toDealerPl5UpnKey(row.sc_bu, row.parentdealerlpcode, row.pl5_code, row.upn),
    (row) => row.qty
  );

  const fcstLpPl5Current = fcstLpPl5.filter((row) => row.year === year && row.month === month);
  const wMap = aggregateByKey(
    fcstLpPl5Current,
    (row) => toDealerPl5Key(row.sc_bu, row.dealerlpcode, row.pl5_code),
    (row) => row.fcst_qty
  );

  return {
    year,
    month,
    dealerPl5TMap,
    dealerPl5UMap,
    dealerPl5VMap,
    dealerPl5Upn6mSum,
    dealerPl56mSum,
    dealerPl5UpnHMap,
    wMap,
  };
}
