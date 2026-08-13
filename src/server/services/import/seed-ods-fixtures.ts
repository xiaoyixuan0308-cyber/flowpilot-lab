export const SEED_PERIOD_MONTH = "2026-06-01";

import { getPrevMonth, getYearMonth } from "./date-utils";

export function buildSeedOdsFixtures(periodMonth: string = SEED_PERIOD_MONTH) {
  const { year, month } = getYearMonth(periodMonth);
  const m1 = getPrevMonth(periodMonth, 1);
  const m2 = getPrevMonth(periodMonth, 2);
  const m3 = getPrevMonth(periodMonth, 3);
  const m4 = getPrevMonth(periodMonth, 4);
  const m5 = getPrevMonth(periodMonth, 5);
  const m6 = getPrevMonth(periodMonth, 6);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);

  return {
    periodMonth,
    periodDate,
    fcstLpPl5: [
      {
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5A",
        pl5_name: "PL5 Alpha",
        fcst_qty: 120,
        year,
        month,
      },
      {
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5B",
        pl5_name: "PL5 Beta",
        fcst_qty: 80,
        year,
        month,
      },
    ],
    fcstT2Pl5: [
      {
        parentdealerlpcode: "LP001",
        parentdealerlpname: "LP One",
        pl5_code: "PL5A",
        pl5_name: "PL5 Alpha",
        fcst_qty: 90,
        year,
        month,
      },
      {
        parentdealerlpcode: "LP001",
        parentdealerlpname: "LP One",
        pl5_code: "PL5B",
        pl5_name: "PL5 Beta",
        fcst_qty: 60,
        year,
        month,
      },
    ],
    allocations: [
      {
        period_month: periodDate,
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5A",
        pl5_name: "PL5 Alpha",
        allocate_qty: 120,
      },
      {
        period_month: periodDate,
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5B",
        pl5_name: "PL5 Beta",
        allocate_qty: 80,
      },
    ],
    activeUpns: [
      {
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5A",
        pl5_name: "PL5 Alpha",
        upn: "UPN-A1",
        year,
        month,
      },
      {
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5A",
        pl5_name: "PL5 Alpha",
        upn: "UPN-A2",
        year,
        month,
      },
      {
        dealerlpcode: "LP001",
        dealerlpname: "LP One",
        pl5_code: "PL5B",
        pl5_name: "PL5 Beta",
        upn: "UPN-B1",
        year,
        month,
      },
    ],
    inventories: [
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A1", qty: 30, year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A2", qty: 20, year, month },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-B1", qty: 10, year, month },
    ],
    diohTargets: [
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A1", abc_class: "A", dioh_days: 45 },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-A2", abc_class: "B", dioh_days: 30 },
      { dealerlpcode: "LP001", dealerlpname: "LP One", upn: "UPN-B1", abc_class: "A", dioh_days: 25 },
    ],
    t2Purchases: [
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 40, year, month: m6.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 20, year, month: m6.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 30, year, month: m6.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 36, year: m5.year, month: m5.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 18, year: m5.year, month: m5.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 28, year: m5.year, month: m5.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 42, year: m4.year, month: m4.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 19, year: m4.year, month: m4.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 27, year: m4.year, month: m4.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 45, year: m3.year, month: m3.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 22, year: m3.year, month: m3.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 26, year: m3.year, month: m3.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 38, year: m2.year, month: m2.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 24, year: m2.year, month: m2.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 25, year: m2.year, month: m2.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 35, year: m1.year, month: m1.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 21, year: m1.year, month: m1.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 24, year: m1.year, month: m1.month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A1", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 12, year, month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-A2", pl5_code: "PL5A", pl5_name: "PL5 Alpha", qty: 8, year, month },
      { parentdealerlpcode: "LP001", parentdealerlpname: "LP One", upn: "UPN-B1", pl5_code: "PL5B", pl5_name: "PL5 Beta", qty: 5, year, month },
    ],
  };
}
