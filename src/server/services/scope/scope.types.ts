import type {
  ActiveSkuRow,
  DiohRow,
  FcstChannelCategoryRow,
  FcstT2CategoryRow,
  InventoryRow,
  T2PurchaseRow,
} from "@/server/services/calc/monthly-sku-split/sku-split.types";
import type { SkuSplitErrorCode } from "@/server/constants/sku-split-error-catalog";

export interface ChannelCategoryScopeRow {
  periodMonth: string;
  businessUnit: string;
  channelCode: string;
  channelName: string | null;
  categoryCode: string;
  categoryName: string | null;
  scopeSource: string;
}

export interface ChannelCategoryStatusRow {
  periodMonth: string;
  businessUnit: string;
  channelCode: string;
  channelName: string | null;
  categoryCode: string;
  categoryName: string | null;
  hasQuota: boolean;
  hasHistory: boolean;
  quotaQty: number | null;
  historyQtyM6M1: number | null;
  statusNote: string | null;
  errorCode: SkuSplitErrorCode | null;
}

export interface CategorySkuScopeRow {
  periodMonth: string;
  businessUnit: string;
  categoryCode: string;
  categoryName: string | null;
  sku: string;
  skuSource: string;
}

export interface ChannelCategorySkuStatusRow {
  periodMonth: string;
  businessUnit: string;
  channelCode: string;
  channelName: string | null;
  categoryCode: string;
  categoryName: string | null;
  sku: string;
  hasQuota: boolean;
  hasHistory: boolean;
  quotaQty: number | null;
  historyQtyM6M1: number | null;
  statusNote: string | null;
  errorCode: SkuSplitErrorCode | null;
}

export interface ScopeSourceData {
  periodMonth: string;
  t2Purchases: T2PurchaseRow[];
  inventories: InventoryRow[];
  diohTargets: DiohRow[];
  fcstChannelCategory: FcstChannelCategoryRow[];
  fcstT2Category: FcstT2CategoryRow[];
  activeSkus: ActiveSkuRow[];
}

export interface ScopeArtifacts {
  channelCategoryScopeRows: ChannelCategoryScopeRow[];
  channelCategoryStatusRows: ChannelCategoryStatusRow[];
  categorySkuScopeRows: CategorySkuScopeRow[];
  channelCategorySkuStatusRows: ChannelCategorySkuStatusRow[];
}
