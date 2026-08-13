import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUpnSplitErrorDefinition,
  type UpnSplitErrorCode,
} from "@/server/constants/upn-split-error-catalog";

/**
 * 当前优先按数据库里的 error_code -> id 映射。
 * 但在本地库尚未执行“异常码改名”SQL 前，允许回退到代码常量里的固定 id，
 * 这样页面读取和结果落库不会因为 code 名称尚未迁移而直接中断。
 */
export async function getUpnSplitErrorIdMap(
  codes: UpnSplitErrorCode[],
  db: Prisma.TransactionClient = prisma
) {
  if (codes.length === 0) {
    return new Map<UpnSplitErrorCode, string>();
  }

  const uniqueCodes = Array.from(new Set(codes));
  const rows = await db.upn_split_error_catalog.findMany({
    where: {
      error_code: {
        in: uniqueCodes,
      },
    },
  });

  const map = new Map<UpnSplitErrorCode, string>();
  for (const row of rows) {
    map.set(row.error_code as UpnSplitErrorCode, row.id);
  }

  for (const code of uniqueCodes) {
    if (!map.has(code)) {
      map.set(code, getUpnSplitErrorDefinition(code).id);
    }
  }

  return map;
}
