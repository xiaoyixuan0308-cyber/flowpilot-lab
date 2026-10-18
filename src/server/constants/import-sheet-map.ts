export type ImportSheetTable =
  | "inventory"
  | "t2Purchase"
  | "diohTarget"
  | "fcstChannelCategory"
  | "fcstT2Category"
  | "dealerSkuDn"
  | "dealerSkuOpenOrder"
  | "centralWarehouseSkuInventory"
  | "centralWarehouseSkuIntransit"
  | "skuSafetyStock"
  | "channelSkuPurchasePrice"
  | "skuConstraint"
  | "skuBundle"
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
    sheet: "本月发货-SKU",
    table: "inventory",
    label: "库存基础表",
    templateSheetName: "库存基础表",
    aliases: ["库存数据"],
    requiredFields: ["dealer_channel_code", "sku", "qty"],
    helpFields: "dealer_channel_code, dealer_channel_name, sku, qty, year, month",
  },
  {
    sheet: "T2采购",
    table: "t2Purchase",
    label: "T2采购历史表",
    templateSheetName: "T2采购历史表",
    aliases: ["T2采购月度"],
    requiredFields: ["business_unit", "sku", "category_code", "qty", "year", "month"],
    helpFields: "parent_dealer_channel_code, parent_dealer_channel_name, business_unit, sku, category_code, category_name, qty, year, month",
  },
  {
    sheet: "DIOH",
    table: "diohTarget",
    label: "DIOH规则表",
    templateSheetName: "DIOH规则表",
    aliases: ["DIOH目标"],
    requiredFields: ["dealer_channel_code", "sku", "dioh_days"],
    helpFields: "dealer_channel_code, dealer_channel_name, sku, abc_class, dioh_days",
  },
  {
    sheet: "Channel Category FCST",
    table: "fcstChannelCategory",
    label: "渠道-产品分类配货预测表",
    templateSheetName: "渠道-产品分类配货预测表",
    aliases: ["渠道 产品分类月度FCST"],
    requiredFields: ["dealer_channel_code", "business_unit", "category_code", "fcst_qty", "year", "month"],
    helpFields: "dealer_channel_code, dealer_channel_name, business_unit, category_code, category_name, fcst_qty, year, month",
  },
  {
    sheet: "T2 Category FCST",
    table: "fcstT2Category",
    label: "二级渠道-产品分类预测表",
    templateSheetName: "二级渠道-产品分类预测表",
    aliases: ["T2 产品分类月度FCST"],
    requiredFields: ["business_unit", "category_code", "fcst_qty", "year", "month"],
    helpFields: "parent_dealer_channel_code, parent_dealer_channel_name, business_unit, category_code, category_name, fcst_qty, year, month",
  },
  {
    sheet: "Dealer SKU DN",
    table: "dealerSkuDn",
    label: "经销商发货记录",
    templateSheetName: "经销商发货记录",
    requiredFields: ["created_on", "business_unit", "dealer_type", "material", "delivery_qty"],
    helpFields: "created_on, sold_to_pt, business_unit, dealer_type, material, delivery_qty",
  },
  {
    sheet: "Dealer SKU Open Order",
    table: "dealerSkuOpenOrder",
    label: "经销商未清订单",
    templateSheetName: "经销商未清订单",
    requiredFields: ["customer", "business_unit", "material", "dctp", "open_qty"],
    helpFields: "customer, business_unit, dealer_type, material, dctp, open_qty",
  },
  {
    sheet: "Central Warehouse SKU Inventory",
    table: "centralWarehouseSkuInventory",
    label: "中央仓库存",
    templateSheetName: "中央仓库存",
    requiredFields: ["material", "sloc", "unrestricted_qty"],
    helpFields: "material, sloc, unrestricted_qty",
  },
  {
    sheet: "Central Warehouse SKU Intransit",
    table: "centralWarehouseSkuIntransit",
    label: "中央仓在途库存",
    templateSheetName: "中央仓在途库存",
    requiredFields: ["material", "forecast_date", "intransit_qty"],
    helpFields: "material, forecast_date, intransit_qty",
  },
  {
    sheet: "SKU Safety Stock",
    table: "skuSafetyStock",
    label: "安全库存",
    templateSheetName: "安全库存",
    requiredFields: ["sku", "safety_stock_qty"],
    helpFields: "sku, safety_stock_qty",
  },
  {
    sheet: "Channel SKU Purchase Price",
    table: "channelSkuPurchasePrice",
    label: "经销商SKU单价",
    templateSheetName: "经销商SKU单价",
    requiredFields: ["dealer_code", "dealer_type", "sku", "central_warehouse_std_sell_price", "currency_code"],
    helpFields: "dealer_code, dealer_type, sku, central_warehouse_std_sell_price, central_warehouse_std_sell_price_vat, currency_code",
  },
  {
    sheet: "SKU Constraint",
    table: "skuConstraint",
    label: "SKU周月约束规则",
    templateSheetName: "SKU周月约束规则",
    aliases: ["约束规则", "SKU约束", "SKU周月约束"],
    requiredFields: ["period_month", "business_unit", "sku", "constraint_type"],
    helpFields: "period_month, business_unit, sku, constraint_type, source_system",
  },
  {
    sheet: "SKU Bundle",
    table: "skuBundle",
    label: "SKU套包规则",
    templateSheetName: "SKU套包规则",
    aliases: ["套包规则", "SKU套包", "套包"],
    requiredFields: ["sku", "bundle_qty"],
    helpFields: "sku, bundle_qty, source_system",
  },
  {
    sheet: "Weekly Amount Threshold",
    table: "weeklyAmountThreshold",
    label: "周金额调整阈值",
    templateSheetName: "周金额调整阈值",
    aliases: ["金额调整阈值", "周金额阈值"],
    requiredFields: [
      "business_unit",
      "overage_threshold_pct",
      "shortfall_threshold_pct",
    ],
    helpFields: "business_unit, overage_threshold_pct, shortfall_threshold_pct",
    templateHeaders: ["SC BU", "超额缩减阈值(%)", "缺口补差阈值(%)"],
  },
  {
    sheet: "Calendar Pattern Weekly",
    table: "calendarPatternWeekly",
    label: "周历与周配比",
    templateSheetName: "周历与周配比",
    aliases: ["周历与Pattern"],
    requiredFields: [
      "business_unit",
      "period_month",
      "month_start_date",
      "week_start_date",
      "week_end_date",
      "current_week_pattern_pct",
    ],
    helpFields:
      "business_unit, period_month, month_start_date, week_start_date, week_end_date, prev_week_pattern_pct, current_week_pattern_pct",
  },
  {
    sheet: "BU Pattern Amount Weekly",
    table: "buPatternAmountWeekly",
    label: "业务单元周/月预算",
    templateSheetName: "BU周金额目标",
    requiredFields: ["period_week", "period_month", "business_unit", "month_target_amount", "month_limit_amount", "currency_code"],
    helpFields: "period_week, period_month, business_unit, actual_amount, month_target_amount, month_limit_amount, currency_code",
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
