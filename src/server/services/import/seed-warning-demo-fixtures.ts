import { getPrevMonth, getYearMonth } from "./date-utils";

export const WARNING_DEMO_PERIOD_MONTH = "2026-06-01";

function buildHistoryRows(params: {
  periodMonth: string;
  lpCode: string;
  lpName: string;
  pl5Code: string;
  pl5Name: string;
  upnRows: Array<{ upn: string; history: [number, number, number, number, number, number]; mtd: number }>;
}) {
  const { periodMonth, lpCode, lpName, pl5Code, pl5Name, upnRows } = params;
  const m1 = getPrevMonth(periodMonth, 1);
  const m2 = getPrevMonth(periodMonth, 2);
  const m3 = getPrevMonth(periodMonth, 3);
  const m4 = getPrevMonth(periodMonth, 4);
  const m5 = getPrevMonth(periodMonth, 5);
  const m6 = getPrevMonth(periodMonth, 6);
  const { year, month } = getYearMonth(periodMonth);
  const historyMonths = [m6, m5, m4, m3, m2, m1];

  return upnRows.flatMap((row) => [
    ...row.history.map((qty, index) => ({
      parentdealerlpcode: lpCode,
      parentdealerlpname: lpName,
      upn: row.upn,
      pl5_code: pl5Code,
      pl5_name: pl5Name,
      qty,
      year: historyMonths[index].year,
      month: historyMonths[index].month,
    })),
    {
      parentdealerlpcode: lpCode,
      parentdealerlpname: lpName,
      upn: row.upn,
      pl5_code: pl5Code,
      pl5_name: pl5Name,
      qty: row.mtd,
      year,
      month,
    },
  ]);
}

export function buildWarningDemoSeedFixtures(
  periodMonth: string = WARNING_DEMO_PERIOD_MONTH,
) {
  const { year, month } = getYearMonth(periodMonth);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);

  return {
    periodMonth,
    periodDate,
    fcstLpPl5: [
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5M", pl5_name: "PL5 Mismatch", fcst_qty: 2, year, month },
      { dealerlpcode: "LP902", dealerlpname: "Warning LP 2", pl5_code: "PL5H", pl5_name: "PL5 No History", fcst_qty: 60, year, month },
    ],
    fcstT2Pl5: [
      { parentdealerlpcode: "LP901", parentdealerlpname: "Warning LP 1", pl5_code: "PL5M", pl5_name: "PL5 Mismatch", fcst_qty: 36, year, month },
      { parentdealerlpcode: "LP901", parentdealerlpname: "Warning LP 1", pl5_code: "PL5N", pl5_name: "PL5 No Quota", fcst_qty: 30, year, month },
      { parentdealerlpcode: "LP902", parentdealerlpname: "Warning LP 2", pl5_code: "PL5H", pl5_name: "PL5 No History", fcst_qty: 24, year, month },
    ],
    allocations: [
      { period_month: periodDate, dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5M", pl5_name: "PL5 Mismatch", allocate_qty: 2 },
      { period_month: periodDate, dealerlpcode: "LP902", dealerlpname: "Warning LP 2", pl5_code: "PL5H", pl5_name: "PL5 No History", allocate_qty: 60 },
    ],
    activeUpns: [
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5M", pl5_name: "PL5 Mismatch", upn: "UPN-M1", year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5M", pl5_name: "PL5 Mismatch", upn: "UPN-M2", year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5M", pl5_name: "PL5 Mismatch", upn: "UPN-M3", year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5N", pl5_name: "PL5 No Quota", upn: "UPN-N1", year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5N", pl5_name: "PL5 No Quota", upn: "UPN-N2", year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5N", pl5_name: "PL5 No Quota", upn: "UPN-N3", year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", pl5_code: "PL5H", pl5_name: "PL5 No History", upn: "UPN-H1", year, month },
      { dealerlpcode: "LP902", dealerlpname: "Warning LP 2", pl5_code: "PL5H", pl5_name: "PL5 No History", upn: "UPN-H2", year, month },
    ],
    inventories: [
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-M1", qty: 0, year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-M2", qty: 0, year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-M3", qty: 0, year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-N1", qty: 1, year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-N2", qty: 1, year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-N3", qty: 5, year, month },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-H1", qty: 9, year, month },
      { dealerlpcode: "LP902", dealerlpname: "Warning LP 2", upn: "UPN-H2", qty: 9, year, month },
    ],
    diohTargets: [
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-M1", abc_class: "B", dioh_days: 30 },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-M2", abc_class: "A", dioh_days: 30 },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-M3", abc_class: "B", dioh_days: 30 },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-N1", abc_class: "B", dioh_days: 35 },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-N2", abc_class: "A", dioh_days: 35 },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-N3", abc_class: "B", dioh_days: 35 },
      { dealerlpcode: "LP901", dealerlpname: "Warning LP 1", upn: "UPN-H1", abc_class: "A", dioh_days: 40 },
      { dealerlpcode: "LP902", dealerlpname: "Warning LP 2", upn: "UPN-H2", abc_class: "B", dioh_days: 40 },
    ],
    t2Purchases: [
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP901",
        lpName: "Warning LP 1",
        pl5Code: "PL5M",
        pl5Name: "PL5 Mismatch",
        upnRows: [
          { upn: "UPN-M1", history: [12, 12, 12, 12, 12, 12], mtd: 1 },
          { upn: "UPN-M2", history: [12, 12, 12, 12, 12, 12], mtd: 1 },
          { upn: "UPN-M3", history: [12, 12, 12, 12, 12, 12], mtd: 1 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP901",
        lpName: "Warning LP 1",
        pl5Code: "PL5N",
        pl5Name: "PL5 No Quota",
        upnRows: [
          { upn: "UPN-N1", history: [10, 10, 10, 10, 10, 10], mtd: 1 },
          { upn: "UPN-N2", history: [8, 8, 8, 8, 8, 8], mtd: 1 },
          { upn: "UPN-N3", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
        ],
      }),
    ],
  };
}
