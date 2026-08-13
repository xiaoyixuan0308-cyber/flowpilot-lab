import { add10, multiply10, subtract10 } from "../../calculation-decimal";
import { safeDiv } from "../upn-split.helpers";

/**
 * drawio P10
 * S = (J + R - I) / F * 30
 */
export function calcAdjustedDioh(params: { j: number; r: number; i: number; f: number }) {
  const { j, r, i, f } = params;
  return multiply10(safeDiv(subtract10(add10(j, r), i), f), 30);
}
