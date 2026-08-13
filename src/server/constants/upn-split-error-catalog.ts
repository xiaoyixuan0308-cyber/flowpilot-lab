export type UpnSplitErrorCode =
  | "HAS_FCST_PL5_NO_HISTORY"
  | "NO_FCST_PL5_NO_HISTORY"
  | "UPN_M0_ZERO"
  | "CURRENT_DIOH_LT_30_NEED_REPLENISH"
  | "PL5_ALLOCATE_MISMATCH";

export interface UpnSplitErrorDefinition {
  id: string;
  code: UpnSplitErrorCode;
  message: string;
  shouldSkipCalc: boolean;
}

export const UPN_SPLIT_ERROR_CATALOG: Record<UpnSplitErrorCode, UpnSplitErrorDefinition> = {
  HAS_FCST_PL5_NO_HISTORY: {
    id: "c80adf2e-8be8-4559-9d3a-a97e25c72ad6",
    code: "HAS_FCST_PL5_NO_HISTORY",
    message: "当前PL5有预测但无历史数据，无法参与计算",
    shouldSkipCalc: true,
  },
  NO_FCST_PL5_NO_HISTORY: {
    id: "5a6cb8f5-43c4-4b16-b7ab-2d8c34cf2d14",
    code: "NO_FCST_PL5_NO_HISTORY",
    message: "当前PL5无预测且无历史数据，无法参与计算",
    shouldSkipCalc: true,
  },
  UPN_M0_ZERO: {
    id: "de7924d6-9023-44d7-aa29-278ae506d95b",
    code: "UPN_M0_ZERO",
    message: "UPN M0为0，无预商采值",
    shouldSkipCalc: true,
  },
  CURRENT_DIOH_LT_30_NEED_REPLENISH: {
    id: "8f3106db-93a4-4dd4-94d8-b03e7c9960d9",
    code: "CURRENT_DIOH_LT_30_NEED_REPLENISH",
    message: "补货值不足，达到30天仍需补货",
    shouldSkipCalc: false,
  },
  PL5_ALLOCATE_MISMATCH: {
    id: "4080b7d7-68a5-426b-ac5e-ff07beb64ae4",
    code: "PL5_ALLOCATE_MISMATCH",
    message: "UPN最终分配结果按PL5累加不等于PL5配额",
    shouldSkipCalc: false,
  },
};

export function getUpnSplitErrorDefinition(code: UpnSplitErrorCode) {
  return UPN_SPLIT_ERROR_CATALOG[code];
}

export function getUpnSplitErrorMessage(code: UpnSplitErrorCode) {
  return UPN_SPLIT_ERROR_CATALOG[code].message;
}
