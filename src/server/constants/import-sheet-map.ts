export type ImportSheetTable =
  | "inventory"
  | "t2Purchase"
  | "diohTarget"
  | "fcstLpPl5"
  | "fcstT2Pl5"
  | "dealerUpnDn"
  | "dealerUpnOpenOrder"
  | "bscUpnInventory"
  | "bscUpnIntransit"
  | "upnSafetyStock"
  | "lpUpnPurchasePrice"
  | "upnConstraint"
  | "upnBundle"
  | "weeklyAmountThreshold"
  | "calendarPatternWeekly"
  | "buPatternAmountWeekly";

export interface ImportSheetDefinition {
  sheet: string;
  table: ImportSheetTable;
  label: string;
  templateSheetName?: string;
  aliases?: string[];
  includeInUnifiedPackage?: boolean;
  requiredFields: string[];
  helpFields: string;
  templateHeaders?: string[];
}

export const IMPORT_SHEET_DEFINITIONS: ImportSheetDefinition[] = [
  {
    sheet: "本月发货-UPN",
    table: "inventory",
    label: "库存基础表",
    templateSheetName: "库存基础表",
    aliases: ["库存数据"],
    requiredFields: ["dealerlpcode", "upn", "qty"],
    helpFields: "dealerlpcode, dealerlpname, upn, qty, year, month",
  },
  {
    sheet: "T2采购",
    table: "t2Purchase",
    label: "T2采购历史表",
    templateSheetName: "T2采购历史表",
    aliases: ["T2采购月度"],
    requiredFields: ["sc_bu", "upn", "pl5_code", "qty", "year", "month"],
    helpFields: "parentdealerlpcode, parentdealerlpname, sc_bu, upn, pl5_code, pl5_name, qty, year, month",
  },
  {
    sheet: "DIOH",
    table: "diohTarget",
    label: "DIOH规则表",
    templateSheetName: "DIOH规则表",
    aliases: ["DIOH目标"],
    requiredFields: ["dealerlpcode", "upn", "dioh_days"],
    helpFields: "dealerlpcode, dealerlpname, upn, abc_class, dioh_days",
  },
  {
    sheet: "LP PL5 FCST",
    table: "fcstLpPl5",
    label: "LP-PL5配货预测表",
    templateSheetName: "LP-PL5配货预测表",
    aliases: ["LP PL5月度FCST"],
    requiredFields: ["dealerlpcode", "sc_bu", "pl5_code", "fcst_qty", "year", "month"],
    helpFields: "dealerlpcode, dealerlpname, sc_bu, pl5_code, pl5_name, fcst_qty, year, month",
  },
  {
    sheet: "T2 PL5 FCST",
    table: "fcstT2Pl5",
    label: "T2-PL5预测表",
    templateSheetName: "T2-PL5预测表",
    aliases: ["T2 PL5月度FCST"],
    requiredFields: ["sc_bu", "pl5_code", "fcst_qty", "year", "month"],
    helpFields: "parentdealerlpcode, parentdealerlpname, sc_bu, pl5_code, pl5_name, fcst_qty, year, month",
  },
  {
    sheet: "Dealer UPN DN",
    table: "dealerUpnDn",
    label: "经销商发货记录",
    templateSheetName: "经销商发货记录",
    requiredFields: ["created_on", "sc_bu", "dealer_type", "material", "delivery_qty"],
    helpFields: "created_on, sold_to_pt, sc_bu, dealer_type, material, delivery_qty",
  },
  {
    sheet: "Dealer UPN Open Order",
    table: "dealerUpnOpenOrder",
    label: "经销商未清订单",
    templateSheetName: "经销商未清订单",
    requiredFields: ["customer", "sc_bu", "material", "dctp", "open_qty"],
    helpFields: "customer, sc_bu, dealer_type, material, dctp, open_qty",
  },
  {
    sheet: "BSC UPN Inventory",
    table: "bscUpnInventory",
    label: "BSC库存",
    templateSheetName: "BSC库存",
    requiredFields: ["material", "sloc", "unrestricted_qty"],
    helpFields: "material, sloc, unrestricted_qty",
  },
  {
    sheet: "BSC UPN Intransit",
    table: "bscUpnIntransit",
    label: "BSC在途库存",
    templateSheetName: "BSC在途库存",
    requiredFields: ["material", "forecast_date", "intransit_qty"],
    helpFields: "material, forecast_date, intransit_qty",
  },
  {
    sheet: "UPN Safety Stock",
    table: "upnSafetyStock",
    label: "安全库存",
    templateSheetName: "安全库存",
    requiredFields: ["upn", "safety_stock_qty"],
    helpFields: "upn, safety_stock_qty",
  },
  {
    sheet: "LP UPN Purchase Price",
    table: "lpUpnPurchasePrice",
    label: "Dealer UPN单价",
    templateSheetName: "Dealer UPN单价",
    requiredFields: ["dealer_code", "dealer_type", "upn", "bsc_std_sell_price", "currency_code"],
    helpFields: "dealer_code, dealer_type, upn, bsc_std_sell_price, bsc_std_sell_price_vat, currency_code",
  },
  {
    sheet: "UPN Constraint",
    table: "upnConstraint",
    label: "UPN周月约束规则",
    templateSheetName: "UPN周月约束规则",
    aliases: ["约束规则", "UPN约束", "UPN周月约束"],
    requiredFields: ["period_month", "sc_bu", "upn", "constraint_type"],
    helpFields: "period_month, sc_bu, upn, constraint_type, source_system",
  },
  {
    sheet: "UPN Bundle",
    table: "upnBundle",
    label: "UPN套包规则",
    templateSheetName: "UPN套包规则",
    aliases: ["套包规则", "UPN套包", "套包"],
    requiredFields: ["upn", "bundle_qty"],
    helpFields: "upn, bundle_qty, source_system",
  },
  {
    sheet: "Weekly Amount Threshold",
    table: "weeklyAmountThreshold",
    label: "周金额调整阈值",
    templateSheetName: "周金额调整阈值",
    aliases: ["金额调整阈值", "周金额阈值"],
    requiredFields: [
      "sc_bu",
      "overage_threshold_pct",
      "shortfall_threshold_pct",
    ],
    helpFields: "sc_bu, overage_threshold_pct, shortfall_threshold_pct",
    templateHeaders: ["SC BU", "超额缩减阈值(%)", "缺口补差阈值(%)"],
  },
  {
    sheet: "Calendar Pattern Weekly",
    table: "calendarPatternWeekly",
    label: "周历与周配比",
    templateSheetName: "周历与周配比",
    aliases: ["周历与Pattern"],
    requiredFields: [
      "sc_bu",
      "period_month",
      "month_start_date",
      "week_start_date",
      "week_end_date",
      "current_week_pattern_pct",
    ],
    helpFields:
      "sc_bu, period_month, month_start_date, week_start_date, week_end_date, prev_week_pattern_pct, current_week_pattern_pct",
  },
  {
    sheet: "BU Pattern Amount Weekly",
    table: "buPatternAmountWeekly",
    label: "SCBU周/月预算",
    templateSheetName: "BU周金额目标",
    requiredFields: ["period_week", "period_month", "sc_bu", "month_target_amount", "month_limit_amount", "currency_code"],
    helpFields: "period_week, period_month, sc_bu, actual_amount, month_target_amount, month_limit_amount, currency_code",
  },
];

export const IMPORT_SHEET_TABLE_MAP = Object.fromEntries(
  IMPORT_SHEET_DEFINITIONS.map((item) => [item.sheet, item])
) as Record<string, ImportSheetDefinition>;

export function getImportSheetDefinitionByTable(table: string | null) {
  if (!table) return null;
  return IMPORT_SHEET_DEFINITIONS.find((item) => item.table === table) ?? null;
}

export function isImportSheetTable(table: string | null): table is ImportSheetTable {
  return Boolean(getImportSheetDefinitionByTable(table));
}

export function matchImportSheetDefinition(sheetName: string) {
  const name = sheetName.trim();
  const exact = IMPORT_SHEET_TABLE_MAP[name];

  if (exact) {
    return exact;
  }

  for (const value of IMPORT_SHEET_DEFINITIONS) {
    const candidates = [value.sheet, value.templateSheetName, value.label, ...(value.aliases ?? [])].filter(
      Boolean,
    ) as string[];

    if (candidates.some((candidate) => name === candidate.trim())) {
      return value;
    }

    if (candidates.some((candidate) => name.includes(candidate.trim()) || candidate.trim().includes(name))) {
      return value;
    }
  }

  return null;
}
