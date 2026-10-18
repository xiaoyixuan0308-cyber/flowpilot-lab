export type SkuSplitErrorCode =
  | "HAS_FCST_CATEGORY_NO_HISTORY"
  | "NO_FCST_CATEGORY_NO_HISTORY"
  | "SKU_M0_ZERO"
  | "CURRENT_DIOH_LT_30_NEED_REPLENISH"
  | "CATEGORY_ALLOCATE_MISMATCH";

export interface SkuSplitErrorDefinition {
  id: string;
  code: SkuSplitErrorCode;
  message: string;
  shouldSkipCalc: boolean;
}

export const SKU_SPLIT_ERROR_CATALOG: Record<SkuSplitErrorCode, SkuSplitErrorDefinition> = {
  HAS_FCST_CATEGORY_NO_HISTORY: {
    id: "c80adf2e-8be8-4559-9d3a-a97e25c72ad6",
    code: "HAS_FCST_CATEGORY_NO_HISTORY",
    message: "当前产品分类有预测但无历史数据，无法参与计算",
    shouldSkipCalc: true,
  },
  NO_FCST_CATEGORY_NO_HISTORY: {
    id: "5a6cb8f5-43c4-4b16-b7ab-2d8c34cf2d14",
    code: "NO_FCST_CATEGORY_NO_HISTORY",
    message: "当前产品分类无预测且无历史数据，无法参与计算",
    shouldSkipCalc: true,
  },
  SKU_M0_ZERO: {
    id: "de7924d6-9023-44d7-aa29-278ae506d95b",
    code: "SKU_M0_ZERO",
    message: "SKU M0为0，无预商采值",
    shouldSkipCalc: true,
  },
  CURRENT_DIOH_LT_30_NEED_REPLENISH: {
    id: "8f3106db-93a4-4dd4-94d8-b03e7c9960d9",
    code: "CURRENT_DIOH_LT_30_NEED_REPLENISH",
    message: "补货值不足，达到30天仍需补货",
    shouldSkipCalc: false,
  },
  CATEGORY_ALLOCATE_MISMATCH: {
    id: "4080b7d7-68a5-426b-ac5e-ff07beb64ae4",
    code: "CATEGORY_ALLOCATE_MISMATCH",
    message: "SKU最终分配结果按产品分类累加不等于产品分类配额",
    shouldSkipCalc: false,
  },
};

export function getSkuSplitErrorDefinition(code: SkuSplitErrorCode) {
  return SKU_SPLIT_ERROR_CATALOG[code];
}

export function getSkuSplitErrorMessage(code: SkuSplitErrorCode) {
  return SKU_SPLIT_ERROR_CATALOG[code].message;
}
