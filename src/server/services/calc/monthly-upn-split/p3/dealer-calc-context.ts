import type { ActiveUpnRow, DiohRow, InventoryRow } from "../upn-split.types";
import type { DealerUpnMidState, DealerUpnQState } from "./build-dealer-upn-mid-state";

export interface DealerBaseContext {
  scBu: string;
  dealerCode: string;
  activeRowKeys: string[];
  invByDealerUpn: Map<string, InventoryRow>;
  diohByDealerUpn: Map<string, DiohRow>;
  activeUpnByDealerPl5Upn: Map<string, ActiveUpnRow>;
  dealerPl5UpnHMap: Map<string, number>;
  dealerPl5Upn6mSum: Map<string, number>;
  dealerPl56mSum: Map<string, number>;
  dealerPl5TMap: Map<string, number>;
  dealerPl5UMap: Map<string, number>;
  dealerPl5VMap: Map<string, number>;
}

export interface DealerMidContext {
  scBu: string;
  dealerCode: string;
  wMap: Map<string, number>;
  upnMid: Map<string, DealerUpnMidState>;
}

export interface DealerQContext {
  scBu: string;
  dealerCode: string;
  wMap: Map<string, number>;
  upnQState: Map<string, DealerUpnQState>;
  pl5_fStar: Map<string, number>;
  pl5_iStar: Map<string, number>;
  pl5_jStar: Map<string, number>;
  pl5_qStar: Map<string, number>;
}
