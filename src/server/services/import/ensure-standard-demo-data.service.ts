import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { importExcelFile } from "./excel-import.service";
import { runUnifiedCalculation } from "@/server/services/calc/run-unified-calculation.service";

export const STANDARD_DEMO_VERSION = "2026.08.13-v1";
export const STANDARD_DEMO_CALENDAR_DATE = "2026-07-26";
const STANDARD_DEMO_FILE = "基本数据模板_第十三版_通用供应链演示版.xlsx";

let ensurePromise: Promise<void> | null = null;

async function isDemoReady() {
  const counts = await Promise.all([
    prisma.ods_t2_purchase_monthly.count(),
    prisma.ods_inventory_dealer_upn.count(),
    prisma.ods_dioh_dealer_upn.count(),
    prisma.ods_fcst_lp_pl5_monthly.count(),
    prisma.ods_fcst_t2_pl5_monthly.count(),
    prisma.ods_dealer_upn_dn.count(),
    prisma.ods_dealer_upn_open_order.count(),
    prisma.ods_bsc_upn_inventory.count(),
    prisma.ods_bsc_upn_intransit.count(),
    prisma.ods_upn_safety_stock_manual.count(),
    prisma.ods_lp_upn_purchase_price.count(),
    prisma.ods_upn_bundle_manual.count(),
    prisma.ods_weekly_amount_threshold_manual.count(),
    prisma.ods_calendar_pattern_weekly.count(),
    prisma.ods_bu_pattern_amount_weekly.count(),
    prisma.calc_upn_split_result.count(),
    prisma.calc_weekly_upn_split_result.count(),
  ]);
  return counts.every((count) => count > 0) && counts[0] >= 100;
}

function getDemoWorkbookCandidates() {
  return [
    path.join(process.cwd(), "demo-data", STANDARD_DEMO_FILE),
    path.resolve(process.cwd(), "..", "..", "测试数据", STANDARD_DEMO_FILE),
  ];
}

async function loadDemoWorkbook() {
  for (const candidate of getDemoWorkbookCandidates()) {
    try {
      return { candidate, buffer: await readFile(candidate) };
    } catch {
      // Try the next packaged location.
    }
  }
  throw new Error(`未找到固定演示数据文件：${STANDARD_DEMO_FILE}`);
}

async function fillSupportingDemoTables() {
  const periodMonth = new Date("2026-07-01T00:00:00.000Z");
  const [forecasts, productScopes] = await Promise.all([
    prisma.ods_fcst_lp_pl5_monthly.findMany({
      where: { year: "2026", month: { in: ["7", "07"] } },
      select: {
        dealerlpcode: true, dealerlpname: true, pl5_code: true, pl5_name: true,
        fcst_qty: true,
      },
    }),
    prisma.bridge_pl5_upn_scope_monthly.findMany({
      where: { period_month: periodMonth },
      select: { pl5_code: true, pl5_name: true, upn: true },
    }),
  ]);

  if ((await prisma.ods_lp_pl5_allocate_monthly.count()) === 0 && forecasts.length > 0) {
    await prisma.ods_lp_pl5_allocate_monthly.createMany({
      data: forecasts.map((row) => ({
        period_month: periodMonth,
        dealerlpcode: row.dealerlpcode,
        dealerlpname: row.dealerlpname,
        pl5_code: row.pl5_code,
        pl5_name: row.pl5_name,
        allocate_qty: row.fcst_qty,
        source_system: `DEMO_${STANDARD_DEMO_VERSION}`,
      })),
      skipDuplicates: true,
    });
  }

  if ((await prisma.ods_upn_active_list.count()) === 0 && forecasts.length > 0 && productScopes.length > 0) {
    const productsByCategory = new Map<string, typeof productScopes>();
    for (const product of productScopes) {
      const list = productsByCategory.get(product.pl5_code) ?? [];
      list.push(product);
      productsByCategory.set(product.pl5_code, list);
    }
    await prisma.ods_upn_active_list.createMany({
      data: forecasts.flatMap((channel) =>
        (productsByCategory.get(channel.pl5_code) ?? []).map((product) => ({
          dealerlpcode: channel.dealerlpcode,
          dealerlpname: channel.dealerlpname,
          pl5_code: product.pl5_code,
          pl5_name: product.pl5_name,
          upn: product.upn,
          year: "2026",
          month: "7",
          source_system: `DEMO_${STANDARD_DEMO_VERSION}`,
        })),
      ),
      skipDuplicates: true,
    });
  }
}

async function ensureStandardDemoDataInternal() {
  if (await isDemoReady()) {
    await fillSupportingDemoTables();
    return;
  }

  const { candidate, buffer } = await loadDemoWorkbook();
  const file = new File([buffer], path.basename(candidate), {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const imported = await importExcelFile(file);
  if (!imported.success) {
    throw new Error(imported.errors?.join("；") || "固定演示数据导入失败");
  }
  await runUnifiedCalculation(STANDARD_DEMO_CALENDAR_DATE);
  await fillSupportingDemoTables();
}

export function ensureStandardDemoData() {
  ensurePromise ??= ensureStandardDemoDataInternal().catch((error) => {
    ensurePromise = null;
    console.error("固定演示数据初始化失败：", error);
  });
  return ensurePromise;
}

export async function restoreStandardDemoData() {
  ensurePromise = null;
  const { candidate, buffer } = await loadDemoWorkbook();
  const file = new File([buffer], path.basename(candidate), {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const imported = await importExcelFile(file);
  if (!imported.success) {
    throw new Error(imported.errors?.join("；") || "固定演示数据恢复失败");
  }
  await runUnifiedCalculation(STANDARD_DEMO_CALENDAR_DATE);
  await fillSupportingDemoTables();
  return {
    success: true,
    version: STANDARD_DEMO_VERSION,
    calendarDate: STANDARD_DEMO_CALENDAR_DATE,
    importedRows: imported.totalRows,
  };
}
