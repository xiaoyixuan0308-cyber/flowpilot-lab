import { NextRequest, NextResponse } from "next/server";
import { isImportSheetTable } from "@/server/constants/import-sheet-map";
import { importExcelFile } from "@/server/services/import";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const tableValue = formData.get("table");
  const table = typeof tableValue === "string" ? tableValue : null;

  if (!file) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }

  if (table && !isImportSheetTable(table)) {
    return NextResponse.json({ error: "未知导入表类型" }, { status: 400 });
  }

  try {
    const result = await importExcelFile(file, {
      targetTable: table && isImportSheetTable(table) ? table : undefined,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error) {
    return NextResponse.json(
      {
        error: `文件解析失败: ${error instanceof Error ? error.message : "未知错误"}`,
      },
      { status: 500 }
    );
  }
}
