import type {
  ActiveUpnRow,
  DiohRow,
  FcstLpPl5Row,
  FcstT2Pl5Row,
  InventoryRow,
  T2PurchaseRow,
} from "@/server/services/calc/monthly-upn-split/upn-split.types";
import type { UpnSplitErrorCode } from "@/server/constants/upn-split-error-catalog";

export interface LpPl5ScopeRow {
  periodMonth: string;
  scBu: string;
  lpCode: string;
  lpName: string | null;
  pl5Code: string;
  pl5Name: string | null;
  scopeSource: string;
}

export interface LpPl5StatusRow {
  periodMonth: string;
  scBu: string;
  lpCode: string;
  lpName: string | null;
  pl5Code: string;
  pl5Name: string | null;
  hasQuota: boolean;
  hasHistory: boolean;
  quotaQty: number | null;
  historyQtyM6M1: number | null;
  statusNote: string | null;
  errorCode: UpnSplitErrorCode | null;
}

export interface Pl5UpnScopeRow {
  periodMonth: string;
  scBu: string;
  pl5Code: string;
  pl5Name: string | null;
  upn: string;
  upnSource: string;
}

export interface LpPl5UpnStatusRow {
  periodMonth: string;
  scBu: string;
  lpCode: string;
  lpName: string | null;
  pl5Code: string;
  pl5Name: string | null;
  upn: string;
  hasQuota: boolean;
  hasHistory: boolean;
  quotaQty: number | null;
  historyQtyM6M1: number | null;
  statusNote: string | null;
  errorCode: UpnSplitErrorCode | null;
}

export interface ScopeSourceData {
  periodMonth: string;
  t2Purchases: T2PurchaseRow[];
  inventories: InventoryRow[];
  diohTargets: DiohRow[];
  fcstLpPl5: FcstLpPl5Row[];
  fcstT2Pl5: FcstT2Pl5Row[];
  activeUpns: ActiveUpnRow[];
}

export interface ScopeArtifacts {
  lpPl5ScopeRows: LpPl5ScopeRow[];
  lpPl5StatusRows: LpPl5StatusRow[];
  pl5UpnScopeRows: Pl5UpnScopeRow[];
  lpPl5UpnStatusRows: LpPl5UpnStatusRow[];
}
