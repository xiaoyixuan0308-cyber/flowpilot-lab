import { buildUpnBaseState } from "../p1/build-upn-base-state";
import { calcUpnDemandFields, type UpnDemandFields } from "../p2/calc-upn-demand-fields";
import { toDealerPl5Key, toDealerPl5UpnKey } from "../p1/p1-key-utils";
import type { DealerBaseContext } from "./dealer-calc-context";

export type DealerUpnMidState = UpnDemandFields;

export type DealerUpnQState = DealerUpnMidState & {
  q: number;
};

/**
 * drawio P3
 * 为单个 dealer 先构建 UPN 中间态：
 * - P1: 基础状态
 * - P2: 需求类字段
 *
 * 当前只负责“单个 dealer 下的单个 LP+PL5+UPN 中间态装配”，
 * 不在这里做 PL5 聚合或结果落盘。
 */
export function buildDealerUpnMidState(params: DealerBaseContext) {
  const {
    scBu,
    dealerCode,
    activeRowKeys,
    invByDealerUpn,
    diohByDealerUpn,
    activeUpnByDealerPl5Upn,
    dealerPl5UpnHMap,
    dealerPl5Upn6mSum,
    dealerPl56mSum,
    dealerPl5TMap,
    dealerPl5UMap,
    dealerPl5VMap,
  } = params;

  const upnMid = new Map<string, DealerUpnMidState>();

  for (const activeRowKey of activeRowKeys) {
    const [pl5Code, upn] = activeRowKey.split("|");
    const base = buildUpnBaseState({
      scBu,
      dealerCode,
      pl5Code,
      upn,
      invByDealerUpn,
      diohByDealerUpn,
      activeUpnByDealerPl5Upn,
      dealerPl5UpnHMap,
    });

    const dealerPl5UpnKey = toDealerPl5UpnKey(scBu, dealerCode, pl5Code, upn);
    const dealerPl5Key = toDealerPl5Key(scBu, dealerCode, base.pl5);
    const upn6m = dealerPl5Upn6mSum.get(dealerPl5UpnKey) || 0;
    const pl5_6m = dealerPl56mSum.get(dealerPl5Key) || 0;
    const t_val = dealerPl5TMap.get(dealerPl5Key) || 0;
    const u_val = dealerPl5UMap.get(dealerPl5Key) || 0;
    const v_val = dealerPl5VMap.get(dealerPl5Key) || 0;

    const demand = calcUpnDemandFields({
      base,
      upn6m,
      pl5_6m,
      t_val,
      u_val,
      v_val,
    });

    upnMid.set(activeRowKey, demand);
  }

  return upnMid;
}
