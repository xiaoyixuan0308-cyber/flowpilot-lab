import { NextRequest, NextResponse } from "next/server";
import { getChildren, type TableType } from "@/server/repositories/search.repository";

const VALID_TABLES: TableType[] = ["monthly", "weekly"];

export async function GET(request: NextRequest) {
  const rawChannel = (request.nextUrl.searchParams.get("channel") ?? "").trim();
  const rawCategory = (request.nextUrl.searchParams.get("category") ?? "").trim();
  const rawTable = (request.nextUrl.searchParams.get("table") ?? "monthly").toLowerCase();

  if (!rawChannel) {
    return NextResponse.json({ error: "请提供 channel 参数" }, { status: 400 });
  }

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
    const result = await getChildren({
      channel: rawChannel,
      category: rawCategory || undefined,
      table,
    });

    if (!result) {
      return NextResponse.json({
        channel: rawChannel,
        category: rawCategory || null,
        table,
        categories: [],
        skus: [],
      });
    }

    return NextResponse.json({
      channel: result.channel,
      channel_name: result.channel_name,
      category: rawCategory || null,
      table,
      categories: result.categories,
      skus: result.skus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `查询失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
