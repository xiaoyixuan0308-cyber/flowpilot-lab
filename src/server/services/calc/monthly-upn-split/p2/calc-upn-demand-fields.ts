import { add10, max10, multiply10, subtract10 } from "../../calculation-decimal";
import { safeDiv } from "../upn-split.helpers";
import type { UpnBaseState } from "../p1/build-upn-base-state";

export interface UpnDemandFields extends UpnBaseState {
  e: number;
  t: number;
  u: number;
  v: number;
  f: number;
  g: number;
  i: number;
}

/**
 * drawio P2
 * 负责单个 UPN 的需求类字段：
 * - E
 * - F
 * - G
 * - I
 */
export function calcUpnDemandFields(params: {
  base: UpnBaseState;
  upn6m: number;
  pl5_6m: number;
  t_val: number;
  u_val: number;
  v_val: number;
}) {
  const { base, upn6m, pl5_6m, t_val, u_val, v_val } = params;

  const e = safeDiv(upn6m, pl5_6m);
  const f = multiply10(e, safeDiv(add10(t_val, u_val, v_val), 3));
  const g = multiply10(e, v_val);
  const i = max10(subtract10(g, base.h), 0);

  return {
    ...base,
    e,
    t: t_val,
    u: u_val,
    v: v_val,
    f,
    g,
    i,
  } satisfies UpnDemandFields;
}
