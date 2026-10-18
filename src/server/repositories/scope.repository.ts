import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildScopeArtifacts } from "@/server/services/scope";
import type { ActiveSkuRow } from "@/server/services/calc/monthly-sku-split/sku-split.types";
import type {
  ScopeArtifacts,
} from "@/server/services/scope/scope.types";
import { getSkuSplitErrorIdMap } from "./error.repository";
import { getSkuSplitErrorMessage } from "@/server/constants/sku-split-error-catalog";
import type { SkuSplitErrorCode } from "@/server/constants/sku-split-error-catalog";
import { findLatestAvailablePeriodMonth, getOdsCalculationData } from "./ods.repository";

function toPeriodDate(periodMonth: string) {
  return new Date(`${periodMonth}T08:00:00+08:00`);
}

function toNullableDecimal(value: number | null) {
  return value === null ? null : value;
}

export async function replaceScopeArtifacts(
  periodMonth: string,
  artifacts: ScopeArtifacts,
  db: Prisma.TransactionClient = prisma
) {
  const periodDate = toPeriodDate(periodMonth);
  const scopeErrorCodes = Array.from(
    new Set(
      [...artifacts.channelCategoryStatusRows, ...artifacts.channelCategorySkuStatusRows]
        .map((row) => row.errorCode)
        .filter((code): code is SkuSplitErrorCode => Boolean(code))
    )
  );
  const errorIdMap = await getSkuSplitErrorIdMap(scopeErrorCodes, db);

  await db.list_channel_category_sku_status_monthly.deleteMany({ where: { period_month: periodDate } });
  await db.bridge_category_sku_scope_monthly.deleteMany({ where: { period_month: periodDate } });
  await db.list_channel_category_status_monthly.deleteMany({ where: { period_month: periodDate } });
  await db.bridge_channel_category_scope_monthly.deleteMany({ where: { period_month: periodDate } });

  if (artifacts.channelCategoryScopeRows.length > 0) {
    await db.bridge_channel_category_scope_monthly.createMany({
      data: artifacts.channelCategoryScopeRows.map((row) => ({
        period_month: periodDate,
        business_unit: row.businessUnit,
        channel_code: row.channelCode,
        channel_name: row.channelName,
        category_code: row.categoryCode,
        category_name: row.categoryName,
        scope_source: row.scopeSource,
      })),
      skipDuplicates: true,
    });
  }

  if (artifacts.channelCategoryStatusRows.length > 0) {
    await db.list_channel_category_status_monthly.createMany({
      data: artifacts.channelCategoryStatusRows.map((row) => ({
        period_month: periodDate,
        business_unit: row.businessUnit,
        channel_code: row.channelCode,
        channel_name: row.channelName,
        category_code: row.categoryCode,
        category_name: row.categoryName,
        has_quota: row.hasQuota,
        has_history: row.hasHistory,
        quota_qty: toNullableDecimal(row.quotaQty),
        history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
        status_note: row.statusNote,
        error_id: row.errorCode ? errorIdMap.get(row.errorCode as SkuSplitErrorCode) ?? null : null,
      })),
      skipDuplicates: true,
    });
  }

  if (artifacts.categorySkuScopeRows.length > 0) {
    await db.bridge_category_sku_scope_monthly.createMany({
      data: artifacts.categorySkuScopeRows.map((row) => ({
        period_month: periodDate,
        business_unit: row.businessUnit,
        category_code: row.categoryCode,
        category_name: row.categoryName,
        sku: row.sku,
        sku_source: row.skuSource,
      })),
      skipDuplicates: true,
    });
  }

  if (artifacts.channelCategorySkuStatusRows.length > 0) {
    await db.list_channel_category_sku_status_monthly.createMany({
      data: artifacts.channelCategorySkuStatusRows.map((row) => ({
        period_month: periodDate,
        business_unit: row.businessUnit,
        channel_code: row.channelCode,
        channel_name: row.channelName,
        category_code: row.categoryCode,
        category_name: row.categoryName,
        sku: row.sku,
        has_quota: row.hasQuota,
        has_history: row.hasHistory,
        quota_qty: toNullableDecimal(row.quotaQty),
        history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
        status_note: row.statusNote,
        error_id: row.errorCode ? errorIdMap.get(row.errorCode as SkuSplitErrorCode) ?? null : null,
      })),
      skipDuplicates: true,
    });
  }
}

export async function getSkuStatusRowsAsActiveSkus(periodMonth: string): Promise<ActiveSkuRow[]> {
  const periodDate = toPeriodDate(periodMonth);
  const periodMonthString = periodMonth.slice(0, 10);
  const [year, month] = periodMonthString.split("-").slice(0, 2);

  const rows = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: {
      period_month: periodDate,
      OR: [
        { error_id: null },
        {
          error_catalog: {
            is: {
              should_skip_calc: false,
            },
          },
        },
      ],
    },
  });

  return rows.map((row) => ({
    business_unit: row.business_unit,
    dealer_channel_code: row.channel_code,
    category_code: row.category_code,
    sku: row.sku,
    year,
    month,
  }));
}

export async function listLoadedChannelCategoryStatusRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);
  const errorCodes = Array.from(
    new Set(
      artifacts.channelCategoryStatusRows
        .map((row) => row.errorCode)
        .filter((code): code is SkuSplitErrorCode => Boolean(code))
    )
  );
  const errorIdMap = await getSkuSplitErrorIdMap(errorCodes);

  return artifacts.channelCategoryStatusRows
    .map((row) => ({
      period_month: periodDate,
      business_unit: row.businessUnit,
      channel_code: row.channelCode,
      channel_name: row.channelName,
      category_code: row.categoryCode,
      category_name: row.categoryName,
      has_quota: row.hasQuota,
      has_history: row.hasHistory,
      quota_qty: toNullableDecimal(row.quotaQty),
      history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
      status_note: row.statusNote,
      error_id: row.errorCode ? errorIdMap.get(row.errorCode as SkuSplitErrorCode) ?? null : null,
      error_message: row.errorCode ? getSkuSplitErrorMessage(row.errorCode as SkuSplitErrorCode) : "",
    }))
    .sort((a, b) =>
      a.channel_code.localeCompare(b.channel_code) || a.category_code.localeCompare(b.category_code)
    );
}

export async function listLoadedChannelCategoryScopeRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);

  return artifacts.channelCategoryScopeRows
    .map((row) => ({
      period_month: periodDate,
      business_unit: row.businessUnit,
      channel_code: row.channelCode,
      channel_name: row.channelName,
      category_code: row.categoryCode,
      category_name: row.categoryName,
      scope_source: row.scopeSource,
    }))
    .sort((a, b) =>
      a.channel_code.localeCompare(b.channel_code) || a.category_code.localeCompare(b.category_code)
    );
}

export async function listLoadedChannelCategorySkuStatusRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);
  const errorCodes = Array.from(
    new Set(
      artifacts.channelCategorySkuStatusRows
        .map((row) => row.errorCode)
        .filter((code): code is SkuSplitErrorCode => Boolean(code))
    )
  );
  const errorIdMap = await getSkuSplitErrorIdMap(errorCodes);

  return artifacts.channelCategorySkuStatusRows
    .map((row) => ({
      period_month: periodDate,
      business_unit: row.businessUnit,
      channel_code: row.channelCode,
      channel_name: row.channelName,
      category_code: row.categoryCode,
      category_name: row.categoryName,
      sku: row.sku,
      has_quota: row.hasQuota,
      has_history: row.hasHistory,
      quota_qty: toNullableDecimal(row.quotaQty),
      history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
      status_note: row.statusNote,
      error_id: row.errorCode ? errorIdMap.get(row.errorCode as SkuSplitErrorCode) ?? null : null,
      error_message: row.errorCode ? getSkuSplitErrorMessage(row.errorCode as SkuSplitErrorCode) : "",
    }))
    .sort((a, b) =>
      a.channel_code.localeCompare(b.channel_code) ||
      a.category_code.localeCompare(b.category_code) ||
      a.sku.localeCompare(b.sku)
    );
}

export async function listLoadedCategorySkuScopeRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);

  return artifacts.categorySkuScopeRows
    .map((row) => ({
      period_month: periodDate,
      business_unit: row.businessUnit,
      category_code: row.categoryCode,
      category_name: row.categoryName,
      sku: row.sku,
      sku_source: row.skuSource,
    }))
    .sort((a, b) =>
      a.category_code.localeCompare(b.category_code) || a.sku.localeCompare(b.sku)
    );
}
