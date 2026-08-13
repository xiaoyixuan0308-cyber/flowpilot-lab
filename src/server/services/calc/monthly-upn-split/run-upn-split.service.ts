import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateUpnSplitArtifacts } from "./upn-split.engine";
import {
  acquireCalculationLock,
  persistRunUpnSplitArtifactsWithClient,
} from "@/server/repositories";
import { loadCalculationInput } from "./p0/load-calculation-input";
import { buildP1_5ScopeStatusArtifacts } from "./p1_5/scope-status-artifacts";
import { buildRunUpnSplitResponse } from "./run-upn-split-response";
import { getUpnSplitErrorDefinition, type UpnSplitErrorCode } from "@/server/constants/upn-split-error-catalog";

function toScopeActiveUpns(periodMonth: string, rows: { scBu: string; lpCode: string; pl5Code: string; upn: string; hasQuota: boolean }[]) {
  const [year, rawMonth] = periodMonth.slice(0, 10).split("-").slice(0, 2);
  const month = String(Number(rawMonth));
  return rows.map((row) => ({
    sc_bu: row.scBu,
    dealerlpcode: row.lpCode,
    pl5_code: row.pl5Code,
    upn: row.upn,
    year,
    month,
    has_quota: row.hasQuota,
  }));
}

export async function runUpnSplitWithClient(
  db: Prisma.TransactionClient,
  periodMonth: string
) {
  await acquireCalculationLock(db, "monthly-upn-split", periodMonth);
  const odsData = await loadCalculationInput(periodMonth, db);
  const scopeArtifacts = buildP1_5ScopeStatusArtifacts(odsData);

  const activeUpns = toScopeActiveUpns(
    periodMonth,
    scopeArtifacts.lpPl5UpnStatusRows.filter((row) => {
      if (!row.errorCode) return true;
      return !getUpnSplitErrorDefinition(row.errorCode as UpnSplitErrorCode).shouldSkipCalc;
    })
  );

  const { results, traces } = calculateUpnSplitArtifacts({
    periodMonth,
    t2Purchases: odsData.t2Purchases,
    inventories: odsData.inventories,
    diohTargets: odsData.diohTargets,
    fcstLpPl5: odsData.fcstLpPl5,
    fcstT2Pl5: odsData.fcstT2Pl5,
    activeUpns,
  });

  await persistRunUpnSplitArtifactsWithClient(db, periodMonth, scopeArtifacts, results, traces);

  return buildRunUpnSplitResponse(periodMonth, scopeArtifacts, results);
}

export async function runUpnSplit(periodMonth: string) {
  return prisma.$transaction(
    (tx) => runUpnSplitWithClient(tx, periodMonth),
    { maxWait: 10_000, timeout: 120_000 }
  );
}
