import { NextResponse } from "next/server";
import {
  getCurrentUsdToCnyRate,
  listUsdToCnyRateHistory,
  updateUsdToCnyRate,
} from "@/server/services/currency/exchange-rate.service";

export async function GET() {
  const [current, history] = await Promise.all([
    getCurrentUsdToCnyRate(),
    listUsdToCnyRateHistory(),
  ]);
  return NextResponse.json({
    current: {
      id: current.id,
      rate: current.rate,
      effectiveAt: current.effectiveAt,
      direction: "1 USD = rate CNY",
    },
    history: history.map((row) => ({
      id: row.id,
      rate: Number(row.rate),
      isActive: row.is_active,
      effectiveAt: row.effective_at,
      sourceSystem: row.source_system,
    })),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rate = Number(body?.rate);
    const row = await updateUsdToCnyRate(rate);
    return NextResponse.json({
      success: true,
      id: row.id,
      rate: Number(row.rate),
      effectiveAt: row.effective_at,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "汇率更新失败" },
      { status: 422 },
    );
  }
}
