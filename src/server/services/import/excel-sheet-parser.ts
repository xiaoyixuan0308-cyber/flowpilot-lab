import ExcelJS from "exceljs";
import JSZip from "jszip";

function cellValueToText(value: ExcelJS.CellValue): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();

  if (typeof value !== "object") {
    return String(value);
  }

  if ("richText" in value) {
    return value.richText.map((item) => item.text).join("");
  }

  if ("text" in value) {
    return value.text;
  }

  if ("result" in value) {
    return cellValueToText(value.result);
  }

  if ("error" in value) {
    return value.error;
  }

  return null;
}

function cellToText(cell: ExcelJS.Cell): string | null {
  const text = cellValueToText(cell.value);
  return text?.trim() ? text : null;
}

function parseRow(values: (string | null)[], mapping: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  mapping.forEach((field, i) => {
    if (field && values[i] != null) {
      obj[field] = String(values[i]).trim();
    }
  });
  return obj;
}

function inferFieldMapping(headers: (string | null)[]): string[] {
  return headers.map((header) => {
    if (!header) return "";

    const value = header.toString().trim().toLowerCase();

    if (value === "forecast_date" || (value.includes("forecast") && value.includes("date"))) {
      return "forecast_date";
    }
    if (value === "fcst_qty" || value.includes("fcst") || value.includes("预测") || value.includes("forecast")) {
      return "fcst_qty";
    }
    if (value === "allocate_qty" || value.includes("allocate") || value.includes("配额")) {
      return "allocate_qty";
    }
    if (value === "period_month" || (value.includes("period") && value.includes("month"))) return "period_month";
    if (value.includes("parent") && value.includes("code")) return "parentdealerlpcode";
    if (value.includes("parent") && value.includes("name")) return "parentdealerlpname";
    if (value.includes("dealer") && value.includes("lp") && value.includes("code")) return "dealerlpcode";
    if (value.includes("dealer") && value.includes("lp") && value.includes("name")) return "dealerlpname";
    if (value === "created_on" || (value.includes("created") && value.includes("on"))) return "created_on";
    if (
      value === "calendar_date" ||
      value === "计算基准日" ||
      (value.includes("calendar") && value.includes("date"))
    ) return "calendar_date";
    if (value === "overage_threshold_pct" || value.includes("超额缩减阈值")) {
      return "overage_threshold_pct";
    }
    if (value === "shortfall_threshold_pct" || value.includes("缺口补差阈值")) {
      return "shortfall_threshold_pct";
    }
    if (value === "month_start_date" || (value.includes("month") && value.includes("start"))) return "month_start_date";
    if (value === "week_start_date" || (value.includes("week") && value.includes("start"))) return "week_start_date";
    if (value === "week_end_date" || (value.includes("week") && value.includes("end"))) return "week_end_date";
    if (value === "period_week" || (value.includes("period") && value.includes("week"))) return "period_week";
    if (value === "sold_to_pt" || (value.includes("sold") && value.includes("pt"))) return "sold_to_pt";
    if (value === "customer" || value.includes("customer")) return "customer";
    if (value === "dealer_type" || value === "dealertype" || (value.includes("dealer") && value.includes("type"))) return "dealer_type";
    if (value === "upn" || value.includes("upn code")) return "upn";
    if (value === "material" || value.includes("material")) return "material";
    if (value === "dealer_code" || value === "dealercode" || value.includes("dealer code")) return "dealer_code";
    if (value === "sapid" || value.includes("sapid")) return "dealer_code";
    if (value === "pl5" || value.includes("pl5 code") || value.includes("pl5_code")) return "pl5_code";
    if (value.includes("pl5") && value.includes("name")) return "pl5_name";
    if (value.includes("lp code") || value === "lp") return "dealerlpcode";
    if (value.includes("lp name")) return "dealerlpname";
    if (value === "dctp" || value.includes("order type") || value.includes("dctp")) return "dctp";
    if (value === "delivery_qty" || (value.includes("delivery") && value.includes("qty"))) return "delivery_qty";
    if (value === "open_qty" || (value.includes("open") && value.includes("qty"))) return "open_qty";
    if (
      value === "actual_amount" ||
      value === "week_budget_amount" ||
      value.includes("周预算") ||
      (value.includes("actual") && value.includes("amount"))
    ) return "actual_amount";
    if (value === "month_target_amount" || (value.includes("target") && value.includes("amount"))) {
      return "month_target_amount";
    }
    if (
      value === "month_budget_amount" ||
      value.includes("月预算")
    ) return "month_target_amount";
    if (
      value === "month_limit_amount" ||
      value === "limit_amount" ||
      value.includes("月度限制") ||
      value.includes("月预算上限")
    ) return "month_limit_amount";
    if (value === "currency_code" || value === "currency" || value.includes("币种")) return "currency_code";
    if (value === "product_type" || (value.includes("product") && value.includes("type"))) return "product_type";
    if (value === "unrestricted_qty" || (value.includes("unrestricted") && value.includes("qty"))) {
      return "unrestricted_qty";
    }
    if (value === "intransit_qty" || (value.includes("intransit") && value.includes("qty"))) {
      return "intransit_qty";
    }
    if (value === "safety_stock_qty" || (value.includes("safety") && value.includes("stock"))) {
      return "safety_stock_qty";
    }
    if (value === "bundle_qty" || value.includes("套包数量")) return "bundle_qty";
    if (value === "bsc_std_sell_price" || (value.includes("std") && value.includes("sell") && !value.includes("vat"))) {
      return "bsc_std_sell_price";
    }
    if (value === "bsc_std_sell_price_vat" || (value.includes("std") && value.includes("sell") && value.includes("vat"))) {
      return "bsc_std_sell_price_vat";
    }
    if (value === "prev_week_pattern_pct" || (value.includes("prev") && value.includes("pattern"))) {
      return "prev_week_pattern_pct";
    }
    if (value === "current_week_pattern_pct" || (value.includes("current") && value.includes("pattern"))) {
      return "current_week_pattern_pct";
    }
    if (value.includes("qty") || value.includes("数量") || value.includes("quantity")) return "qty";
    if (value === "year" || value.includes("年")) return "year";
    if (value === "month" || value.includes("月")) return "month";
    if (value.includes("dioh") && value.includes("day")) return "dioh_days";
    if (value.includes("abc")) return "abc_class";
    if (value.includes("bu") || value.includes("sc_bu")) return "sc_bu";
    if (value.includes("source")) return "source_system";

    return value.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  });
}

export async function loadWorkbook(file: File) {
  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(new Uint8Array(arrayBuf));

  if (buffer.length < 4) {
    throw new Error("文件内容为空或不完整，请重新选择有效的 XLSX 文件");
  }

  const isZipContainer = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const isLegacyExcelOrEncrypted =
    buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;

  if (isLegacyExcelOrEncrypted) {
    throw new Error("当前文件是旧版 XLS 格式或加密工作簿。请在 Excel 中另存为未加密的 Excel 工作簿（.xlsx）后再导入");
  }

  if (!isZipContainer) {
    throw new Error("文件不是有效的 XLSX 工作簿。请勿直接修改文件后缀，请使用 Excel 另存为 .xlsx 格式");
  }

  const load = async (input: Buffer) => {
    const workbook = new ExcelJS.Workbook();
    // @ts-expect-error - ExcelJS Buffer type mismatch with Node.js 22
    await workbook.xlsx.load(input);
    if (workbook.worksheets.length === 0) {
      throw new Error("工作簿中没有可读取的工作表");
    }
    return workbook;
  };

  try {
    return await load(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("reading 'sheets'")) {
      throw new Error("无法读取该 XLSX 工作簿，文件可能已损坏、被加密或包含不兼容内容。请用 Excel 重新另存为 .xlsx 后再试");
    }

    const zip = await JSZip.loadAsync(buffer);
    const spreadsheetXmlEntries = Object.values(zip.files).filter(
      (entry) => !entry.dir && entry.name.startsWith("xl/") && entry.name.endsWith(".xml")
    );
    let normalized = false;
    for (const entry of spreadsheetXmlEntries) {
      const xml = await entry.async("string");
      if (!xml.includes('xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')) continue;
      zip.file(
        entry.name,
        xml
          .replace(/(<\/?)(x:)/g, "$1")
          .replace(' xmlns:x="http://schemas.openxmlformats.org/spreadsheetml/2006/main"', ' xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"')
      );
      normalized = true;
    }
    if (!normalized) {
      throw new Error("无法读取该 XLSX 工作簿，文件可能已损坏、被加密或包含不兼容内容。请用 Excel 重新另存为 .xlsx 后再试");
    }
    try {
      return await load(await zip.generateAsync({ type: "nodebuffer" }));
    } catch {
      throw new Error("无法读取该 XLSX 工作簿，文件可能已损坏、被加密或包含不兼容内容。请用 Excel 重新另存为 .xlsx 后再试");
    }
  }
}

export function parseWorksheet(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  const columnCount = Math.max(sheet.actualColumnCount || 0, headerRow.cellCount || 0, 20);
  const headerValues = Array.from({ length: columnCount }, (_, i) => cellToText(headerRow.getCell(i + 1)));
  const mapping = inferFieldMapping(headerValues);
  const validFields = mapping.filter(Boolean);

  const dataRows: Record<string, string>[] = [];
  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const row = sheet.getRow(i);
    const values = Array.from({ length: mapping.length }, (_, j) => cellToText(row.getCell(j + 1)));
    if (values.every((value) => value == null)) continue;
    dataRows.push(parseRow(values, mapping));
  }

  return {
    validFields,
    dataRows,
  };
}
