import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import {
  getImportSheetDefinitionByTable,
  IMPORT_SHEET_DEFINITIONS,
} from "@/server/constants/import-sheet-map";

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" },
  };
}

function buildAttachmentHeader(fileName: string) {
  const safeAscii = "template.xlsx";
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: Request) {
  const table = new URL(request.url).searchParams.get("table");
  const targetDefinition = getImportSheetDefinitionByTable(table);
  const definitions = targetDefinition
    ? [targetDefinition]
    : IMPORT_SHEET_DEFINITIONS.filter((item) => item.includeInUnifiedPackage !== false);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Codex";
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const definition of definitions) {
    const worksheet = workbook.addWorksheet(definition.templateSheetName ?? definition.label);
    const headers =
      definition.templateHeaders ?? definition.helpFields.split(",").map((field) => field.trim());
    worksheet.addRow(headers);
    styleHeader(worksheet.getRow(1));
  }

  const filename = targetDefinition ? `${targetDefinition.label}.xlsx` : "DSC-统一整包模板.xlsx";
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": buildAttachmentHeader(filename),
    },
  });
}
