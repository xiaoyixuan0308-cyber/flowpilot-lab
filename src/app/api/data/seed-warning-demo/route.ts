import { NextRequest, NextResponse } from "next/server";
import { seedWarningDemoData } from "@/server/services/import";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const periodMonth =
    typeof body?.periodMonth === "string" && body.periodMonth.trim()
      ? body.periodMonth.trim()
      : undefined;

  const result = await seedWarningDemoData(periodMonth);
  return NextResponse.json(result);
}
