import type { DealerUpnQState } from "../p3/build-dealer-upn-mid-state";
import { add10 } from "../../calculation-decimal";

/**
 * drawio P8
 * 输出：
 * - Q*：PL5 实际理论补货总量
 */
export function buildPl5QStar(
  upnMid: Map<string, DealerUpnQState>
) {
  const pl5_qStar = new Map<string, number>();
  for (const [, val] of upnMid) {
    pl5_qStar.set(val.pl5, add10(pl5_qStar.get(val.pl5) || 0, val.q));
  }
  return { pl5_qStar };
}
