import { prisma } from "@/lib/prisma";

export type SupplyChainExceptionKey =
  | "demandSurge"
  | "arrivalDelay"
  | "supplyShortage"
  | "inventoryBacklog"
  | "constraintConflict"
  | "dataQuality";

export type SupplyChainExceptionGroup = {
  count: number;
  skus: string[];
};

export type SupplyChainOverview = {
  calendarDate: string | null;
  skuCount: number;
  categoryCount: number;
  businessUnitCount: number;
  anomalySkuCount: number;
  intransitQty: number;
  intransitSkuCount: number;
  constraintTypeCount: number;
  constrainedSkuCount: number;
  exceptions: Record<SupplyChainExceptionKey, SupplyChainExceptionGroup>;
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}

function asNumber(value: unknown) {
  return value === null || value === undefined ? 0 : Number(value);
}

export async function loadSupplyChainOverview(): Promise<SupplyChainOverview> {
  const latestBatch = await prisma.calc_weekly_sku_split_batch.findFirst({
    orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
    select: {
      calendar_date: true,
      total_skus: true,
      results: {
        select: {
          sku: true,
          category_code: true,
          business_unit: true,
          inventory_status: true,
          unit_price: true,
          safety_stock_qty: true,
          constraint_types: true,
          adjustment_allowed_flag: true,
          month_quota_qty: true,
          bj_t2_purchase_3m_avg_qty: true,
          ab_current_inventory_days: true,
          post_suggest_dioh: true,
        },
      },
    },
  });

  const calendarDate = latestBatch?.calendar_date ?? null;
  const delayThreshold = calendarDate
    ? new Date(calendarDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const [intransit, intransitRows, constraints, delayedRows] = await Promise.all([
    prisma.ods_central_warehouse_sku_intransit.aggregate({ _sum: { intransit_qty: true } }),
    prisma.ods_central_warehouse_sku_intransit.findMany({
      distinct: ["material"],
      select: { material: true },
    }),
    prisma.ods_sku_constraint_manual.findMany({
      select: { sku: true, constraint_type: true },
    }),
    delayThreshold
      ? prisma.ods_central_warehouse_sku_intransit.findMany({
          where: { forecast_date: { gt: delayThreshold } },
          distinct: ["material"],
          select: { material: true },
        })
      : Promise.resolve([]),
  ]);

  const rows = latestBatch?.results ?? [];
  const demandSurge = unique(
    rows
      .filter((row) => {
        const average = asNumber(row.bj_t2_purchase_3m_avg_qty);
        return average > 0 && asNumber(row.month_quota_qty) > average * 1.3;
      })
      .map((row) => row.sku),
  );
  const arrivalDelay = unique(delayedRows.map((row) => row.material));
  const supplyShortage = unique(
    rows.filter((row) => row.inventory_status === "STOP").map((row) => row.sku),
  );
  const inventoryBacklog = unique(
    rows
      .filter(
        (row) =>
          asNumber(row.post_suggest_dioh) > 90 ||
          asNumber(row.ab_current_inventory_days) > 90,
      )
      .map((row) => row.sku),
  );
  const constraintConflict = unique(
    rows
      .filter(
        (row) =>
          Boolean(row.constraint_types?.trim()) &&
          row.adjustment_allowed_flag === "N",
      )
      .map((row) => row.sku),
  );
  const dataQuality = unique(
    rows
      .filter((row) => row.unit_price === null || row.safety_stock_qty === null)
      .map((row) => row.sku),
  );
  const allAnomalySkus = unique([
    ...demandSurge,
    ...arrivalDelay,
    ...supplyShortage,
    ...inventoryBacklog,
    ...constraintConflict,
    ...dataQuality,
  ]);

  const group = (skus: string[]): SupplyChainExceptionGroup => ({
    count: skus.length,
    skus,
  });

  return {
    calendarDate: calendarDate?.toISOString().slice(0, 10) ?? null,
    skuCount: latestBatch?.total_skus ?? 0,
    categoryCount: new Set(rows.map((row) => row.category_code)).size,
    businessUnitCount: new Set(rows.map((row) => row.business_unit)).size,
    anomalySkuCount: allAnomalySkus.length,
    intransitQty: asNumber(intransit._sum.intransit_qty),
    intransitSkuCount: intransitRows.length,
    constraintTypeCount: new Set(constraints.map((row) => row.constraint_type)).size,
    constrainedSkuCount: new Set(constraints.map((row) => row.sku)).size,
    exceptions: {
      demandSurge: group(demandSurge),
      arrivalDelay: group(arrivalDelay),
      supplyShortage: group(supplyShortage),
      inventoryBacklog: group(inventoryBacklog),
      constraintConflict: group(constraintConflict),
      dataQuality: group(dataQuality),
    },
  };
}
