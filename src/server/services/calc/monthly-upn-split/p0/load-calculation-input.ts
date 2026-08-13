import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getOdsCalculationData } from "@/server/repositories";
import type { CalculationInput } from "../upn-split.types";

/**
 * drawio P0
 * 作用：
 * - 从数据库加载本次计算所需的原始 ODS 输入
 * - 当前只负责“原始输入装载”，不做 scope/status 构建
 */
export async function loadCalculationInput(
  periodMonth: string,
  db: Prisma.TransactionClient = prisma
): Promise<CalculationInput> {
  return getOdsCalculationData(periodMonth, db);
}
