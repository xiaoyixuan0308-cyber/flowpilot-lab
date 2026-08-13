import { CalculationInputError } from "@/server/services/calc/calculation-input-error";
import { getUpnSplitErrorDefinition } from "@/server/constants/upn-split-error-catalog";
import type {
  LpPl5ScopeRow,
  LpPl5StatusRow,
  LpPl5UpnStatusRow,
  Pl5UpnScopeRow,
  ScopeArtifacts,
  ScopeSourceData,
} from "./scope.types";
import { getPrevMonth, getYearMonth } from "./date-utils";

type NamedSources = Map<string, { name: string | null; sources: Set<string> }>;

function putNamedSource(
  map: NamedSources,
  scBu: string,
  code: string | null | undefined,
  name: string | null | undefined,
  source: string,
) {
  if (!code) return;
  const key = `${scBu}|${code}`;
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
  if (hasQuota) return getUpnSplitErrorDefinition("HAS_FCST_PL5_NO_HISTORY").code;
  return getUpnSplitErrorDefinition("NO_FCST_PL5_NO_HISTORY").code;
}

function splitBusinessKey(key: string) {
  const separator = key.indexOf("|");
  return [key.slice(0, separator), key.slice(separator + 1)] as const;
}

export function buildScopeArtifacts(source: ScopeSourceData): ScopeArtifacts {
  const { periodMonth, t2Purchases, fcstLpPl5, fcstT2Pl5 } = source;
  const { year, month } = getYearMonth(periodMonth);
  const mtdPurchases = t2Purchases.filter((row) => row.year === year && row.month === month);
  const lpMap: NamedSources = new Map();
  const pl5Map: NamedSources = new Map();

  for (const row of fcstLpPl5) {
    if (row.year !== year || row.month !== month) continue;
    putNamedSource(lpMap, row.sc_bu, row.dealerlpcode, row.dealerlpname, "ODS_FCST_LP_PL5");
    putNamedSource(pl5Map, row.sc_bu, row.pl5_code, row.pl5_name, "ODS_FCST_LP_PL5");
  }
  for (const row of fcstT2Pl5) {
    if (row.year !== year || row.month !== month) continue;
    putNamedSource(lpMap, row.sc_bu, row.parentdealerlpcode, row.parentdealerlpname, "ODS_FCST_T2_PL5");
    putNamedSource(pl5Map, row.sc_bu, row.pl5_code, row.pl5_name, "ODS_FCST_T2_PL5");
  }
  for (const row of mtdPurchases) {
    putNamedSource(lpMap, row.sc_bu, row.parentdealerlpcode, row.parentdealerlpname, "ODS_T2_PURCHASE");
    putNamedSource(pl5Map, row.sc_bu, row.pl5_code, row.pl5_name, "ODS_T2_PURCHASE");
  }

  const businessUnits = new Set(
    [...lpMap.keys(), ...pl5Map.keys()].map((key) => splitBusinessKey(key)[0]),
  );
  const lpPl5ScopeRows: LpPl5ScopeRow[] = [];
  for (const scBu of businessUnits) {
    const lps = [...lpMap.entries()].filter(([key]) => splitBusinessKey(key)[0] === scBu);
    const pl5s = [...pl5Map.entries()].filter(([key]) => splitBusinessKey(key)[0] === scBu);
    for (const [lpKey, lpInfo] of lps) {
      const lpCode = splitBusinessKey(lpKey)[1];
      for (const [pl5Key, pl5Info] of pl5s) {
        const pl5Code = splitBusinessKey(pl5Key)[1];
        lpPl5ScopeRows.push({
          periodMonth,
          scBu,
          lpCode,
          lpName: lpInfo.name,
          pl5Code,
          pl5Name: pl5Info.name,
          scopeSource: `LP:${[...lpInfo.sources].join("|")};PL5:${[...pl5Info.sources].join("|")}`,
        });
      }
    }
  }

  const historyMonths = Array.from({ length: 6 }, (_, index) => getPrevMonth(periodMonth, index + 1))
    .map(getYearMonth);
  const historyMonthSet = new Set(historyMonths.map((item) => `${item.year}-${item.month}`));
  const quotaMap = sumByKey(
    fcstLpPl5.filter((row) => row.year === year && row.month === month),
    (row) => `${row.sc_bu}|${row.dealerlpcode}|${row.pl5_code}`,
    (row) => row.fcst_qty,
  );
  const historyMap = sumByKey(
    t2Purchases.filter(
      (row) => historyMonthSet.has(`${row.year}-${row.month}`) && Boolean(row.parentdealerlpcode),
    ),
    (row) => `${row.sc_bu}|${row.parentdealerlpcode}|${row.pl5_code}`,
    (row) => row.qty,
  );
  const lpPl5StatusRows: LpPl5StatusRow[] = lpPl5ScopeRows.map((row) => {
    const key = `${row.scBu}|${row.lpCode}|${row.pl5Code}`;
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

  const upnPl5Map = new Map<string, Set<string>>();
  const pl5UpnSources = new Map<string, Set<string>>();
  const pl5NameByBu = new Map<string, string | null>();
  for (const row of t2Purchases) {
    const key = `${row.sc_bu}|${row.pl5_code}|${row.upn}`;
    const sources = pl5UpnSources.get(key) ?? new Set<string>();
    sources.add("ODS_T2_PURCHASE");
    pl5UpnSources.set(key, sources);
    const pl5Codes = upnPl5Map.get(row.upn) ?? new Set<string>();
    pl5Codes.add(row.pl5_code);
    upnPl5Map.set(row.upn, pl5Codes);
    if (row.pl5_name) pl5NameByBu.set(`${row.sc_bu}|${row.pl5_code}`, row.pl5_name);
  }

  const duplicateUpnIssues = [...upnPl5Map.entries()]
    .filter(([, pl5Codes]) => pl5Codes.size > 1)
    .map(([upn, pl5Codes]) => ({
      source: "T2采购历史",
      field: "pl5_code",
      key: upn,
      message: `UPN 同时归属多个 PL5：${[...pl5Codes].sort().join(", ")}`,
    }));
  if (duplicateUpnIssues.length > 0) throw new CalculationInputError(duplicateUpnIssues);

  const pl5UpnScopeRows: Pl5UpnScopeRow[] = [...pl5UpnSources.entries()].map(([key, sources]) => {
    const [scBu, pl5Code, upn] = key.split("|");
    return {
      periodMonth,
      scBu,
      pl5Code,
      pl5Name: pl5NameByBu.get(`${scBu}|${pl5Code}`) ?? null,
      upn,
      upnSource: [...sources].join("|"),
    };
  });

  const lpPl5UpnStatusRows: LpPl5UpnStatusRow[] = [];
  for (const status of lpPl5StatusRows) {
    for (const scopedUpn of pl5UpnScopeRows) {
      if (scopedUpn.scBu !== status.scBu || scopedUpn.pl5Code !== status.pl5Code) continue;
      lpPl5UpnStatusRows.push({
        periodMonth,
        scBu: status.scBu,
        lpCode: status.lpCode,
        lpName: status.lpName,
        pl5Code: status.pl5Code,
        pl5Name: status.pl5Name,
        upn: scopedUpn.upn,
        hasQuota: status.hasQuota,
        hasHistory: status.hasHistory,
        quotaQty: status.quotaQty,
        historyQtyM6M1: status.historyQtyM6M1,
        statusNote: status.statusNote,
        errorCode: status.errorCode,
      });
    }
  }

  return { lpPl5ScopeRows, lpPl5StatusRows, pl5UpnScopeRows, lpPl5UpnStatusRows };
}
