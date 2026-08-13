import { buildPl5QStar } from "./build-pl5-qstar";
import { buildPl5Aggregates } from "../p3/build-pl5-aggregates";
import { calcXAfterAllocationDays } from "../p4/calc-x-after-allocation-days";
import { calcTargetInventories } from "../p5/calc-target-inventories";
import type { DealerUpnQState } from "../p3/build-dealer-upn-mid-state";
import { toDealerPl5Key } from "../p1/p1-key-utils";
import type { DealerMidContext, DealerQContext } from "../p3/dealer-calc-context";

/**
 * drawio P8
 * 在单个 dealer 的 UPN 中间态上补齐：
 * - I* / J*
 * - Q
 * - Q*
 *
 * 返回补齐后的中间态与 PL5 聚合结果，供后续结果组装使用。
 */
export function applyQStarToDealerUpns(params: DealerMidContext): DealerQContext {
  const { scBu, dealerCode, upnMid, wMap } = params;

  const { pl5_fStar, pl5_iStar, pl5_jStar } = buildPl5Aggregates(upnMid);
  const upnQState = new Map<string, DealerUpnQState>();

  for (const [activeRowKey, v] of upnMid) {
    const fStar = pl5_fStar.get(v.pl5) || 0;
    const iStar = pl5_iStar.get(v.pl5) || 0;
    const jStar = pl5_jStar.get(v.pl5) || 0;
    const w = wMap.get(toDealerPl5Key(scBu, dealerCode, v.pl5)) ?? 0;
    const x = calcXAfterAllocationDays({
      jStar,
      w,
      iStar,
      fStar,
    });

    const { q } = calcTargetInventories({
      x,
      f: v.f,
      k: v.k,
      l: v.l,
      i: v.i,
      j: v.j,
    });

    upnQState.set(activeRowKey, { ...v, q });
  }

  const { pl5_qStar } = buildPl5QStar(upnQState);

  return {
    scBu,
    dealerCode,
    wMap,
    upnQState,
    pl5_fStar,
    pl5_iStar,
    pl5_jStar,
    pl5_qStar,
  };
}
