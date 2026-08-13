import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import {
  getImportSheetDefinitionByTable,
  matchImportSheetDefinition,
  type ImportSheetDefinition,
  type ImportSheetTable,
} from "@/server/constants/import-sheet-map";
import { loadWorkbook, parseWorksheet } from "./excel-sheet-parser";
import type { ImportResult } from "./import.types";
import { writeImportRows } from "./ods-writer";
import { getCurrentUsdToCnyRate } from "@/server/services/currency/exchange-rate.service";

interface ImportExcelFileOptions {
  targetTable?: ImportSheetTable;
}

interface SheetImportTarget {
  sheet: ExcelJS.Worksheet;
  config: ImportSheetDefinition;
}

interface PreparedSheetImport extends SheetImportTarget {
  name: string;
  dataRows: Record<string, string>[];
}

const EMPTY_SNAPSHOT_TABLES: ImportSheetTable[] = [
  "dealerUpnDn",
  "dealerUpnOpenOrder",
  "bscUpnIntransit",
  "upnSafetyStock",
  "upnConstraint",
  "upnBundle",
  "weeklyAmountThreshold",
];

function getSheetImportTargets(
  workbook: ExcelJS.Workbook,
  targetTable?: ImportSheetTable
): SheetImportTarget[] {
  if (!targetTable) {
    return workbook.worksheets
      .map((sheet) => {
        const config = matchImportSheetDefinition(sheet.name);
        return config ? { sheet, config } : null;
      })
      .filter((item): item is SheetImportTarget => Boolean(item));
  }

  const targetConfig = getImportSheetDefinitionByTable(targetTable);
  if (!targetConfig) return [];

  return workbook.worksheets
    .map((sheet) => {
      const config = matchImportSheetDefinition(sheet.name);
      return config?.table === targetTable ? { sheet, config: targetConfig } : null;
    })
    .filter((item): item is SheetImportTarget => Boolean(item));
}

export async function importExcelFile(
  file: File,
  options: ImportExcelFileOptions = {}
): Promise<ImportResult> {
  const workbook = await loadWorkbook(file);

  let totalRows = 0;
  let attemptedRows = 0;
  const errors: string[] = [];
  const sheetTargets = getSheetImportTargets(workbook, options.targetTable);
  const preparedSheets: PreparedSheetImport[] = [];

  for (const { sheet, config: sheetConfig } of sheetTargets) {
    const name = sheet.name.trim();
    const { validFields, dataRows } = parseWorksheet(sheet);
    attemptedRows += dataRows.length;

    if (validFields.length === 0) {
      errors.push(`工作表 "${name}" 无法识别表头`);
      continue;
    }

    const missingFields = sheetConfig.requiredFields.filter((field) => !validFields.includes(field));
    if (missingFields.length > 0) {
      errors.push(
        `工作表 "${name}" 缺少必要字段: ${missingFields.join(", ")}，识别到的字段: ${validFields.join(", ")}`
      );
      continue;
    }

    if (dataRows.length === 0 && !EMPTY_SNAPSHOT_TABLES.includes(sheetConfig.table)) {
      errors.push(`工作表 "${name}" 为空，必需快照不能沿用上一次导入数据`);
      continue;
    }
    preparedSheets.push({ sheet, config: sheetConfig, name, dataRows });
  }

  if (options.targetTable && sheetTargets.length === 0) {
    errors.push("未找到与目标表匹配的工作表");
  } else if (!options.targetTable && sheetTargets.length === 0) {
    errors.push("未找到可识别的工作表");
  }

  if (errors.length > 0) {
    return {
      success: false,
      importedSheets: [],
      totalRows: 0,
      errorRows: attemptedRows,
      errors,
    };
  }

  // 旧版整包不含规则 Sheet 时，缺省语义是“当前没有任何约束”，不能沿用上一次导入的规则快照。
  const missingSparseSnapshots = !options.targetTable
    ? EMPTY_SNAPSHOT_TABLES.filter(
        (table) => !preparedSheets.some((item) => item.config.table === table)
      )
    : [];

  try {
    await prisma.$transaction(
      async (tx) => {
        const needsCurrencyConversion = preparedSheets.some((item) =>
          ["lpUpnPurchasePrice", "buPatternAmountWeekly"].includes(item.config.table),
        );
        const exchangeRate = needsCurrencyConversion ? await getCurrentUsdToCnyRate(tx) : null;
        for (const table of missingSparseSnapshots) {
          await writeImportRows(tx, table, [], exchangeRate?.rate);
        }

        for (const item of preparedSheets) {
          try {
            await writeImportRows(tx, item.config.table, item.dataRows, exchangeRate?.rate);
          } catch (error) {
            throw new Error(
              `工作表 "${item.name}" 写入失败: ${error instanceof Error ? error.message : "未知错误"}`
            );
          }
        }
      },
      { maxWait: 10_000, timeout: 60_000 }
    );
  } catch (error) {
    return {
      success: false,
      importedSheets: [],
      totalRows: 0,
      errorRows: attemptedRows,
      errors: [error instanceof Error ? error.message : "工作簿写入失败"],
    };
  }

  const importedSheets = preparedSheets.map(
    (item) => `${item.name} -> ${item.config.label} (${item.dataRows.length}行)`
  );
  totalRows = preparedSheets.reduce((sum, item) => sum + item.dataRows.length, 0);

  return {
    success: true,
    importedSheets,
    totalRows,
    errorRows: 0,
  };
}
