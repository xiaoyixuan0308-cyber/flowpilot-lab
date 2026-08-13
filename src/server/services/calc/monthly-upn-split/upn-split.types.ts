import type { UpnSplitErrorCode } from "@/server/constants/upn-split-error-catalog";

export interface UpnSplitResult {
  scBu: string;
  dealerlpcode: string;
  upn: string;
  pl5Code: string;
  lpCode: string | null;
  e_t2MixPortion: number;
  f_t2Purchase3mAvg: number;
  g_t2PurchaseM0: number;
  h_t2PurchaseMtd: number;
  i_t2PurchaseMtg: number;
  j_openingInventory: number;
  k_targetDays: number;
  l_tolerance: boolean;
  iStarPl5Mtg: number;
  jStarPl5Inventory: number;
  x_afterAllocateDays: number;
  m_originalTargetInventory: number;
  n_newTargetInventory: number;
  o_finalTargetInventory: number;
  p_theoreticalReplenish: number;
  q_actualTheoretical: number;
  qStarPl5Theoretical: number;
  w_mtgAllocateQty: number;
  r_baseReplenish: number;
  s_toleranceReplenish: number;
  t_adjustedDioh: number;
  currentDioh: number;
  replenishGapTo30Qty: number | null;
  isError: boolean;
  errorCode?: UpnSplitErrorCode;
  errorMessage?: string;
}

export interface UpnSplitTraceRow {
  scBu: string;
  dealerlpcode: string;
  upn: string;
  pl5Code: string;
  lpCode: string | null;
  h_t2PurchaseMtd: number;
  e_t2MixPortion: number;
  t_pl5PurchaseM2: number;
  u_pl5PurchaseM1: number;
  v_pl5PurchaseM0Fcst: number;
  f_t2Purchase3mAvg: number;
  g_t2PurchaseM0: number;
  j_openingInventory: number;
  k_targetDays: number;
  l_tolerance: boolean;
  i_t2PurchaseMtg: number;
  currentDioh: number;
  replenishGapTo30Qty: number | null;
  w_mtgAllocateQty: number;
  jStarPl5Inventory: number;
  iStarPl5Mtg: number;
  x_afterAllocateDays: number;
  m_originalTargetInventory: number;
  n_newTargetInventory: number;
  o_finalTargetInventory: number;
  p_theoreticalReplenish: number;
  q_actualTheoretical: number;
  qStarPl5Theoretical: number;
  r_baseReplenish: number;
  s_toleranceReplenish: number;
  t_adjustedDioh: number;
  isError: boolean;
  errorCode?: UpnSplitErrorCode;
  errorMessage?: string;
}

export interface T2PurchaseRow {
  parentdealerlpcode: string | null;
  parentdealerlpname?: string | null;
  sc_bu: string;
  upn: string;
  pl5_code: string;
  pl5_name?: string | null;
  qty: number;
  year: string;
  month: string;
}

export interface InventoryRow {
  dealerlpcode: string;
  upn: string;
  qty: number;
  year: string;
  month: string;
}

export interface DiohRow {
  dealerlpcode: string;
  upn: string;
  abc_class: string | null;
  dioh_days: number;
}

export interface FcstT2Pl5Row {
  parentdealerlpcode: string | null;
  parentdealerlpname: string | null;
  sc_bu: string;
  pl5_code: string;
  pl5_name: string | null;
  fcst_qty: number;
  year: string;
  month: string;
}

export interface FcstLpPl5Row {
  dealerlpcode: string;
  dealerlpname?: string | null;
  sc_bu: string;
  pl5_code: string;
  pl5_name?: string | null;
  fcst_qty: number;
  year: string;
  month: string;
}

export interface AllocateRow {
  dealerlpcode: string;
  dealerlpname?: string | null;
  pl5_code: string;
  pl5_name?: string | null;
  allocate_qty: number;
  period_month: string;
}

export interface ActiveUpnRow {
  sc_bu: string;
  dealerlpcode: string | null;
  dealerlpname?: string | null;
  pl5_code: string;
  pl5_name?: string | null;
  upn: string;
  year: string;
  month: string;
  has_quota?: boolean;
}

export interface CalculationInput {
  periodMonth: string;
  t2Purchases: T2PurchaseRow[];
  inventories: InventoryRow[];
  diohTargets: DiohRow[];
  fcstLpPl5: FcstLpPl5Row[];
  fcstT2Pl5: FcstT2Pl5Row[];
  activeUpns: ActiveUpnRow[];
}
