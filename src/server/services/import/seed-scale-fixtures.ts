import { getPrevMonth, getYearMonth } from "./date-utils";

export const SCALE_PERIOD_MONTH = "2026-06-01";

function buildHistoryRows(periodMonth: string, lpCode: string, lpName: string, pl5Code: string, pl5Name: string, upn: string, base: number) {
  const months = Array.from({ length: 6 }, (_, i) => getPrevMonth(periodMonth, 6 - i));
  const { year, month } = getYearMonth(periodMonth);
  return [
    ...months.map((item, idx) => ({
      parentdealerlpcode: lpCode,
      parentdealerlpname: lpName,
      upn,
      pl5_code: pl5Code,
      pl5_name: pl5Name,
      qty: base + idx,
      year: item.year,
      month: item.month,
    })),
    {
      parentdealerlpcode: lpCode,
      parentdealerlpname: lpName,
      upn,
      pl5_code: pl5Code,
      pl5_name: pl5Name,
      qty: Math.max(Math.floor(base / 4), 0),
      year,
      month,
    },
  ];
}

export function buildScaleSeedFixtures(
  periodMonth: string = SCALE_PERIOD_MONTH,
  options?: {
    lpCount?: number;
    pl5Count?: number;
    upnPerLpPl5?: number;
  },
) {
  const { year, month } = getYearMonth(periodMonth);
  const periodDate = new Date(`${periodMonth}T08:00:00+08:00`);
  const lpCount = options?.lpCount ?? 3;
  const pl5Count = options?.pl5Count ?? 4;
  const upnPerLpPl5 = options?.upnPerLpPl5 ?? 3;

  const lpDefs = Array.from({ length: lpCount }, (_, i) => ({
    code: `LP${String(101 + i).padStart(3, "0")}`,
    name: `LP ${101 + i}`,
  }));
  const pl5Defs = Array.from({ length: pl5Count }, (_, i) => ({
    code: `PL5${String.fromCharCode(65 + i)}`,
    name: `PL5 ${String.fromCharCode(65 + i)}`,
  }));

  const fcstLpPl5 = [];
  const fcstT2Pl5 = [];
  const allocations = [];
  const activeUpns = [];
  const inventories = [];
  const diohTargets = [];
  const t2Purchases = [];

  let upnIndex = 1;
  for (const [lpIdx, lp] of lpDefs.entries()) {
    for (const [pl5Idx, pl5] of pl5Defs.entries()) {
      const fcstQty = 60 + lpIdx * 20 + pl5Idx * 10;
      fcstLpPl5.push({
        dealerlpcode: lp.code,
        dealerlpname: lp.name,
        pl5_code: pl5.code,
        pl5_name: pl5.name,
        fcst_qty: fcstQty,
        year,
        month,
      });
      fcstT2Pl5.push({
        parentdealerlpcode: lp.code,
        parentdealerlpname: lp.name,
        pl5_code: pl5.code,
        pl5_name: pl5.name,
        fcst_qty: fcstQty - 15,
        year,
        month,
      });
      allocations.push({
        period_month: periodDate,
        dealerlpcode: lp.code,
        dealerlpname: lp.name,
        pl5_code: pl5.code,
        pl5_name: pl5.name,
        allocate_qty: fcstQty,
      });

      for (let i = 0; i < upnPerLpPl5; i++) {
        const upn = `UPN-S${String(upnIndex).padStart(3, "0")}`;
        upnIndex += 1;
        activeUpns.push({
          dealerlpcode: lp.code,
          dealerlpname: lp.name,
          pl5_code: pl5.code,
          pl5_name: pl5.name,
          upn,
          year,
          month,
        });
        inventories.push({
          dealerlpcode: lp.code,
          dealerlpname: lp.name,
          upn,
          qty: 10 + i * 5 + lpIdx * 3 + pl5Idx * 2,
          year,
          month,
        });
        diohTargets.push({
          dealerlpcode: lp.code,
          dealerlpname: lp.name,
          upn,
          abc_class: i % 2 === 0 ? "A" : "B",
          dioh_days: 25 + i * 5 + pl5Idx * 3,
        });
        t2Purchases.push(
          ...buildHistoryRows(
            periodMonth,
            lp.code,
            lp.name,
            pl5.code,
            pl5.name,
            upn,
            8 + i * 2 + lpIdx + pl5Idx,
          ),
        );
      }
    }
  }

  return {
    periodMonth,
    fcstLpPl5,
    fcstT2Pl5,
    allocations,
    activeUpns,
    inventories,
    diohTargets,
    t2Purchases,
  };
}
