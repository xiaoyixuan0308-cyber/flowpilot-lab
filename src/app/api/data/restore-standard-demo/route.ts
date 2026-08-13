import { NextResponse } from "next/server";
import { restoreStandardDemoData } from "@/server/services/import/ensure-standard-demo-data.service";

export async function POST() {
  try {
    return NextResponse.json(await restoreStandardDemoData());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "标准演示数据恢复失败" },
      { status: 500 },
    );
  }
}
