import { NextRequest, NextResponse } from "next/server";
import { seedScaleData } from "@/server/services/import";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const periodMonth =
    typeof body?.periodMonth === "string" && body.periodMonth.trim()
      ? body.periodMonth.trim()
      : undefined;
  const channelCount =
    typeof body?.channelCount === "number" && body.channelCount > 0 ? body.channelCount : undefined;
  const categoryCount =
    typeof body?.categoryCount === "number" && body.categoryCount > 0 ? body.categoryCount : undefined;
  const skuPerChannelCategory =
    typeof body?.skuPerChannelCategory === "number" && body.skuPerChannelCategory > 0
      ? body.skuPerChannelCategory
      : undefined;

  const result = await seedScaleData(periodMonth, { channelCount, categoryCount, skuPerChannelCategory });
  return NextResponse.json(result);
}
