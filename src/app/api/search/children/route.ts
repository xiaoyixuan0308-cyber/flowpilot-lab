import { NextRequest, NextResponse } from "next/server";
import { getChildren, type TableType } from "@/server/repositories/search.repository";

const VALID_TABLES: TableType[] = ["monthly", "weekly"];

export async function GET(request: NextRequest) {
  const rawLp = (request.nextUrl.searchParams.get("lp") ?? "").trim();
  const rawPl5 = (request.nextUrl.searchParams.get("pl5") ?? "").trim();
  const rawTable = (request.nextUrl.searchParams.get("table") ?? "monthly").toLowerCase();

  if (!rawLp) {
    return NextResponse.json({ error: "请提供 lp 参数" }, { status: 400 });
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
      lp: rawLp,
      pl5: rawPl5 || undefined,
      table,
    });

    if (!result) {
      return NextResponse.json({
        lp: rawLp,
        pl5: rawPl5 || null,
        table,
        pl5s: [],
        upns: [],
      });
    }

    return NextResponse.json({
      lp: result.lp,
      lp_name: result.lp_name,
      pl5: rawPl5 || null,
      table,
      pl5s: result.pl5s,
      upns: result.upns,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `查询失败: ${error instanceof Error ? error.message : "未知错误"}` },
      { status: 500 }
    );
  }
}
