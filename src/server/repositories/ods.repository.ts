import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CalculationInput,
  DiohRow,
  FcstChannelCategoryRow,
  FcstT2CategoryRow,
  InventoryRow,
  T2PurchaseRow,
} from "@/server/services/calc/monthly-sku-split/sku-split.types";

type LoadedActiveSkuRow = {
  id: string;
  dealer_channel_code: string | null;
  dealer_channel_name: string | null;
  category_code: string;
  category_name: string | null;
  sku: string;
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

function dedupeActiveSkuRows(rows: T2PurchaseRow[]): LoadedActiveSkuRow[] {
  const deduped = new Map<string, LoadedActiveSkuRow>();

  for (const row of rows) {
    if (!row.parent_dealer_channel_code || !row.category_code || !row.sku) continue;

    const id = `${row.year}-${row.month}|${row.parent_dealer_channel_code}|${row.category_code}|${row.sku}`;
    const current = deduped.get(id);
    if (!current) {
      deduped.set(id, {
        id,
        dealer_channel_code: row.parent_dealer_channel_code,
        dealer_channel_name: row.parent_dealer_channel_name ?? null,
        category_code: row.category_code,
        category_name: row.category_name ?? null,
        sku: row.sku,
        year: row.year,
        month: row.month,
      });
      continue;
    }

    if (!current.dealer_channel_name && row.parent_dealer_channel_name) {
      current.dealer_channel_name = row.parent_dealer_channel_name;
    }
    if (!current.category_name && row.category_name) {
      current.category_name = row.category_name;
    }
  }

  return Array.from(deduped.values()).sort((a, b) =>
    toPeriodMonthKey(b.year, b.month).localeCompare(toPeriodMonthKey(a.year, a.month)) ||
    (a.dealer_channel_code ?? "").localeCompare(b.dealer_channel_code ?? "") ||
    a.category_code.localeCompare(b.category_code) ||
    a.sku.localeCompare(b.sku)
  );
}

export async function findLatestAvailablePeriodMonth(): Promise<string | null> {
  const periodGroups = await Promise.all([
    prisma.ods_fcst_channel_category_monthly.groupBy({ by: ["year", "month"] }),
    prisma.ods_fcst_t2_category_monthly.groupBy({ by: ["year", "month"] }),
    prisma.ods_inventory_dealer_sku.groupBy({ by: ["year", "month"] }),
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

export async function listLoadedFcstChannelCategoryRows() {
  return prisma.ods_fcst_channel_category_monthly.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });
}

export async function listAllLoadedFcstChannelCategoryRows() {
  return prisma.ods_fcst_channel_category_monthly.findMany({
    select: {
      id: true,
      dealer_channel_code: true,
      dealer_channel_name: true,
      business_unit: true,
      category_code: true,
      category_name: true,
      fcst_qty: true,
      year: true,
      month: true,
    },
    orderBy: [
      { year: "desc" },
      { month: "desc" },
      { category_name: "asc" },
      { dealer_channel_name: "asc" },
    ],
  });
}

export async function listLoadedFcstT2CategoryRows() {
  return prisma.ods_fcst_t2_category_monthly.findMany({
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
  return prisma.ods_inventory_dealer_sku.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });
}

export async function listLoadedActiveSkuRows() {
  const rows = await prisma.ods_t2_purchase_monthly.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 10000,
  });

  return dedupeActiveSkuRows(
    rows.map<T2PurchaseRow>((row) => ({
      parent_dealer_channel_code: row.parent_dealer_channel_code,
      parent_dealer_channel_name: row.parent_dealer_channel_name,
      business_unit: row.business_unit,
      sku: row.sku,
      category_code: row.category_code,
      category_name: row.category_name,
      qty: decimalToNumber(row.qty),
      year: row.year,
      month: row.month,
    }))
  );
}

export async function listLoadedDiohTargetRows() {
  return prisma.ods_dioh_dealer_sku.findMany({
    orderBy: [{ dealer_channel_code: "asc" }, { sku: "asc" }],
    take: 10000,
  });
}

export async function listLoadedChannelCategoryAllocateRows() {
  return prisma.ods_channel_category_allocate_monthly.findMany({
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

  const [t2Purchases, inventories, diohTargets, fcstChannelCategory, fcstT2Category] =
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
      db.ods_inventory_dealer_sku.findMany({
        where: { year, month: { in: monthCandidates(month) } },
      }),
      db.ods_dioh_dealer_sku.findMany(),
      db.ods_fcst_channel_category_monthly.findMany({
        where: { year, month: { in: monthCandidates(month) } },
      }),
      db.ods_fcst_t2_category_monthly.findMany({
        where: { year, month: { in: monthCandidates(month) } },
      }),
    ]);

  const mappedPurchases = t2Purchases.map<T2PurchaseRow>((row) => ({
    parent_dealer_channel_code: row.parent_dealer_channel_code,
    parent_dealer_channel_name: row.parent_dealer_channel_name,
    business_unit: row.business_unit,
    sku: row.sku,
    category_code: row.category_code,
    category_name: row.category_name,
    qty: decimalToNumber(row.qty),
    year: row.year,
    month: normalizeMonthValue(row.month),
  }));
  return {
    periodMonth,
    t2Purchases: mappedPurchases,
    inventories: inventories.map<InventoryRow>((row) => ({
      dealer_channel_code: row.dealer_channel_code,
      sku: row.sku,
      qty: decimalToNumber(row.qty),
      year: row.year,
      month: normalizeMonthValue(row.month),
    })),
    diohTargets: diohTargets.map<DiohRow>((row) => ({
      dealer_channel_code: row.dealer_channel_code,
      sku: row.sku,
      abc_class: row.abc_class,
      dioh_days: decimalToNumber(row.dioh_days),
    })),
    fcstChannelCategory: fcstChannelCategory.map<FcstChannelCategoryRow>((row) => ({
      dealer_channel_code: row.dealer_channel_code,
      dealer_channel_name: row.dealer_channel_name,
      business_unit: row.business_unit,
      category_code: row.category_code,
      category_name: row.category_name,
      fcst_qty: decimalToNumber(row.fcst_qty),
      year: row.year,
      month: normalizeMonthValue(row.month),
    })),
    fcstT2Category: fcstT2Category.map<FcstT2CategoryRow>((row) => ({
      parent_dealer_channel_code: row.parent_dealer_channel_code,
      parent_dealer_channel_name: row.parent_dealer_channel_name,
      business_unit: row.business_unit,
      category_code: row.category_code,
      category_name: row.category_name,
      fcst_qty: decimalToNumber(row.fcst_qty),
      year: row.year,
      month: normalizeMonthValue(row.month),
    })),
    activeSkus: [],
  };
}
