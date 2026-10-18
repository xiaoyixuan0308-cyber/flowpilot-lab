import type { SkuSplitErrorCode } from "@/server/constants/sku-split-error-catalog";

export interface SkuSplitResult {
  businessUnit: string;
  dealer_channel_code: string;
  sku: string;
  categoryCode: string;
  channelCode: string | null;
  e_t2MixPortion: number;
  f_t2Purchase3mAvg: number;
  g_t2PurchaseM0: number;
  h_t2PurchaseMtd: number;
  i_t2PurchaseMtg: number;
  j_openingInventory: number;
  k_targetDays: number;
  l_tolerance: boolean;
  iStarCategoryMtg: number;
  jStarCategoryInventory: number;
  x_afterAllocateDays: number;
  m_originalTargetInventory: number;
  n_newTargetInventory: number;
  o_finalTargetInventory: number;
  p_theoreticalReplenish: number;
  q_actualTheoretical: number;
  qStarCategoryTheoretical: number;
  w_mtgAllocateQty: number;
  r_baseReplenish: number;
  s_toleranceReplenish: number;
  t_adjustedDioh: number;
  currentDioh: number;
  replenishGapTo30Qty: number | null;
  isError: boolean;
  errorCode?: SkuSplitErrorCode;
  errorMessage?: string;
}

export interface SkuSplitTraceRow {
  businessUnit: string;
  dealer_channel_code: string;
  sku: string;
  categoryCode: string;
  channelCode: string | null;
  h_t2PurchaseMtd: number;
  e_t2MixPortion: number;
  t_categoryPurchaseM2: number;
  u_categoryPurchaseM1: number;
  v_categoryPurchaseM0Fcst: number;
  f_t2Purchase3mAvg: number;
  g_t2PurchaseM0: number;
  j_openingInventory: number;
  k_targetDays: number;
  l_tolerance: boolean;
  i_t2PurchaseMtg: number;
  currentDioh: number;
  replenishGapTo30Qty: number | null;
  w_mtgAllocateQty: number;
  jStarCategoryInventory: number;
  iStarCategoryMtg: number;
  x_afterAllocateDays: number;
  m_originalTargetInventory: number;
  n_newTargetInventory: number;
  o_finalTargetInventory: number;
  p_theoreticalReplenish: number;
  q_actualTheoretical: number;
  qStarCategoryTheoretical: number;
  r_baseReplenish: number;
  s_toleranceReplenish: number;
  t_adjustedDioh: number;
  isError: boolean;
  errorCode?: SkuSplitErrorCode;
  errorMessage?: string;
}

export interface T2PurchaseRow {
  parent_dealer_channel_code: string | null;
  parent_dealer_channel_name?: string | null;
  business_unit: string;
  sku: string;
  category_code: string;
  category_name?: string | null;
  qty: number;
  year: string;
  month: string;
}

export interface InventoryRow {
  dealer_channel_code: string;
  sku: string;
  qty: number;
  year: string;
  month: string;
}

export interface DiohRow {
  dealer_channel_code: string;
  sku: string;
  abc_class: string | null;
  dioh_days: number;
}

export interface FcstT2CategoryRow {
  parent_dealer_channel_code: string | null;
  parent_dealer_channel_name: string | null;
  business_unit: string;
  category_code: string;
  category_name: string | null;
  fcst_qty: number;
  year: string;
  month: string;
}

export interface FcstChannelCategoryRow {
  dealer_channel_code: string;
  dealer_channel_name?: string | null;
  business_unit: string;
  category_code: string;
  category_name?: string | null;
  fcst_qty: number;
  year: string;
  month: string;
}

export interface AllocateRow {
  dealer_channel_code: string;
  dealer_channel_name?: string | null;
  category_code: string;
  category_name?: string | null;
  allocate_qty: number;
  period_month: string;
}

export interface ActiveSkuRow {
  business_unit: string;
  dealer_channel_code: string | null;
  dealer_channel_name?: string | null;
  category_code: string;
  category_name?: string | null;
  sku: string;
  year: string;
  month: string;
  has_quota?: boolean;
}

export interface CalculationInput {
  periodMonth: string;
  t2Purchases: T2PurchaseRow[];
  inventories: InventoryRow[];
  diohTargets: DiohRow[];
  fcstChannelCategory: FcstChannelCategoryRow[];
  fcstT2Category: FcstT2CategoryRow[];
  activeSkus: ActiveSkuRow[];
}
