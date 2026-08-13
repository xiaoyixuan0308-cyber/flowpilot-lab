import type { ActiveUpnRow, DiohRow } from "../upn-split.types";
import { toDealerPl5UpnKey, toDealerUpnKey } from "./p1-key-utils";

export interface UpnBaseState {
  scBu: string;
  upn: string;
  pl5: string;
  lpCode: string | null;
  hasQuota: boolean;
  j: number;
  k: number;
  l: boolean;
  h: number;
}

/**
 * drawio P1
 * 为单个 UPN 构建基础状态：
 * - J
 * - K
 * - L
 * - H
 * - 以及对应维度 lp/pl5
 */
export function buildUpnBaseState(params: {
  scBu: string;
  dealerCode: string;
  pl5Code: string;
  upn: string;
  invByDealerUpn: Map<string, { qty: number }>;
  diohByDealerUpn: Map<string, DiohRow>;
  activeUpnByDealerPl5Upn: Map<string, ActiveUpnRow>;
  dealerPl5UpnHMap: Map<string, number>;
}): UpnBaseState {
  const {
    scBu,
    dealerCode,
    pl5Code,
    upn,
    invByDealerUpn,
    diohByDealerUpn,
    activeUpnByDealerPl5Upn,
    dealerPl5UpnHMap,
  } = params;
  const dealerUpnKey = toDealerUpnKey(dealerCode, upn);
  const dealerPl5UpnKey = toDealerPl5UpnKey(scBu, dealerCode, pl5Code, upn);

  const inv = invByDealerUpn.get(dealerUpnKey);
  const dioh = diohByDealerUpn.get(dealerUpnKey);
  const activeUpn = activeUpnByDealerPl5Upn.get(dealerPl5UpnKey);

  return {
    scBu,
    upn,
    pl5: pl5Code,
    lpCode: activeUpn?.dealerlpcode || null,
    hasQuota: activeUpn?.has_quota ?? false,
    j: inv?.qty ?? 0,
    k: dioh?.dioh_days ?? 0,
    l: dioh?.abc_class === "A",
    h: dealerPl5UpnHMap.get(dealerPl5UpnKey) || 0,
  };
}
