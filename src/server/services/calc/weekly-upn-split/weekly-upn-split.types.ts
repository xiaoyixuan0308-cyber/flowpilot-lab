export interface WeeklyMonthlySnapshotRow {
  scBu: string;
  lpCode: string;
  pl5Code: string;
  upn: string;
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
  scBu: string;
  periodMonth: Date;
  monthStartDate: Date;
  weekStartDate: Date;
  weekEndDate: Date;
  prevWeekPatternPct: number | null;
  currentWeekPatternPct: number | null;
}

export interface WeeklyDealerDnRow {
  scBu: string;
  dealerType: string;
  soldToPt: string | null;
  material: string | null;
  createdOn: Date | null;
  deliveryQty: number;
}

export interface WeeklyOpenOrderRow {
  scBu: string;
  customer: string | null;
  dealerType: string | null;
  material: string | null;
  dctp: string | null;
  openQty: number;
}

export interface WeeklyBscInventoryRow {
  material: string;
  sloc: string | null;
  unrestrictedQty: number;
}

export interface WeeklyBscIntransitRow {
  material: string;
  forecastDate: Date | null;
  intransitQty: number;
}

export interface WeeklySafetyStockRow {
  upn: string;
  safetyStockQty: number;
}

export interface WeeklyPurchasePriceRow {
  dealerCode: string;
  dealerType: string;
  upn: string;
  bscStdSellPrice: number | null;
  bscStdSellPriceVat: number | null;
}

export type WeeklyConstraintType = "WEEK_CAP" | "MONTH_CAP";

export interface WeeklyConstraintRule {
  scBu: string;
  upn: string;
  constraintType: WeeklyConstraintType;
}

export interface WeeklyBundleRule {
  upn: string;
  bundleQty: number;
}

export interface WeeklyDiohRow {
  lpCode: string;
  upn: string;
  abcClass: string | null;
}

export interface WeeklyAmountRow {
  scBu: string;
  periodWeek: Date;
  periodMonth: Date;
  actualAmount: number | null;
  monthTargetAmount: number;
  monthLimitAmount: number;
}

export interface WeeklyAmountThresholdRow {
  scBu: string;
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
  inventoryRows: WeeklyBscInventoryRow[];
  intransitRows: WeeklyBscIntransitRow[];
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
  yaBscInventoryQty: number | null;
  ybIntransitQty: number;
  ycSafetyStockQty: number;
  yBscAvailableQty: number | null;
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
  bhRemainingBscAvailableQty: number | null;
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
  bbUpnAbcClass: string | null;
  hUpnMonthlyCapQty: number | null;
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
  scBu: string;
  overageThresholdPct: number;
  shortfallThresholdPct: number;
  systemDefaultFinalAmountTotal: number | null;
  systemDefaultPatternGapAmount: number | null;
  finalAmountTotal: number | null;
  finalPatternGapAmount: number | null;
}

export type WeeklyUpnSplitRow = WeeklyP13Row;

export interface WeeklyUpnSplitResponse {
  periodMonth: string;
  calendarDate: string;
  sourceBatchId: string;
  strategy?: {
    monthQuotaStrategy: WeeklyMonthQuotaStrategy;
  };
  assumptions: string[];
  summary: {
    totalRows: number;
    totalUpns: number;
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
  rows: WeeklyUpnSplitRow[];
}

export interface WeeklyStrategyComparisonSuccess {
  label: string;
  status: "ok";
  strategy: {
    monthQuotaStrategy: WeeklyMonthQuotaStrategy;
  };
  summary: WeeklyUpnSplitResponse["summary"];
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
    scBu: string;
    lpCode: string;
    pl5Code: string;
    upn: string;
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
    strategy: NonNullable<WeeklyUpnSplitResponse["strategy"]>;
    sourceBatchId: string;
    summary: WeeklyUpnSplitResponse["summary"];
  };
  comparisons: Array<WeeklyStrategyComparisonSuccess | WeeklyStrategyComparisonError>;
}
