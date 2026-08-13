import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { compareDecimal, decimal10, divide10, multiply10 } from "@/server/services/calc/calculation-decimal";

export type SupportedCurrency = "USD" | "CNY";

const DEFAULT_USD_TO_CNY_RATE = 7.15;
type DbClient = Prisma.TransactionClient | typeof prisma;

export function normalizeCurrency(value: string): SupportedCurrency {
  const currency = value.trim().toUpperCase();
  if (currency !== "USD" && currency !== "CNY") {
    throw new Error(`currency_code 只支持 USD 或 CNY，当前值=${value}`);
  }
  return currency;
}

export async function getCurrentUsdToCnyRate(db: DbClient = prisma) {
  const row = await db.app_exchange_rate.findFirst({
    where: { base_currency: "USD", quote_currency: "CNY", is_active: true },
    orderBy: [{ effective_at: "desc" }, { created_at: "desc" }],
  });
  if (!row || compareDecimal(row.rate.toString(), 0) <= 0) {
    throw new Error("未配置有效 USD/CNY 汇率；请先维护 1 USD 对应的 CNY 数量");
  }
  return { id: row.id, rate: Number(row.rate), effectiveAt: row.effective_at };
}

export async function ensureDefaultUsdToCnyRate(db: Prisma.TransactionClient) {
  const current = await db.app_exchange_rate.findFirst({
    where: { base_currency: "USD", quote_currency: "CNY", is_active: true },
  });
  if (current) return;
  const now = new Date();
  await db.app_exchange_rate.create({
    data: {
      base_currency: "USD",
      quote_currency: "CNY",
      rate: DEFAULT_USD_TO_CNY_RATE,
      effective_at: now,
      source_system: "SYSTEM_DEFAULT",
      created_at: now,
    },
  });
}

export async function updateUsdToCnyRate(rate: number) {
  if (!Number.isFinite(rate) || compareDecimal(rate, 0) <= 0) {
    throw new Error("USD/CNY 汇率必须大于 0");
  }
  return prisma.$transaction(async (tx) => {
    await tx.app_exchange_rate.updateMany({
      where: { base_currency: "USD", quote_currency: "CNY", is_active: true },
      data: { is_active: false },
    });
    const now = new Date();
    return tx.app_exchange_rate.create({
      data: {
        base_currency: "USD",
        quote_currency: "CNY",
        rate: decimal10(rate),
        effective_at: now,
        source_system: "MANUAL_UI",
        created_at: now,
      },
    });
  });
}

export function listUsdToCnyRateHistory() {
  return prisma.app_exchange_rate.findMany({
    where: { base_currency: "USD", quote_currency: "CNY" },
    orderBy: [{ is_active: "desc" }, { effective_at: "desc" }, { created_at: "desc" }],
    take: 100,
  });
}

export function convertSourceAmountToUsd(
  amount: number,
  currency: SupportedCurrency,
  usdToCnyRate: number,
) {
  return currency === "USD" ? decimal10(amount) : divide10(amount, usdToCnyRate);
}

export function convertUsdAmountToCny(amount: number, usdToCnyRate: number) {
  return multiply10(amount, usdToCnyRate);
}
