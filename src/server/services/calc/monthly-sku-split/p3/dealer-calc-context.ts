import type { ActiveSkuRow, DiohRow, InventoryRow } from "../sku-split.types";
import type { DealerSkuMidState, DealerSkuQState } from "./build-dealer-sku-mid-state";

export interface DealerBaseContext {
  businessUnit: string;
  dealerCode: string;
  activeRowKeys: string[];
  invByDealerSku: Map<string, InventoryRow>;
  diohByDealerSku: Map<string, DiohRow>;
  activeSkuByDealerCategorySku: Map<string, ActiveSkuRow>;
  dealerCategorySkuHMap: Map<string, number>;
  dealerCategorySku6mSum: Map<string, number>;
  dealerCategory6mSum: Map<string, number>;
  dealerCategoryTMap: Map<string, number>;
  dealerCategoryUMap: Map<string, number>;
  dealerCategoryVMap: Map<string, number>;
}

export interface DealerMidContext {
  businessUnit: string;
  dealerCode: string;
  wMap: Map<string, number>;
  skuMid: Map<string, DealerSkuMidState>;
}

export interface DealerQContext {
  businessUnit: string;
  dealerCode: string;
  wMap: Map<string, number>;
  skuQState: Map<string, DealerSkuQState>;
  category_fStar: Map<string, number>;
  category_iStar: Map<string, number>;
  category_jStar: Map<string, number>;
  category_qStar: Map<string, number>;
}
