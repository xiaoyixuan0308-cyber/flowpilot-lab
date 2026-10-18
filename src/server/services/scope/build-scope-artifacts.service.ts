import { CalculationInputError } from "@/server/services/calc/calculation-input-error";
import { getSkuSplitErrorDefinition } from "@/server/constants/sku-split-error-catalog";
import type {
  ChannelCategoryScopeRow,
  ChannelCategoryStatusRow,
  ChannelCategorySkuStatusRow,
  CategorySkuScopeRow,
  ScopeArtifacts,
  ScopeSourceData,
} from "./scope.types";
import { getPrevMonth, getYearMonth } from "./date-utils";

type NamedSources = Map<string, { name: string | null; sources: Set<string> }>;

function putNamedSource(
  map: NamedSources,
  businessUnit: string,
  code: string | null | undefined,
  name: string | null | undefined,
  source: string,
) {
  if (!code) return;
  const key = `${businessUnit}|${code}`;
  const current = map.get(key);
  if (!current) {
    map.set(key, { name: name ?? null, sources: new Set([source]) });
    return;
  }
  if (!current.name && name) current.name = name;
  current.sources.add(source);
}

function sumByKey<T>(rows: T[], keyFn: (row: T) => string, valueFn: (row: T) => number) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) ?? 0) + valueFn(row));
  }
  return map;
}

function buildStatusNote(hasQuota: boolean, hasHistory: boolean) {
  if (hasQuota && hasHistory) return "HAS_QUOTA_HAS_HISTORY";
  if (hasQuota) return "HAS_QUOTA_NO_HISTORY";
  if (hasHistory) return "NO_QUOTA_HAS_HISTORY";
  return "NO_QUOTA_NO_HISTORY";
}

function resolveStatusErrorCode(hasQuota: boolean, hasHistory: boolean) {
  if (hasHistory) return null;
  if (hasQuota) return getSkuSplitErrorDefinition("HAS_FCST_CATEGORY_NO_HISTORY").code;
  return getSkuSplitErrorDefinition("NO_FCST_CATEGORY_NO_HISTORY").code;
}

function splitBusinessKey(key: string) {
  const separator = key.indexOf("|");
  return [key.slice(0, separator), key.slice(separator + 1)] as const;
}

export function buildScopeArtifacts(source: ScopeSourceData): ScopeArtifacts {
  const { periodMonth, t2Purchases, fcstChannelCategory, fcstT2Category } = source;
  const { year, month } = getYearMonth(periodMonth);
  const mtdPurchases = t2Purchases.filter((row) => row.year === year && row.month === month);
  const channelMap: NamedSources = new Map();
  const categoryMap: NamedSources = new Map();

  for (const row of fcstChannelCategory) {
    if (row.year !== year || row.month !== month) continue;
    putNamedSource(channelMap, row.business_unit, row.dealer_channel_code, row.dealer_channel_name, "ODS_FCST_CHANNEL_CATEGORY");
    putNamedSource(categoryMap, row.business_unit, row.category_code, row.category_name, "ODS_FCST_CHANNEL_CATEGORY");
  }
  for (const row of fcstT2Category) {
    if (row.year !== year || row.month !== month) continue;
    putNamedSource(channelMap, row.business_unit, row.parent_dealer_channel_code, row.parent_dealer_channel_name, "ODS_FCST_T2_CATEGORY");
    putNamedSource(categoryMap, row.business_unit, row.category_code, row.category_name, "ODS_FCST_T2_CATEGORY");
  }
  for (const row of mtdPurchases) {
    putNamedSource(channelMap, row.business_unit, row.parent_dealer_channel_code, row.parent_dealer_channel_name, "ODS_T2_PURCHASE");
    putNamedSource(categoryMap, row.business_unit, row.category_code, row.category_name, "ODS_T2_PURCHASE");
  }

  const businessUnits = new Set(
    [...channelMap.keys(), ...categoryMap.keys()].map((key) => splitBusinessKey(key)[0]),
  );
  const channelCategoryScopeRows: ChannelCategoryScopeRow[] = [];
  for (const businessUnit of businessUnits) {
    const channels = [...channelMap.entries()].filter(([key]) => splitBusinessKey(key)[0] === businessUnit);
    const categories = [...categoryMap.entries()].filter(([key]) => splitBusinessKey(key)[0] === businessUnit);
    for (const [channelKey, channelInfo] of channels) {
      const channelCode = splitBusinessKey(channelKey)[1];
      for (const [categoryKey, categoryInfo] of categories) {
        const categoryCode = splitBusinessKey(categoryKey)[1];
        channelCategoryScopeRows.push({
          periodMonth,
          businessUnit,
          channelCode,
          channelName: channelInfo.name,
          categoryCode,
          categoryName: categoryInfo.name,
          scopeSource: `Channel:${[...channelInfo.sources].join("|")};Category:${[...categoryInfo.sources].join("|")}`,
        });
      }
    }
  }

  const historyMonths = Array.from({ length: 6 }, (_, index) => getPrevMonth(periodMonth, index + 1))
    .map(getYearMonth);
  const historyMonthSet = new Set(historyMonths.map((item) => `${item.year}-${item.month}`));
  const quotaMap = sumByKey(
    fcstChannelCategory.filter((row) => row.year === year && row.month === month),
    (row) => `${row.business_unit}|${row.dealer_channel_code}|${row.category_code}`,
    (row) => row.fcst_qty,
  );
  const historyMap = sumByKey(
    t2Purchases.filter(
      (row) => historyMonthSet.has(`${row.year}-${row.month}`) && Boolean(row.parent_dealer_channel_code),
    ),
    (row) => `${row.business_unit}|${row.parent_dealer_channel_code}|${row.category_code}`,
    (row) => row.qty,
  );
  const channelCategoryStatusRows: ChannelCategoryStatusRow[] = channelCategoryScopeRows.map((row) => {
    const key = `${row.businessUnit}|${row.channelCode}|${row.categoryCode}`;
    const quotaQty = quotaMap.get(key) ?? null;
    const historyQty = historyMap.get(key) ?? null;
    const hasQuota = quotaQty !== null && quotaQty > 0;
    const hasHistory = historyQty !== null && historyQty > 0;
    return {
      ...row,
      hasQuota,
      hasHistory,
      quotaQty,
      historyQtyM6M1: historyQty,
      statusNote: buildStatusNote(hasQuota, hasHistory),
      errorCode: resolveStatusErrorCode(hasQuota, hasHistory),
    };
  });

  const skuCategoryMap = new Map<string, Set<string>>();
  const categorySkuSources = new Map<string, Set<string>>();
  const categoryNameByBu = new Map<string, string | null>();
  for (const row of t2Purchases) {
    const key = `${row.business_unit}|${row.category_code}|${row.sku}`;
    const sources = categorySkuSources.get(key) ?? new Set<string>();
    sources.add("ODS_T2_PURCHASE");
    categorySkuSources.set(key, sources);
    const categoryCodes = skuCategoryMap.get(row.sku) ?? new Set<string>();
    categoryCodes.add(row.category_code);
    skuCategoryMap.set(row.sku, categoryCodes);
    if (row.category_name) categoryNameByBu.set(`${row.business_unit}|${row.category_code}`, row.category_name);
  }

  const duplicateSkuIssues = [...skuCategoryMap.entries()]
    .filter(([, categoryCodes]) => categoryCodes.size > 1)
    .map(([sku, categoryCodes]) => ({
      source: "T2采购历史",
      field: "category_code",
      key: sku,
      message: `SKU 同时归属多个 产品分类：${[...categoryCodes].sort().join(", ")}`,
    }));
  if (duplicateSkuIssues.length > 0) throw new CalculationInputError(duplicateSkuIssues);

  const categorySkuScopeRows: CategorySkuScopeRow[] = [...categorySkuSources.entries()].map(([key, sources]) => {
    const [businessUnit, categoryCode, sku] = key.split("|");
    return {
      periodMonth,
      businessUnit,
      categoryCode,
      categoryName: categoryNameByBu.get(`${businessUnit}|${categoryCode}`) ?? null,
      sku,
      skuSource: [...sources].join("|"),
    };
  });

  const channelCategorySkuStatusRows: ChannelCategorySkuStatusRow[] = [];
  for (const status of channelCategoryStatusRows) {
    for (const scopedSku of categorySkuScopeRows) {
      if (scopedSku.businessUnit !== status.businessUnit || scopedSku.categoryCode !== status.categoryCode) continue;
      channelCategorySkuStatusRows.push({
        periodMonth,
        businessUnit: status.businessUnit,
        channelCode: status.channelCode,
        channelName: status.channelName,
        categoryCode: status.categoryCode,
        categoryName: status.categoryName,
        sku: scopedSku.sku,
        hasQuota: status.hasQuota,
        hasHistory: status.hasHistory,
        quotaQty: status.quotaQty,
        historyQtyM6M1: status.historyQtyM6M1,
        statusNote: status.statusNote,
        errorCode: status.errorCode,
      });
    }
  }

  return { channelCategoryScopeRows, channelCategoryStatusRows, categorySkuScopeRows, channelCategorySkuStatusRows };
}
