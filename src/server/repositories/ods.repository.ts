import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CalculationInput,
  DiohRow,
  FcstLpPl5Row,
  FcstT2Pl5Row,
  InventoryRow,
  T2PurchaseRow,
} from "@/server/services/calc/monthly-upn-split/upn-split.types";

type LoadedActiveUpnRow = {
  id: string;
  dealerlpcode: string | null;
  dealerlpname: string | null;
  pl5_code: string;
  pl5_name: string | null;
  upn: string;
  year: string;
  month: string;
};

function parsePeriodDate(periodMonth: string) {
  return new Date(`${periodMonth}T08:00:00+08:00`);
}

function getYearMonth(periodMonth: string): { year: string; month: string } {
  const d = parsePeriodDate(periodMonth);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
  };
}

function getPrevMonth(periodMonth: string, n: number): string {
  const d = parsePeriodDate(periodMonth);
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function decimalToNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function toPeriodMonthKey(year: string, month: string) {
  return `${year}-${month.padStart(2, "0")}-01`;
}

function comparePeriodMonthDesc(
  a: { year: string; month: string },
  b: { year: string; month: string },
) {
  return toPeriodMonthKey(b.year, b.month).localeCompare(toPeriodMonthKey(a.year, a.month));
}

function normalizeMonthValue(month: string) {
  const normalized = Number(month);
  return Number.isNaN(normalized) ? month : String(normalized);
}

function monthCandidates(month: string) {
  const normalized = normalizeMonthValue(month);
  return Array.from(new Set([month, normalized, normalized.padStart(2, "0")]));
}

function dedupeActiveUpnRows(rows: T2PurchaseRow[]): LoadedActiveUpnRow[] {
  const deduped = new Map<string, LoadedActiveUpnRow>();

  for (const row of rows) {
    if (!row.parentdealerlpcode || !row.pl5_code || !row.upn) continue;

    const id = `${row.year}-${row.month}|${row.parentdealerlpcode}|${row.pl5_code}|${row.upn}`;
    const current = deduped.get(id);
    if (!current) {
      deduped.set(id, {
        id,
        dealerlpcode: row.parentdealerlpcode,
        dealerlpname: row.parentdealerlpname ?? null,
        pl5_code: row.pl5_code,
        pl5_name: row.pl5_name ?? null,
        upn: row.upn,
        year: row.year,
        month: row.month,
      });
      continue;
    }

    if (!current.dealerlpname && row.parentdealerlpname) {
      current.dealerlpname = row.parentdealerlpname;
    }
    if (!current.pl5_name && row.pl5_name) {
      current.pl5_name = row.pl5_name;
    }
  }

  return Array.from(deduped.values()).sort((a, b) =>
    toPeriodMonthKey(b.year, b.month).localeCompare(toPeriodMonthKey(a.year, a.month)) ||
    (a.dealerlpcode ?? "").localeCompare(b.dealerlpcode ?? "") ||
    a.pl5_code.localeCompare(b.pl5_code) ||
    a.upn.localeCompare(b.upn)
  );
}

export async function findLatestAvailablePeriodMonth(): Promise<string | null> {
  const periodGroups = await Promise.all([
    prisma.ods_fcst_lp_pl5_monthly.groupBy({ by: ["year", "month"] }),
    prisma.ods_fcst_t2_pl5_monthly.groupBy({ by: ["year", "month"] }),
    prisma.ods_inventory_dealer_upn.groupBy({ by: ["year", "month"] }),
    prisma.ods_t2_purchase_monthly.groupBy({ by: ["year", "month"] }),
  ]);

  const candidates = periodGroups
    .flat()
    .filter((row) => {
      const year = Number(row.year);
      const month = Number(row.month);
      return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
    })
    .sort(comparePeriodMonthDesc);

  if (candidates.length === 0) return null;
  return toPeriodMonthKey(candidates[0].year, candidates[0].month);
}

export async function listLoadedFcstLpPl5Rows() {
  return prisma.ods_fcst_lp_pl5_monthly.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });
}

export async function listAllLoadedFcstLpPl5Rows() {
  return prisma.ods_fcst_lp_pl5_monthly.findMany({
    select: {
      id: true,
      dealerlpcode: true,
      dealerlpname: true,
      sc_bu: true,
      pl5_code: true,
      pl5_name: true,
      fcst_qty: true,
      year: true,
      month: true,
    },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
      { pl5_name: "asc" },
      { dealerlpname: "asc" },
    ],
  });
}

export async function listLoadedFcstT2Pl5Rows() {
  return prisma.ods_fcst_t2_pl5_monthly.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });
}

export async function listLoadedT2PurchaseRows() {
  return prisma.ods_t2_purchase_monthly.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });
}

export async function listLoadedInventoryRows() {
  return prisma.ods_inventory_dealer_upn.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });
}

export async function listLoadedActiveUpnRows() {
  const rows = await prisma.ods_t2_purchase_monthly.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });

  return dedupeActiveUpnRows(
    rows.map<T2PurchaseRow>((row) => ({
      parentdealerlpcode: row.parentdealerlpcode,
      parentdealerlpname: row.parentdealerlpname,
      sc_bu: row.sc_bu,
      upn: row.upn,
      pl5_code: row.pl5_code,
      pl5_name: row.pl5_name,
      qty: decimalToNumber(row.qty),
      year: row.year,
      month: row.month,
    }))
  );
}

export async function listLoadedDiohTargetRows() {
  return prisma.ods_dioh_dealer_upn.findMany({
    orderBy: [{ dealerlpcode: "asc" }, { upn: "asc" }],
    take: 10000,
  });
}

export async function listLoadedLpPl5AllocateRows() {
  return prisma.ods_lp_pl5_allocate_monthly.findMany({
    orderBy: { period_month: "desc" },
    take: 100,
  });
}

export async function getOdsCalculationData(
  periodMonth: string,
  db: Prisma.TransactionClient = prisma
): Promise<CalculationInput> {
  const { year, month } = getYearMonth(periodMonth);
  const historyPairs = Array.from({ length: 7 }, (_, i) => getYearMonth(getPrevMonth(periodMonth, i)));

  const [t2Purchases, inventories, diohTargets, fcstLpPl5, fcstT2Pl5] =
    await Promise.all([
      db.ods_t2_purchase_monthly.findMany({
        where: {
          OR: historyPairs.flatMap((item) =>
            monthCandidates(item.month).map((candidate) => ({
              year: item.year,
              month: candidate,
            }))
          ),
        },
      }),
      db.ods_inventory_dealer_upn.findMany({
        where: { year, month: { in: monthCandidates(month) } },
      }),
      db.ods_dioh_dealer_upn.findMany(),
      db.ods_fcst_lp_pl5_monthly.findMany({
        where: { year, month: { in: monthCandidates(month) } },
      }),
      db.ods_fcst_t2_pl5_monthly.findMany({
        where: { year, month: { in: monthCandidates(month) } },
      }),
    ]);

  const mappedPurchases = t2Purchases.map<T2PurchaseRow>((row) => ({
    parentdealerlpcode: row.parentdealerlpcode,
    parentdealerlpname: row.parentdealerlpname,
    sc_bu: row.sc_bu,
    upn: row.upn,
    pl5_code: row.pl5_code,
    pl5_name: row.pl5_name,
    qty: decimalToNumber(row.qty),
    year: row.year,
    month: normalizeMonthValue(row.month),
  }));
  return {
    periodMonth,
    t2Purchases: mappedPurchases,
    inventories: inventories.map<InventoryRow>((row) => ({
      dealerlpcode: row.dealerlpcode,
      upn: row.upn,
      qty: decimalToNumber(row.qty),
      year: row.year,
      month: normalizeMonthValue(row.month),
    })),
    diohTargets: diohTargets.map<DiohRow>((row) => ({
      dealerlpcode: row.dealerlpcode,
      upn: row.upn,
      abc_class: row.abc_class,
      dioh_days: decimalToNumber(row.dioh_days),
    })),
    fcstLpPl5: fcstLpPl5.map<FcstLpPl5Row>((row) => ({
      dealerlpcode: row.dealerlpcode,
      dealerlpname: row.dealerlpname,
      sc_bu: row.sc_bu,
      pl5_code: row.pl5_code,
      pl5_name: row.pl5_name,
      fcst_qty: decimalToNumber(row.fcst_qty),
      year: row.year,
      month: normalizeMonthValue(row.month),
    })),
    fcstT2Pl5: fcstT2Pl5.map<FcstT2Pl5Row>((row) => ({
      parentdealerlpcode: row.parentdealerlpcode,
      parentdealerlpname: row.parentdealerlpname,
      sc_bu: row.sc_bu,
      pl5_code: row.pl5_code,
      pl5_name: row.pl5_name,
      fcst_qty: decimalToNumber(row.fcst_qty),
      year: row.year,
      month: normalizeMonthValue(row.month),
    })),
    activeUpns: [],
  };
}
