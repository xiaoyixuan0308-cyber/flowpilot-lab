import { NextRequest, NextResponse } from "next/server";
import { searchHierarchy, type SearchType, type TableType } from "@/server/repositories/search.repository";

const VALID_TYPES: SearchType[] = ["lp", "pl5", "upn"];
const VALID_TABLES: TableType[] = ["monthly", "weekly"];

export async function GET(request: NextRequest) {
  const rawQ = request.nextUrl.searchParams.get("q") ?? "";
  const rawType = (request.nextUrl.searchParams.get("type") ?? "").toLowerCase();
  const rawTable = (request.nextUrl.searchParams.get("table") ?? "monthly").toLowerCase();

  if (!rawQ.trim()) {
    return NextResponse.json({ error: "请提供搜索关键词 q" }, { status: 400 });
  }

  const type = rawType as SearchType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type 必须为 lp / pl5 / upn 之一，收到: ${rawType}` },
      { status: 400 }
    );
  }

  // 兼容别名：month / week
  const table = (
    rawTable === "month" ? "monthly" :
    rawTable === "week" ? "weekly" :
    rawTable
  ) as TableType;
  if (!VALID_TABLES.includes(table)) {
    return NextResponse.json(
      { error: `table 必须为 monthly / weekly 之一，收到: ${rawTable}` },
      { status: 400 }
    );
  }

  try {
    const rows = await searchHierarchy({
      q: rawQ.trim(),
      type,
      table,
    });

    return NextResponse.json({
      q: rawQ.trim(),
      type,
      table,
      total: rows.length,
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `查询失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
