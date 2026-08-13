import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  UpnSplitResult,
  UpnSplitTraceRow,
} from "@/server/services/calc/monthly-upn-split/upn-split.types";
import type { ScopeArtifacts } from "@/server/services/scope/scope.types";
import { replaceScopeArtifacts } from "./scope.repository";
import { getUpnSplitErrorIdMap } from "./error.repository";
import type { UpnSplitErrorCode } from "@/server/constants/upn-split-error-catalog";
import { acquireCalculationLock } from "./calculation-lock.repository";

function toNullableDecimal(value: number | null | undefined) {
  return value === null || value === undefined ? null : value;
}

function toPeriodDate(periodMonth: string) {
  return new Date(`${periodMonth}T08:00:00+08:00`);
}

function toYearMonthCandidates(periodMonth: string) {
  const [year, rawMonth] = periodMonth.slice(0, 10).split("-").slice(0, 2);
  const month = String(Number(rawMonth));
  const months = Array.from(new Set([rawMonth, month]));
  return { year, months };
}

function putName(target: Record<string, string>, code: string | null | undefined, name: string | null | undefined) {
  if (!code || !name || target[code]) return;
  target[code] = name;
}

const CALC_TRACE_CREATE_MANY_CHUNK_SIZE = 500;
const UTC_PLUS_8_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toUtcPlus8Parts(date: Date) {
  const shifted = new Date(date.getTime() + UTC_PLUS_8_OFFSET_MS);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function formatDateUtc8(date: Date) {
  const parts = toUtcPlus8Parts(date);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

type TraceNumber = number | string | null;

export interface CalcTraceRowRecord {
  batch_id: string;
  period_month: Date;
  sc_bu: string;
  dealerlpcode: string;
  pl5_code: string;
  upn: string;
  lp_code: string | null;
  h_t2_purchase_mtd: TraceNumber;
  e_t2_mix_portion: TraceNumber;
  t_pl5_purchase_m2: TraceNumber;
  u_pl5_purchase_m1: TraceNumber;
  v_pl5_purchase_m0_fcst: TraceNumber;
  f_t2_purchase_3m_avg: TraceNumber;
  g_t2_purchase_m0: TraceNumber;
  j_opening_inventory: TraceNumber;
  k_target_days: TraceNumber;
  l_tolerance: boolean | null;
  i_t2_purchase_mtg: TraceNumber;
  current_dioh: TraceNumber;
  replenish_gap_to_30_qty: TraceNumber;
  w_mtg_allocate_qty: TraceNumber;
  j_star_pl5_inventory: TraceNumber;
  i_star_pl5_mtg: TraceNumber;
  x_after_allocate_days: TraceNumber;
  m_original_target_inventory: TraceNumber;
  n_new_target_inventory: TraceNumber;
  o_final_target_inventory: TraceNumber;
  p_theoretical_replenish: TraceNumber;
  q_actual_theoretical: TraceNumber;
  q_star_pl5_theoretical: TraceNumber;
  r_base_replenish: TraceNumber;
  s_tolerance_replenish: TraceNumber;
  t_adjusted_dioh: TraceNumber;
  is_error: boolean;
  error_message: string | null;
  error_id: string | null;
  created_at: Date | null;
}

export async function createCalcBatch(
  periodMonth: string,
  db: Prisma.TransactionClient = prisma
) {
  const calculatedAt = new Date();

  return db.calc_batch.create({
    data: {
      period_month: toPeriodDate(periodMonth),
      status: "SUCCESS",
      total_upns: 0,
      error_upns: 0,
      calculated_at: calculatedAt,
    },
  });
}

export async function replaceCalcResults(
  batchId: string,
  results: UpnSplitResult[],
  db: Prisma.TransactionClient = prisma
) {
  const errorCodes = Array.from(
    new Set(results.map((row) => row.errorCode).filter((code): code is UpnSplitErrorCode => Boolean(code)))
  );
  const errorIdMap = await getUpnSplitErrorIdMap(errorCodes, db);

  await db.calc_upn_split_result.deleteMany({
    where: { batch_id: batchId },
  });

  if (results.length > 0) {
    await db.calc_upn_split_result.createMany({
      data: results.map((row) => ({
        batch_id: batchId,
        sc_bu: row.scBu,
        dealerlpcode: row.dealerlpcode,
        upn: row.upn,
        pl5_code: row.pl5Code,
        lp_code: row.lpCode,
        e_t2_mix_portion: toNullableDecimal(row.e_t2MixPortion),
        f_t2_purchase_3m_avg: toNullableDecimal(row.f_t2Purchase3mAvg),
        g_t2_purchase_m0: toNullableDecimal(row.g_t2PurchaseM0),
        h_t2_purchase_mtd: toNullableDecimal(row.h_t2PurchaseMtd),
        i_t2_purchase_mtg: toNullableDecimal(row.i_t2PurchaseMtg),
        j_opening_inventory: toNullableDecimal(row.j_openingInventory),
        k_target_days: toNullableDecimal(row.k_targetDays),
        l_tolerance: row.l_tolerance,
        i_star_pl5_mtg: toNullableDecimal(row.iStarPl5Mtg),
        j_star_pl5_inventory: toNullableDecimal(row.jStarPl5Inventory),
        x_after_allocate_days: toNullableDecimal(row.x_afterAllocateDays),
        m_original_target_inventory: toNullableDecimal(row.m_originalTargetInventory),
        n_new_target_inventory: toNullableDecimal(row.n_newTargetInventory),
        o_final_target_inventory: toNullableDecimal(row.o_finalTargetInventory),
        p_theoretical_replenish: toNullableDecimal(row.p_theoreticalReplenish),
        q_actual_theoretical: toNullableDecimal(row.q_actualTheoretical),
        q_star_pl5_theoretical: toNullableDecimal(row.qStarPl5Theoretical),
        w_mtg_allocate_qty: toNullableDecimal(row.w_mtgAllocateQty),
        r_base_replenish: toNullableDecimal(row.r_baseReplenish),
        s_tolerance_replenish: toNullableDecimal(row.s_toleranceReplenish),
        t_adjusted_dioh: toNullableDecimal(row.t_adjustedDioh),
        current_dioh: toNullableDecimal(row.currentDioh),
        replenish_gap_to_30_qty: toNullableDecimal(row.replenishGapTo30Qty),
        is_error: row.isError,
        error_message: row.errorMessage ?? null,
        error_id: row.errorCode ? errorIdMap.get(row.errorCode) ?? null : null,
      })),
    });
  }

  const errorUpns = results.filter((row) => row.isError).length;
  const calculatedAt = new Date();
  await db.calc_batch.update({
    where: { id: batchId },
    data: {
      total_upns: results.length,
      error_upns: errorUpns,
      calculated_at: calculatedAt,
      status: errorUpns > 0 ? "PARTIAL" : "SUCCESS",
    },
  });
}

export async function replaceCalcTraceRows(
  batchId: string,
  periodMonth: string,
  traces: UpnSplitTraceRow[],
  db: Prisma.TransactionClient = prisma
) {
  const errorCodes = Array.from(
    new Set(traces.map((row) => row.errorCode).filter((code): code is UpnSplitErrorCode => Boolean(code)))
  );
  const errorIdMap = await getUpnSplitErrorIdMap(errorCodes, db);

  await db.$executeRaw`
    DELETE FROM poc.calc_upn_split_trace
    WHERE batch_id = CAST(${batchId} AS uuid)
  `;

  if (traces.length === 0) {
    return;
  }

  const periodDate = toPeriodDate(periodMonth);
  const rows = traces.map((row) => ({
    batch_id: batchId,
    period_month: periodDate,
    sc_bu: row.scBu,
    dealerlpcode: row.dealerlpcode,
    pl5_code: row.pl5Code,
    upn: row.upn,
    lp_code: row.lpCode,
    h_t2_purchase_mtd: toNullableDecimal(row.h_t2PurchaseMtd),
    e_t2_mix_portion: toNullableDecimal(row.e_t2MixPortion),
    t_pl5_purchase_m2: toNullableDecimal(row.t_pl5PurchaseM2),
    u_pl5_purchase_m1: toNullableDecimal(row.u_pl5PurchaseM1),
    v_pl5_purchase_m0_fcst: toNullableDecimal(row.v_pl5PurchaseM0Fcst),
    f_t2_purchase_3m_avg: toNullableDecimal(row.f_t2Purchase3mAvg),
    g_t2_purchase_m0: toNullableDecimal(row.g_t2PurchaseM0),
    j_opening_inventory: toNullableDecimal(row.j_openingInventory),
    k_target_days: toNullableDecimal(row.k_targetDays),
    l_tolerance: row.l_tolerance,
    i_t2_purchase_mtg: toNullableDecimal(row.i_t2PurchaseMtg),
    current_dioh: toNullableDecimal(row.currentDioh),
    replenish_gap_to_30_qty: toNullableDecimal(row.replenishGapTo30Qty),
    w_mtg_allocate_qty: toNullableDecimal(row.w_mtgAllocateQty),
    j_star_pl5_inventory: toNullableDecimal(row.jStarPl5Inventory),
    i_star_pl5_mtg: toNullableDecimal(row.iStarPl5Mtg),
    x_after_allocate_days: toNullableDecimal(row.x_afterAllocateDays),
    m_original_target_inventory: toNullableDecimal(row.m_originalTargetInventory),
    n_new_target_inventory: toNullableDecimal(row.n_newTargetInventory),
    o_final_target_inventory: toNullableDecimal(row.o_finalTargetInventory),
    p_theoretical_replenish: toNullableDecimal(row.p_theoreticalReplenish),
    q_actual_theoretical: toNullableDecimal(row.q_actualTheoretical),
    q_star_pl5_theoretical: toNullableDecimal(row.qStarPl5Theoretical),
    r_base_replenish: toNullableDecimal(row.r_baseReplenish),
    s_tolerance_replenish: toNullableDecimal(row.s_toleranceReplenish),
    t_adjusted_dioh: toNullableDecimal(row.t_adjustedDioh),
    is_error: row.isError,
    error_message: row.errorMessage ?? null,
    error_id: row.errorCode ? errorIdMap.get(row.errorCode) ?? null : null,
  }));

  for (let index = 0; index < rows.length; index += CALC_TRACE_CREATE_MANY_CHUNK_SIZE) {
    await db.calc_upn_split_trace.createMany({
      data: rows.slice(index, index + CALC_TRACE_CREATE_MANY_CHUNK_SIZE),
    });
  }
}

export async function listCalcBatches() {
  const current = await prisma.calc_batch.findFirst({
    orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
  });
  return current ? [current] : [];
}

export async function listLoadedCalcBatches() {
  return listCalcBatches();
}

export async function getCalcBatchSummary() {
  const batches = await listLoadedCalcBatches();

  const periods = Array.from(
    new Set(batches.map((batch) => formatDateUtc8(batch.period_month)))
  ).sort((a, b) => b.localeCompare(a));

  return {
    batches,
    periods,
    totalBatches: batches.length,
    successBatches: batches.filter((batch) => batch.status === "SUCCESS").length,
    partialBatches: batches.filter((batch) => batch.status === "PARTIAL").length,
    totalRows: batches.reduce((sum, batch) => sum + batch.total_upns, 0),
  };
}

export async function listLoadedCalcResultRows(batchId: string) {
  return prisma.calc_upn_split_result.findMany({
    where: { batch_id: batchId },
    orderBy: [{ sc_bu: "asc" }, { dealerlpcode: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
  });
}

async function getMonthlyBaselineByPeriodMonth(periodMonth: string) {
  const current = await prisma.calc_batch.findFirst({
    orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
  });
  return current && formatDateUtc8(current.period_month) === periodMonth ? current : null;
}

export async function listLoadedCalcResultRowsByPeriodMonth(periodMonth: string) {
  const batch = await getMonthlyBaselineByPeriodMonth(periodMonth);
  if (!batch) return [];
  const rows = await listLoadedCalcResultRows(batch.id);
  return rows.map((row) => ({
    ...row,
    period_month: batch.period_month,
  }));
}

export async function listLoadedCalcTraceRowsByPeriodMonth(periodMonth: string) {
  const batch = await getMonthlyBaselineByPeriodMonth(periodMonth);
  if (!batch) return [];
  return listCalcTraceRows(batch.id);
}

export async function listLoadedCalcTraceRows(batchId: string) {
  return listCalcTraceRows(batchId);
}

export async function getCalcBatchPeriodMonth(batchId: string) {
  const batch = await prisma.calc_batch.findUnique({
    where: { id: batchId },
    select: { period_month: true },
  });

  return batch?.period_month.toISOString().slice(0, 10) ?? null;
}

export async function getCalcResultNameLookup(periodMonth: string) {
  const { year, months } = toYearMonthCandidates(periodMonth);
  const [fcstLpPl5, fcstT2Pl5, purchases] = await Promise.all([
    prisma.ods_fcst_lp_pl5_monthly.findMany({
      where: { year, month: { in: months } },
      select: {
        dealerlpcode: true,
        dealerlpname: true,
        pl5_code: true,
        pl5_name: true,
      },
    }),
    prisma.ods_fcst_t2_pl5_monthly.findMany({
      where: { year, month: { in: months } },
      select: {
        parentdealerlpcode: true,
        parentdealerlpname: true,
        pl5_code: true,
        pl5_name: true,
      },
    }),
    prisma.ods_t2_purchase_monthly.findMany({
      where: { year, month: { in: months } },
      select: {
        parentdealerlpcode: true,
        parentdealerlpname: true,
        pl5_code: true,
        pl5_name: true,
      },
    }),
  ]);

  const lpNameByCode: Record<string, string> = {};
  const pl5NameByCode: Record<string, string> = {};

  for (const row of fcstLpPl5) {
    putName(lpNameByCode, row.dealerlpcode, row.dealerlpname);
    putName(pl5NameByCode, row.pl5_code, row.pl5_name);
  }

  for (const row of fcstT2Pl5) {
    putName(lpNameByCode, row.parentdealerlpcode, row.parentdealerlpname);
    putName(pl5NameByCode, row.pl5_code, row.pl5_name);
  }

  for (const row of purchases) {
    putName(lpNameByCode, row.parentdealerlpcode, row.parentdealerlpname);
    putName(pl5NameByCode, row.pl5_code, row.pl5_name);
  }

  return {
    lpNameByCode,
    pl5NameByCode,
  };
}

export async function listCalcTraceRows(
  batchId: string,
  filters?: {
    pl5Code?: string | null;
    isError?: string | null;
  }
) {
  const conditions = [Prisma.sql`batch_id = CAST(${batchId} AS uuid)`];

  if (filters?.pl5Code) {
    conditions.push(Prisma.sql`pl5_code = ${filters.pl5Code}`);
  }

  if (filters?.isError) {
    conditions.push(Prisma.sql`is_error = ${filters.isError === "Y"}`);
  }

  return prisma.$queryRaw<CalcTraceRowRecord[]>(Prisma.sql`
    SELECT
      batch_id,
      period_month,
      sc_bu,
      dealerlpcode,
      pl5_code,
      upn,
      lp_code,
      h_t2_purchase_mtd,
      e_t2_mix_portion,
      t_pl5_purchase_m2,
      u_pl5_purchase_m1,
      v_pl5_purchase_m0_fcst,
      f_t2_purchase_3m_avg,
      g_t2_purchase_m0,
      j_opening_inventory,
      k_target_days,
      l_tolerance,
      i_t2_purchase_mtg,
      current_dioh,
      replenish_gap_to_30_qty,
      w_mtg_allocate_qty,
      j_star_pl5_inventory,
      i_star_pl5_mtg,
      x_after_allocate_days,
      m_original_target_inventory,
      n_new_target_inventory,
      o_final_target_inventory,
      p_theoretical_replenish,
      q_actual_theoretical,
      q_star_pl5_theoretical,
      r_base_replenish,
      s_tolerance_replenish,
      t_adjusted_dioh,
      is_error,
      error_message,
      error_id,
      created_at
    FROM poc.calc_upn_split_trace
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY sc_bu ASC, dealerlpcode ASC, pl5_code ASC, upn ASC
  `);
}

export async function getCalcBatchDetail(periodMonth: string) {
  const batch = await getMonthlyBaselineByPeriodMonth(periodMonth);
  if (!batch) return null;

  return prisma.calc_batch.findUnique({
    where: { id: batch.id },
    include: {
      results: {
        orderBy: [{ sc_bu: "asc" }, { dealerlpcode: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
      },
    },
  });
}

export async function persistRunUpnSplitArtifacts(
  periodMonth: string,
  scopeArtifacts: ScopeArtifacts,
  results: UpnSplitResult[],
  traces: UpnSplitTraceRow[]
) {
  return prisma.$transaction(
    async (tx) => {
      await acquireCalculationLock(tx, "monthly-upn-split", periodMonth);
      return persistRunUpnSplitArtifactsWithClient(tx, periodMonth, scopeArtifacts, results, traces);
    },
    { maxWait: 10_000, timeout: 600_000 }
  );
}

export async function persistRunUpnSplitArtifactsWithClient(
  db: Prisma.TransactionClient,
  periodMonth: string,
  scopeArtifacts: ScopeArtifacts,
  results: UpnSplitResult[],
  traces: UpnSplitTraceRow[]
) {
  await clearCurrentMonthlyCalculationOutputs(db);
  await replaceScopeArtifacts(periodMonth, scopeArtifacts, db);
  const batch = await createCalcBatch(periodMonth, db);
  await replaceCalcResults(batch.id, results, db);
  await replaceCalcTraceRows(batch.id, periodMonth, traces, db);
  return batch;
}

export async function clearCurrentMonthlyCalculationOutputs(db: Prisma.TransactionClient) {
  await db.calc_batch.deleteMany({});
  await db.list_lp_pl5_upn_status_monthly.deleteMany({});
  await db.bridge_pl5_upn_scope_monthly.deleteMany({});
  await db.list_lp_pl5_status_monthly.deleteMany({});
  await db.bridge_lp_pl5_scope_monthly.deleteMany({});
}
