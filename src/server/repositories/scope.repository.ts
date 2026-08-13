import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildScopeArtifacts } from "@/server/services/scope";
import type { ActiveUpnRow } from "@/server/services/calc/monthly-upn-split/upn-split.types";
import type {
  ScopeArtifacts,
} from "@/server/services/scope/scope.types";
import { getUpnSplitErrorIdMap } from "./error.repository";
import { getUpnSplitErrorMessage } from "@/server/constants/upn-split-error-catalog";
import type { UpnSplitErrorCode } from "@/server/constants/upn-split-error-catalog";
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
      [...artifacts.lpPl5StatusRows, ...artifacts.lpPl5UpnStatusRows]
        .map((row) => row.errorCode)
        .filter((code): code is UpnSplitErrorCode => Boolean(code))
    )
  );
  const errorIdMap = await getUpnSplitErrorIdMap(scopeErrorCodes, db);

  await db.list_lp_pl5_upn_status_monthly.deleteMany({ where: { period_month: periodDate } });
  await db.bridge_pl5_upn_scope_monthly.deleteMany({ where: { period_month: periodDate } });
  await db.list_lp_pl5_status_monthly.deleteMany({ where: { period_month: periodDate } });
  await db.bridge_lp_pl5_scope_monthly.deleteMany({ where: { period_month: periodDate } });

  if (artifacts.lpPl5ScopeRows.length > 0) {
    await db.bridge_lp_pl5_scope_monthly.createMany({
      data: artifacts.lpPl5ScopeRows.map((row) => ({
        period_month: periodDate,
        sc_bu: row.scBu,
        lp_code: row.lpCode,
        lp_name: row.lpName,
        pl5_code: row.pl5Code,
        pl5_name: row.pl5Name,
        scope_source: row.scopeSource,
      })),
      skipDuplicates: true,
    });
  }

  if (artifacts.lpPl5StatusRows.length > 0) {
    await db.list_lp_pl5_status_monthly.createMany({
      data: artifacts.lpPl5StatusRows.map((row) => ({
        period_month: periodDate,
        sc_bu: row.scBu,
        lp_code: row.lpCode,
        lp_name: row.lpName,
        pl5_code: row.pl5Code,
        pl5_name: row.pl5Name,
        has_quota: row.hasQuota,
        has_history: row.hasHistory,
        quota_qty: toNullableDecimal(row.quotaQty),
        history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
        status_note: row.statusNote,
        error_id: row.errorCode ? errorIdMap.get(row.errorCode as UpnSplitErrorCode) ?? null : null,
      })),
      skipDuplicates: true,
    });
  }

  if (artifacts.pl5UpnScopeRows.length > 0) {
    await db.bridge_pl5_upn_scope_monthly.createMany({
      data: artifacts.pl5UpnScopeRows.map((row) => ({
        period_month: periodDate,
        sc_bu: row.scBu,
        pl5_code: row.pl5Code,
        pl5_name: row.pl5Name,
        upn: row.upn,
        upn_source: row.upnSource,
      })),
      skipDuplicates: true,
    });
  }

  if (artifacts.lpPl5UpnStatusRows.length > 0) {
    await db.list_lp_pl5_upn_status_monthly.createMany({
      data: artifacts.lpPl5UpnStatusRows.map((row) => ({
        period_month: periodDate,
        sc_bu: row.scBu,
        lp_code: row.lpCode,
        lp_name: row.lpName,
        pl5_code: row.pl5Code,
        pl5_name: row.pl5Name,
        upn: row.upn,
        has_quota: row.hasQuota,
        has_history: row.hasHistory,
        quota_qty: toNullableDecimal(row.quotaQty),
        history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
        status_note: row.statusNote,
        error_id: row.errorCode ? errorIdMap.get(row.errorCode as UpnSplitErrorCode) ?? null : null,
      })),
      skipDuplicates: true,
    });
  }
}

export async function getUpnStatusRowsAsActiveUpns(periodMonth: string): Promise<ActiveUpnRow[]> {
  const periodDate = toPeriodDate(periodMonth);
  const periodMonthString = periodMonth.slice(0, 10);
  const [year, month] = periodMonthString.split("-").slice(0, 2);

  const rows = await prisma.list_lp_pl5_upn_status_monthly.findMany({
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
    sc_bu: row.sc_bu,
    dealerlpcode: row.lp_code,
    pl5_code: row.pl5_code,
    upn: row.upn,
    year,
    month,
  }));
}

export async function listLoadedLpPl5StatusRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);
  const errorCodes = Array.from(
    new Set(
      artifacts.lpPl5StatusRows
        .map((row) => row.errorCode)
        .filter((code): code is UpnSplitErrorCode => Boolean(code))
    )
  );
  const errorIdMap = await getUpnSplitErrorIdMap(errorCodes);

  return artifacts.lpPl5StatusRows
    .map((row) => ({
      period_month: periodDate,
      sc_bu: row.scBu,
      lp_code: row.lpCode,
      lp_name: row.lpName,
      pl5_code: row.pl5Code,
      pl5_name: row.pl5Name,
      has_quota: row.hasQuota,
      has_history: row.hasHistory,
      quota_qty: toNullableDecimal(row.quotaQty),
      history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
      status_note: row.statusNote,
      error_id: row.errorCode ? errorIdMap.get(row.errorCode as UpnSplitErrorCode) ?? null : null,
      error_message: row.errorCode ? getUpnSplitErrorMessage(row.errorCode as UpnSplitErrorCode) : "",
    }))
    .sort((a, b) =>
      a.lp_code.localeCompare(b.lp_code) || a.pl5_code.localeCompare(b.pl5_code)
    );
}

export async function listLoadedLpPl5ScopeRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);

  return artifacts.lpPl5ScopeRows
    .map((row) => ({
      period_month: periodDate,
      sc_bu: row.scBu,
      lp_code: row.lpCode,
      lp_name: row.lpName,
      pl5_code: row.pl5Code,
      pl5_name: row.pl5Name,
      scope_source: row.scopeSource,
    }))
    .sort((a, b) =>
      a.lp_code.localeCompare(b.lp_code) || a.pl5_code.localeCompare(b.pl5_code)
    );
}

export async function listLoadedLpPl5UpnStatusRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);
  const errorCodes = Array.from(
    new Set(
      artifacts.lpPl5UpnStatusRows
        .map((row) => row.errorCode)
        .filter((code): code is UpnSplitErrorCode => Boolean(code))
    )
  );
  const errorIdMap = await getUpnSplitErrorIdMap(errorCodes);

  return artifacts.lpPl5UpnStatusRows
    .map((row) => ({
      period_month: periodDate,
      sc_bu: row.scBu,
      lp_code: row.lpCode,
      lp_name: row.lpName,
      pl5_code: row.pl5Code,
      pl5_name: row.pl5Name,
      upn: row.upn,
      has_quota: row.hasQuota,
      has_history: row.hasHistory,
      quota_qty: toNullableDecimal(row.quotaQty),
      history_qty_m6_m1: toNullableDecimal(row.historyQtyM6M1),
      status_note: row.statusNote,
      error_id: row.errorCode ? errorIdMap.get(row.errorCode as UpnSplitErrorCode) ?? null : null,
      error_message: row.errorCode ? getUpnSplitErrorMessage(row.errorCode as UpnSplitErrorCode) : "",
    }))
    .sort((a, b) =>
      a.lp_code.localeCompare(b.lp_code) ||
      a.pl5_code.localeCompare(b.pl5_code) ||
      a.upn.localeCompare(b.upn)
    );
}

export async function listLoadedPl5UpnScopeRows() {
  const periodMonth = await findLatestAvailablePeriodMonth();
  if (!periodMonth) return [];

  const source = await getOdsCalculationData(periodMonth);
  const artifacts = buildScopeArtifacts(source);
  const periodDate = toPeriodDate(periodMonth);

  return artifacts.pl5UpnScopeRows
    .map((row) => ({
      period_month: periodDate,
      sc_bu: row.scBu,
      pl5_code: row.pl5Code,
      pl5_name: row.pl5Name,
      upn: row.upn,
      upn_source: row.upnSource,
    }))
    .sort((a, b) =>
      a.pl5_code.localeCompare(b.pl5_code) || a.upn.localeCompare(b.upn)
    );
}
