import { NextRequest, NextResponse } from "next/server";
import { getImportSheetDefinitionByTable, isImportSheetTable } from "@/server/constants/import-sheet-map";
import { clearImportTableRows } from "@/server/services/import/clear-import-table.service";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const table = typeof body?.table === "string" ? body.table : null;

  if (!isImportSheetTable(table)) {
    return NextResponse.json({ error: "未知基础表类型" }, { status: 400 });
  }

  const definition = getImportSheetDefinitionByTable(table);
  const result = await clearImportTableRows(table);

  return NextResponse.json({
    success: true,
    table,
    deletedRows: result.deletedRows,
    message: `${definition?.label ?? table} 已清空：${result.deletedRows} 行`,
  });
}
