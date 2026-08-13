import { getPrevMonth, getYearMonth } from "./date-utils";

export const MULTI_SCENARIO_PERIOD_MONTH = "2026-06-01";

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

export function buildMultiScenarioSeedFixtures(
  periodMonth: string = MULTI_SCENARIO_PERIOD_MONTH,
) {
  const { year, month } = getYearMonth(periodMonth);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);

  return {
    periodMonth,
    periodDate,
    fcstLpPl5: [
      { dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5A", pl5_name: "PL5 Alpha", fcst_qty: 120, year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5B", pl5_name: "PL5 Beta", fcst_qty: 90, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5A", pl5_name: "PL5 Alpha", fcst_qty: 80, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5C", pl5_name: "PL5 Gamma", fcst_qty: 75, year, month },
    ],
    fcstT2Pl5: [
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", pl5_code: "PL5A", pl5_name: "PL5 Alpha", fcst_qty: 70, year, month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", pl5_code: "PL5B", pl5_name: "PL5 Beta", fcst_qty: 65, year, month },
      { parentdealerlpcode: "LP002", parentdealerlpname: "LP Two", pl5_code: "PL5A", pl5_name: "PL5 Alpha", fcst_qty: 48, year, month },
      { parentdealerlpcode: "LP002", parentdealerlpname: "LP Two", pl5_code: "PL5B", pl5_name: "PL5 Beta", fcst_qty: 35, year, month },
      { parentdealerlpcode: "LP002", parentdealerlpname: "LP Two", pl5_code: "PL5C", pl5_name: "PL5 Gamma", fcst_qty: 40, year, month },
    ],
    allocations: [
      { period_month: periodDate, dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5A", pl5_name: "PL5 Alpha", allocate_qty: 120 },
      { period_month: periodDate, dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5B", pl5_name: "PL5 Beta", allocate_qty: 0 },
      { period_month: periodDate, dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5A", pl5_name: "PL5 Alpha", allocate_qty: 80 },
      { period_month: periodDate, dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5C", pl5_name: "PL5 Gamma", allocate_qty: 75 },
    ],
    activeUpns: [
      { dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5A", pl5_name: "PL5 Alpha", upn: "UPN-A1", year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5A", pl5_name: "PL5 Alpha", upn: "UPN-A2", year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5B", pl5_name: "PL5 Beta", upn: "UPN-B1", year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", pl5_code: "PL5B", pl5_name: "PL5 Beta", upn: "UPN-B2", year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5A", pl5_name: "PL5 Alpha", upn: "UPN-A3", year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5A", pl5_name: "PL5 Alpha", upn: "UPN-A4", year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5B", pl5_name: "PL5 Beta", upn: "UPN-B3", year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5B", pl5_name: "PL5 Beta", upn: "UPN-B4", year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5C", pl5_name: "PL5 Gamma", upn: "UPN-C1", year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", pl5_code: "PL5C", pl5_name: "PL5 Gamma", upn: "UPN-C2", year, month },
    ],
    inventories: [
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A1", qty: 15, year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A2", qty: 42, year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-B1", qty: 36, year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-B2", qty: 18, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-A3", qty: 20, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-A4", qty: 16, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-B3", qty: 4, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-B4", qty: 3, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-C1", qty: 10, year, month },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-C2", qty: 50, year, month },
    ],
    diohTargets: [
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A1", abc_class: "B", dioh_days: 30 },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A2", abc_class: "A", dioh_days: 45 },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-B1", abc_class: "B", dioh_days: 28 },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-B2", abc_class: "A", dioh_days: 35 },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-A3", abc_class: "B", dioh_days: 32 },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-A4", abc_class: "A", dioh_days: 40 },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-B3", abc_class: "B", dioh_days: 30 },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-B4", abc_class: "A", dioh_days: 42 },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-C1", abc_class: "A", dioh_days: 50 },
      { dealerlpcode: "LP002", dealerlpname: "LP Two", upn: "UPN-C2", abc_class: "B", dioh_days: 25 },
    ],
    t2Purchases: [
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP001",
        lpName: "LP One",
        pl5Code: "PL5A",
        pl5Name: "PL5 Alpha",
        upnRows: [
          { upn: "UPN-A1", history: [22, 23, 21, 24, 23, 25], mtd: 12 },
          { upn: "UPN-A2", history: [18, 19, 20, 18, 19, 20], mtd: 10 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP001",
        lpName: "LP One",
        pl5Code: "PL5B",
        pl5Name: "PL5 Beta",
        upnRows: [
          { upn: "UPN-B1", history: [16, 15, 17, 16, 15, 17], mtd: 7 },
          { upn: "UPN-B2", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP002",
        lpName: "LP Two",
        pl5Code: "PL5A",
        pl5Name: "PL5 Alpha",
        upnRows: [
          { upn: "UPN-A3", history: [14, 13, 15, 14, 13, 15], mtd: 6 },
          { upn: "UPN-A4", history: [12, 11, 12, 11, 12, 11], mtd: 4 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP002",
        lpName: "LP Two",
        pl5Code: "PL5B",
        pl5Name: "PL5 Beta",
        upnRows: [
          { upn: "UPN-B3", history: [10, 9, 10, 9, 10, 9], mtd: 3 },
          { upn: "UPN-B4", history: [8, 7, 8, 7, 8, 7], mtd: 2 },
        ],
      }),
      ...buildHistoryRows({
        periodMonth,
        lpCode: "LP002",
        lpName: "LP Two",
        pl5Code: "PL5C",
        pl5Name: "PL5 Gamma",
        upnRows: [
          { upn: "UPN-C1", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
          { upn: "UPN-C2", history: [0, 0, 0, 0, 0, 0], mtd: 0 },
        ],
      }),
    ],
  };
}
