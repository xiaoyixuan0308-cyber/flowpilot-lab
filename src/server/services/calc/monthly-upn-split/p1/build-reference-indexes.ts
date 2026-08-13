import type {
  ActiveUpnRow,
  DiohRow,
  InventoryRow,
} from "../upn-split.types";
import { indexFirstByKey, toDealerPl5UpnKey, toDealerUpnKey } from "./p1-key-utils";

export interface P1ReferenceIndexes {
  invByDealerUpn: Map<string, InventoryRow>;
  diohByDealerUpn: Map<string, DiohRow>;
  activeUpnByDealerPl5Upn: Map<string, ActiveUpnRow>;
  dealerGroups: Map<string, string[]>;
}

/**
 * drawio P1
 * 构建基础引用索引：
 * - dealer + upn 库存
 * - dealer + upn DIOH
 * - dealer + pl5 + upn activeUpn
 * - dealer -> (pl5 + upn) 分组
 */
export function buildP1ReferenceIndexes(params: {
  year: string;
  month: string;
  inventories: InventoryRow[];
  diohTargets: DiohRow[];
  activeUpns: ActiveUpnRow[];
}): P1ReferenceIndexes {
  const { year, month, inventories, diohTargets, activeUpns } = params;
  const invCurrent = inventories.filter((row) => row.year === year && row.month === month);
  const activeCurrent = activeUpns.filter((row) => row.year === year && row.month === month);

  const dealerPl5UpnSet = new Set<string>();
  const invByDealerUpn = new Map<string, InventoryRow>();

  for (const row of invCurrent) {
    const key = toDealerUpnKey(row.dealerlpcode, row.upn);
    invByDealerUpn.set(key, row);
  }

  for (const row of activeCurrent) {
    if (row.dealerlpcode && row.pl5_code && row.upn) {
      dealerPl5UpnSet.add(toDealerPl5UpnKey(row.sc_bu, row.dealerlpcode, row.pl5_code, row.upn));
    }
  }

  const diohByDealerUpn = indexFirstByKey(
    diohTargets,
    (row) => toDealerUpnKey(row.dealerlpcode, row.upn)
  );
  const activeUpnByDealerPl5Upn = indexFirstByKey(
    activeCurrent,
    (row) => toDealerPl5UpnKey(row.sc_bu, row.dealerlpcode, row.pl5_code, row.upn)
  );

  const dealerGroups = new Map<string, string[]>();
  for (const key of dealerPl5UpnSet) {
    const [scBu, dealer, pl5, upn] = key.split("|");
    const dealerGroupKey = `${scBu}|${dealer}`;
    if (!dealerGroups.has(dealerGroupKey)) {
      dealerGroups.set(dealerGroupKey, []);
    }
    dealerGroups.get(dealerGroupKey)!.push(`${pl5}|${upn}`);
  }

  return {
    invByDealerUpn,
    diohByDealerUpn,
    activeUpnByDealerPl5Upn,
    dealerGroups,
  };
}
