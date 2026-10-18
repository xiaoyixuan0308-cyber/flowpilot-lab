import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateSkuSplitArtifacts } from "./sku-split.engine";
import {
  acquireCalculationLock,
  persistRunSkuSplitArtifactsWithClient,
} from "@/server/repositories";
import { loadCalculationInput } from "./p0/load-calculation-input";
import { buildP1_5ScopeStatusArtifacts } from "./p1_5/scope-status-artifacts";
import { buildRunSkuSplitResponse } from "./run-sku-split-response";
import { getSkuSplitErrorDefinition, type SkuSplitErrorCode } from "@/server/constants/sku-split-error-catalog";

function toScopeActiveSkus(periodMonth: string, rows: { businessUnit: string; channelCode: string; categoryCode: string; sku: string; hasQuota: boolean }[]) {
  const [year, rawMonth] = periodMonth.slice(0, 10).split("-").slice(0, 2);
  const month = String(Number(rawMonth));
  return rows.map((row) => ({
    business_unit: row.businessUnit,
    dealer_channel_code: row.channelCode,
    category_code: row.categoryCode,
    sku: row.sku,
    year,
    month,
    has_quota: row.hasQuota,
  }));
}

export async function runSkuSplitWithClient(
  db: Prisma.TransactionClient,
  periodMonth: string
) {
  await acquireCalculationLock(db, "monthly-sku-split", periodMonth);
  const odsData = await loadCalculationInput(periodMonth, db);
  const scopeArtifacts = buildP1_5ScopeStatusArtifacts(odsData);

  const activeSkus = toScopeActiveSkus(
    periodMonth,
    scopeArtifacts.channelCategorySkuStatusRows.filter((row) => {
      if (!row.errorCode) return true;
      return !getSkuSplitErrorDefinition(row.errorCode as SkuSplitErrorCode).shouldSkipCalc;
    })
  );

  const { results, traces } = calculateSkuSplitArtifacts({
    periodMonth,
    t2Purchases: odsData.t2Purchases,
    inventories: odsData.inventories,
    diohTargets: odsData.diohTargets,
    fcstChannelCategory: odsData.fcstChannelCategory,
    fcstT2Category: odsData.fcstT2Category,
    activeSkus,
  });

  await persistRunSkuSplitArtifactsWithClient(db, periodMonth, scopeArtifacts, results, traces);

  return buildRunSkuSplitResponse(periodMonth, scopeArtifacts, results);
}

export async function runSkuSplit(periodMonth: string) {
  return prisma.$transaction(
    (tx) => runSkuSplitWithClient(tx, periodMonth),
    { maxWait: 10_000, timeout: 120_000 }
  );
}
