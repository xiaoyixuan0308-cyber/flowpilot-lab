export interface WeeklyMonthlySnapshotRow {
  businessUnit: string;
  channelCode: string;
  categoryCode: string;
  sku: string;
  monthQuotaQty: number | null;
  sToleranceReplenishQty: number | null;
  rBaseReplenishQty: number | null;
  qActualTheoreticalQty: number | null;
  currentInventoryDays: number | null;
  originalTargetInventoryQty: number | null;
  currentInventoryQty: number | null;
  t2Purchase3mAvgQty: number | null;
}

export type WeeklyMonthQuotaStrategy =
  | "fallback"
  | "s_tolerance_replenish"
  | "r_base_replenish"
  | "q_actual_theoretical";

export interface WeeklyRunStrategy {
  monthQuotaStrategy?: WeeklyMonthQuotaStrategy;
}

export interface WeeklyCalendarRow {
  businessUnit: string;
  periodMonth: Date;
  monthStartDate: Date;
  weekStartDate: Date;
  weekEndDate: Date;
  prevWeekPatternPct: number | null;
  currentWeekPatternPct: number | null;
}

export interface WeeklyDealerDnRow {
  businessUnit: string;
  dealerType: string;
  soldToPt: string | null;
  material: string | null;
  createdOn: Date | null;
  deliveryQty: number;
}

export interface WeeklyOpenOrderRow {
  businessUnit: string;
  customer: string | null;
  dealerType: string | null;
  material: string | null;
  dctp: string | null;
  openQty: number;
}

export interface WeeklyCentralWarehouseInventoryRow {
  material: string;
  sloc: string | null;
  unrestrictedQty: number;
}

export interface WeeklyCentralWarehouseIntransitRow {
  material: string;
  forecastDate: Date | null;
  intransitQty: number;
}

export interface WeeklySafetyStockRow {
  sku: string;
  safetyStockQty: number;
}

export interface WeeklyPurchasePriceRow {
  dealerCode: string;
  dealerType: string;
  sku: string;
  centralWarehouseStdSellPrice: number | null;
  centralWarehouseStdSellPriceVat: number | null;
}

export type WeeklyConstraintType = "WEEK_CAP" | "MONTH_CAP";

export interface WeeklyConstraintRule {
  businessUnit: string;
  sku: string;
  constraintType: WeeklyConstraintType;
}

export interface WeeklyBundleRule {
  sku: string;
  bundleQty: number;
}

export interface WeeklyDiohRow {
  channelCode: string;
  sku: string;
  abcClass: string | null;
}

export interface WeeklyAmountRow {
  businessUnit: string;
  periodWeek: Date;
  periodMonth: Date;
  actualAmount: number | null;
  monthTargetAmount: number;
  monthLimitAmount: number;
}

export interface WeeklyAmountThresholdRow {
  businessUnit: string;
  overageThresholdPct: number;
  shortfallThresholdPct: number;
}

export interface WeeklySourceData {
  periodMonth: string;
  calendarDate: string;
  sourceBatchId: string;
  calendars: WeeklyCalendarRow[];
  amountThresholds: WeeklyAmountThresholdRow[];
  monthlyRows: WeeklyMonthlySnapshotRow[];
  dnRows: WeeklyDealerDnRow[];
  openOrderRows: WeeklyOpenOrderRow[];
  inventoryRows: WeeklyCentralWarehouseInventoryRow[];
  intransitRows: WeeklyCentralWarehouseIntransitRow[];
  safetyStockRows: WeeklySafetyStockRow[];
  purchasePriceRows: WeeklyPurchasePriceRow[];
  constraintRules: WeeklyConstraintRule[];
  bundleRules: WeeklyBundleRule[];
  diohRows: WeeklyDiohRow[];
  amountRows: WeeklyAmountRow[];
}

export type WeeklyBaseRow = WeeklyMonthlySnapshotRow;

export interface WeeklyP2Row extends WeeklyBaseRow {
  prevWeekPatternPct: number | null;
  currentWeekPatternPct: number;
}

export interface WeeklyP3Row extends WeeklyP2Row {
  lMonthDeliveredQty: number;
  oMonthDeliveredTotalQty: number;
  pOpenOrderOrQty: number;
  sOpenOrderOrTotalQty: number;
  tOpenOrderNonOrQty: number;
  wOpenOrderNonOrTotalQty: number;
  rOtherDealerOpenOrderOrQty: number;
  vOtherDealerOpenOrderNonOrQty: number;
  nOtherDealerMonthDeliveredQty: number;
  xOpenOrderTotalQty: number;
}

export interface WeeklyP4Row extends WeeklyP3Row {
  yaCentralWarehouseInventoryQty: number | null;
  ybIntransitQty: number;
  ycSafetyStockQty: number;
  yCentralWarehouseAvailableQty: number | null;
}

export interface WeeklyP5Row extends WeeklyP4Row {
  gWeekQuotaPatternTotalQty: number | null;
  aaMonthDeliveredSuggestionPct: number | null;
  jWeekQuotaPatternQty: number | null;
  jaWeekTargetPendingQty: number | null;
  jbWeekTargetPendingTotalQty: number | null;
}

export interface WeeklyP6Row extends WeeklyP5Row {
  zInventoryStatus: "OK" | "STOP" | null;
  adOrSuggestQty: number | null;
}

export interface WeeklyP7Row extends WeeklyP6Row {
  bhRemainingCentralWarehouseAvailableQty: number | null;
  biTargetInventoryAdjustableQty: number | null;
  bkPostSuggestDioh: number | null;
}

export interface WeeklyP8Row extends WeeklyP7Row {
  amUnitPrice: number | null;
  aoOrSuggestAmount: number | null;
}

export interface WeeklyP10Row extends WeeklyP8Row {
  saSystemAdjustedQty: number | null;
}

export interface WeeklyP11Row extends WeeklyP10Row {
  bbSkuAbcClass: string | null;
  hSkuMonthlyCapQty: number | null;
  baConstraintTypes: string;
  bdAdjustmentAllowedFlag: "Y" | "N" | null;
  blMonthlyRemainingAdjustableQty: number | null;
}

export interface WeeklyP12Row extends WeeklyP11Row {
  raGapFillQty: number | null;
  rbPostGapFillQty: number | null;
}

export interface WeeklyP13Row extends WeeklyP12Row {
  bundleQty: number;
  systemDefaultFinalQty: number | null;
  manualFinalQty: number | null;
  rraFinalQty: number | null;
  rrbFinalAmount: number | null;
}

export interface WeeklyAmountSummary {
  currentWeekPatternPct: number;
  monthLeAmount: number | null;
  actualAmount: number | null;
  weekPatternAmount: number | null;
  targetPendingAmount: number | null;
}

export interface WeeklyGapSummary extends WeeklyAmountSummary {
  suggestedAmountTotal: number | null;
  weekPatternGapAmount: number | null;
  weekPatternGapPct: number | null;
}

export interface WeeklyBuSummary extends WeeklyGapSummary {
  businessUnit: string;
  overageThresholdPct: number;
  shortfallThresholdPct: number;
  systemDefaultFinalAmountTotal: number | null;
  systemDefaultPatternGapAmount: number | null;
  finalAmountTotal: number | null;
  finalPatternGapAmount: number | null;
}

export type WeeklySkuSplitRow = WeeklyP13Row;

export interface WeeklySkuSplitResponse {
  periodMonth: string;
  calendarDate: string;
  sourceBatchId: string;
  strategy?: {
    monthQuotaStrategy: WeeklyMonthQuotaStrategy;
  };
  assumptions: string[];
  summary: {
    totalRows: number;
    totalSkus: number;
    currentWeekPatternPct: number;
    monthLeAmount: number | null;
    actualAmount: number | null;
    weekPatternAmount: number | null;
    targetPendingAmount: number | null;
    suggestedAmountTotal: number | null;
    weekPatternGapAmount: number | null;
    weekPatternGapPct: number | null;
    overageThresholdPct: number;
    shortfallThresholdPct: number;
    systemDefaultFinalAmountTotal: number | null;
    systemDefaultPatternGapAmount: number | null;
    finalAmountTotal: number | null;
    finalPatternGapAmount: number | null;
  };
  buSummaries: WeeklyBuSummary[];
  rows: WeeklySkuSplitRow[];
}

export interface WeeklyStrategyComparisonSuccess {
  label: string;
  status: "ok";
  strategy: {
    monthQuotaStrategy: WeeklyMonthQuotaStrategy;
  };
  summary: WeeklySkuSplitResponse["summary"];
  summaryDelta: {
    currentWeekPatternPctDelta: number;
    monthLeAmountDelta: number | null;
    actualAmountDelta: number | null;
    weekPatternAmountDelta: number | null;
    targetPendingAmountDelta: number | null;
    suggestedAmountTotalDelta: number | null;
    weekPatternGapAmountDelta: number | null;
    weekPatternGapPctDelta: number | null;
    finalAmountTotalDelta: number | null;
    finalPatternGapAmountDelta: number | null;
  };
  rowDeltaSample: Array<{
    businessUnit: string;
    channelCode: string;
    categoryCode: string;
    sku: string;
    adDelta: number | null;
    aoDelta: number | null;
    saDelta: number | null;
    raDelta: number | null;
    rraDelta: number | null;
    rrbDelta: number | null;
  }>;
}

export interface WeeklyStrategyComparisonError {
  label: string;
  status: "error";
  strategy: {
    monthQuotaStrategy?: WeeklyMonthQuotaStrategy;
  };
  error: string;
}

export interface WeeklyStrategyComparisonResponse {
  input: {
    calendarDate: string;
  };
  baseline: {
    strategy: NonNullable<WeeklySkuSplitResponse["strategy"]>;
    sourceBatchId: string;
    summary: WeeklySkuSplitResponse["summary"];
  };
  comparisons: Array<WeeklyStrategyComparisonSuccess | WeeklyStrategyComparisonError>;
}
