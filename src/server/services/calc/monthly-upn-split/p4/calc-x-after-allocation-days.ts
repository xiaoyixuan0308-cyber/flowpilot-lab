import { add10, multiply10, subtract10 } from "../../calculation-decimal";
import { safeDiv } from "../upn-split.helpers";

/**
 * drawio P4
 * X = (J* + W - I*) / ΣF * 30
 */
export function calcXAfterAllocationDays(params: {
  jStar: number;
  w: number;
  iStar: number;
  fStar: number;
}) {
  const { jStar, w, iStar, fStar } = params;
  return multiply10(safeDiv(subtract10(add10(jStar, w), iStar), fStar), 30);
}
