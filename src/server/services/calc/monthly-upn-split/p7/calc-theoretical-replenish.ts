/**
 * drawio P7
 * P = O + I - J
 * Q = Max(P, 0)
 */
export function calcTheoreticalReplenish(params: {
  o: number;
  i: number;
  j: number;
}) {
  const { o, i, j } = params;
  const p = subtract10(add10(o, i), j);
  const q = max10(p, 0);
  return { p, q };
}
import { add10, max10, subtract10 } from "../../calculation-decimal";
