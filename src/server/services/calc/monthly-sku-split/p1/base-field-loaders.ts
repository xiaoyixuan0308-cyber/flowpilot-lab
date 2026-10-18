import type { CalculationInput } from "../sku-split.types";
import type { P1ReferenceIndexes } from "./build-reference-indexes";
import { buildP1ReferenceIndexes } from "./build-reference-indexes";
import type { P1TimeWindowAggregates } from "./build-time-window-aggregates";
import { buildP1TimeWindowAggregates } from "./build-time-window-aggregates";

export interface P1BaseFieldArtifacts
  extends P1TimeWindowAggregates,
    Pick<P1ReferenceIndexes, "invByDealerSku" | "diohByDealerSku" | "activeSkuByDealerCategorySku" | "dealerGroups"> {}

/**
 * drawio P1
 * 承接：
 * - E/F/G/H/I/T/U/V/W/J/K/L 前置所需的基础取数与聚合
 * 当前先抽出不改变公式结果的“基础字段装载”部分。
 */
export function buildP1BaseFieldArtifacts(input: CalculationInput): P1BaseFieldArtifacts {
  const { periodMonth, t2Purchases, inventories, diohTargets, fcstChannelCategory, fcstT2Category, activeSkus } = input;
  const timeWindowAggregates = buildP1TimeWindowAggregates({
    periodMonth,
    t2Purchases,
    fcstT2Category,
    fcstChannelCategory,
  });
  const { year, month } = timeWindowAggregates;

  const referenceIndexes = buildP1ReferenceIndexes({
    year,
    month,
    inventories,
    diohTargets,
    activeSkus,
  });

  return {
    ...timeWindowAggregates,
    ...referenceIndexes,
  };
}
