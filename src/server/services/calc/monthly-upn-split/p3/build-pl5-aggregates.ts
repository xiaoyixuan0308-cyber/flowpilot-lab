/**
 * drawio P3
 * 输出：
 * - I*：PL5 层 T2采购MTG
 * - J*：PL5 层库存
 */
export function buildPl5Aggregates(
  upnMid: Map<
    string,
    {
      f: number;
      j: number;
      i: number;
      pl5: string;
    }
  >
) {
  const pl5_fStar = new Map<string, number>();
  const pl5_iStar = new Map<string, number>();
  const pl5_jStar = new Map<string, number>();

  for (const [, v] of upnMid) {
    pl5_fStar.set(v.pl5, add10(pl5_fStar.get(v.pl5) || 0, v.f));
    pl5_iStar.set(v.pl5, add10(pl5_iStar.get(v.pl5) || 0, v.i));
    pl5_jStar.set(v.pl5, add10(pl5_jStar.get(v.pl5) || 0, v.j));
  }

  return { pl5_fStar, pl5_iStar, pl5_jStar };
}
import { add10 } from "../../calculation-decimal";
