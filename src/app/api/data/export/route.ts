import { NextRequest, NextResponse } from "next/server";
import { exportTableToExcel } from "@/server/services/export";
import { VALID_EXPORT_TABLES, type ExportTableName } from "@/server/constants/export-table-map";

function buildAttachmentHeader(fileName: string) {
  const safeAscii = "download.xlsx";
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(request: NextRequest) {
  const table = request.nextUrl.searchParams.get("table");
  const scope = request.nextUrl.searchParams.get("scope");
  const batchId = request.nextUrl.searchParams.get("batchId");
  const calendarDate = request.nextUrl.searchParams.get("calendar_date");
  const searchKey = request.nextUrl.searchParams.get("search_key");
  const searchValue = request.nextUrl.searchParams.get("search_value");
  const businessUnit = request.nextUrl.searchParams.get("business_unit");
  const channelCode = request.nextUrl.searchParams.get("channel_code");
  const categoryCode = request.nextUrl.searchParams.get("category_code");
  const sku = request.nextUrl.searchParams.get("sku");
  const isError = request.nextUrl.searchParams.get("is_error");
  const errorMessage = request.nextUrl.searchParams.get("error_message");
  const periodMonth = request.nextUrl.searchParams.get("period_month");
  const status = request.nextUrl.searchParams.get("status");
  const hasQuota = request.nextUrl.searchParams.get("has_quota");
  const hasHistory = request.nextUrl.searchParams.get("has_history");
  const year = request.nextUrl.searchParams.get("year");
  const month = request.nextUrl.searchParams.get("month");
  const abcClass = request.nextUrl.searchParams.get("abc_class");
  const tolerance = request.nextUrl.searchParams.get("tolerance");

  if (!table || !VALID_EXPORT_TABLES.includes(table as ExportTableName)) {
    return NextResponse.json({ error: "未指定表名或表名无效" }, { status: 400 });
  }

  const exportTable = table as ExportTableName;

  if (
    (exportTable === "calc_sku_split_result" || exportTable === "calc_sku_split_trace") &&
    !batchId &&
    !periodMonth
  ) {
    return NextResponse.json(
      { error: "导出月拆分结果/追踪时必须提供 period_month 或 batchId" },
      { status: 400 },
    );
  }

  if (exportTable === "calc_weekly_sku_split_result" && !batchId && !calendarDate) {
    return NextResponse.json(
      { error: "导出周拆分结果时必须提供 calendar_date 或 batchId" },
      { status: 400 },
    );
  }

  const { buffer, fileName } = await exportTableToExcel({
    table: exportTable,
    scope,
    batchId,
    calendarDate,
    searchKey,
    searchValue,
    businessUnit,
    channelCode,
    categoryCode,
    sku,
    isError,
    errorMessage,
    periodMonth,
    status,
    hasQuota,
    hasHistory,
    year,
    month,
    abcClass,
    tolerance,
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": buildAttachmentHeader(fileName),
    },
  });
}
