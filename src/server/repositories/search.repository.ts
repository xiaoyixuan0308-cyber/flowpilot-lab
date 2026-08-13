import { prisma } from "@/lib/prisma";

export interface HierarchyRow {
  lp_code: string;
  lp_name: string | null;
  pl5_code: string;
  pl5_name: string | null;
  upn: string;
  source: string;
}

export type SearchType = "lp" | "pl5" | "upn";
export type TableType = "monthly" | "weekly";

// ─── Monthly table queries ───────────────────────────────────────────

async function searchMonthlyByLP(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingLps = await prisma.list_lp_pl5_upn_status_monthly.findMany({
    where: {
      OR: [
        { lp_code: { contains: trimmed, mode: "insensitive" } },
        { lp_name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { lp_code: true },
    distinct: ["lp_code"],
    take: 200,
  });

  if (matchingLps.length === 0) return [];

  const lpCodes = matchingLps.map((r) => r.lp_code);

  const rows = await prisma.list_lp_pl5_upn_status_monthly.findMany({
    where: { lp_code: { in: lpCodes } },
    select: { lp_code: true, lp_name: true, pl5_code: true, pl5_name: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ lp_code: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    ...r,
    lp_name: r.lp_name ?? null,
    pl5_name: r.pl5_name ?? null,
    source: "monthly",
  }));
}

async function searchMonthlyByPL5(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingPl5s = await prisma.list_lp_pl5_upn_status_monthly.findMany({
    where: {
      OR: [
        { pl5_code: { contains: trimmed, mode: "insensitive" } },
        { pl5_name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { pl5_code: true },
    distinct: ["pl5_code"],
    take: 200,
  });

  if (matchingPl5s.length === 0) return [];

  const pl5Codes = matchingPl5s.map((r) => r.pl5_code);

  const rows = await prisma.list_lp_pl5_upn_status_monthly.findMany({
    where: { pl5_code: { in: pl5Codes } },
    select: { lp_code: true, lp_name: true, pl5_code: true, pl5_name: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ pl5_code: "asc" }, { lp_code: "asc" }, { upn: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    ...r,
    lp_name: r.lp_name ?? null,
    pl5_name: r.pl5_name ?? null,
    source: "monthly",
  }));
}

async function searchMonthlyByUPN(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const rows = await prisma.list_lp_pl5_upn_status_monthly.findMany({
    where: { upn: { contains: trimmed, mode: "insensitive" } },
    select: { lp_code: true, lp_name: true, pl5_code: true, pl5_name: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ upn: "asc" }, { lp_code: "asc" }, { pl5_code: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    ...r,
    lp_name: r.lp_name ?? null,
    pl5_name: r.pl5_name ?? null,
    source: "monthly",
  }));
}

// ─── Weekly table queries ────────────────────────────────────────────

async function searchWeeklyByLP(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingLps = await prisma.calc_weekly_upn_split_result.findMany({
    where: { lp_code: { contains: trimmed, mode: "insensitive" } },
    select: { lp_code: true },
    distinct: ["lp_code"],
    take: 200,
  });

  if (matchingLps.length === 0) return [];

  const lpCodes = matchingLps.map((r) => r.lp_code);

  const rows = await prisma.calc_weekly_upn_split_result.findMany({
    where: { lp_code: { in: lpCodes } },
    select: { lp_code: true, pl5_code: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ lp_code: "asc" }, { pl5_code: "asc" }, { upn: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    lp_code: r.lp_code,
    lp_name: null,
    pl5_code: r.pl5_code,
    pl5_name: null,
    upn: r.upn,
    source: "weekly",
  }));
}

async function searchWeeklyByPL5(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingPl5s = await prisma.calc_weekly_upn_split_result.findMany({
    where: { pl5_code: { contains: trimmed, mode: "insensitive" } },
    select: { pl5_code: true },
    distinct: ["pl5_code"],
    take: 200,
  });

  if (matchingPl5s.length === 0) return [];

  const pl5Codes = matchingPl5s.map((r) => r.pl5_code);

  const rows = await prisma.calc_weekly_upn_split_result.findMany({
    where: { pl5_code: { in: pl5Codes } },
    select: { lp_code: true, pl5_code: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ pl5_code: "asc" }, { lp_code: "asc" }, { upn: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    lp_code: r.lp_code,
    lp_name: null,
    pl5_code: r.pl5_code,
    pl5_name: null,
    upn: r.upn,
    source: "weekly",
  }));
}

async function searchWeeklyByUPN(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const rows = await prisma.calc_weekly_upn_split_result.findMany({
    where: { upn: { contains: trimmed, mode: "insensitive" } },
    select: { lp_code: true, pl5_code: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ upn: "asc" }, { lp_code: "asc" }, { pl5_code: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    lp_code: r.lp_code,
    lp_name: null,
    pl5_code: r.pl5_code,
    pl5_name: null,
    upn: r.upn,
    source: "weekly",
  }));
}

// ─── Main search entry ────────────────────────────────────────────────

export async function searchHierarchy(params: {
  q: string;
  type: SearchType;
  table: TableType;
}): Promise<HierarchyRow[]> {
  const { q, type, table } = params;

  if (table === "monthly") {
    switch (type) {
      case "lp":
        return searchMonthlyByLP(q);
      case "pl5":
        return searchMonthlyByPL5(q);
      case "upn":
        return searchMonthlyByUPN(q);
    }
  } else {
    switch (type) {
      case "lp":
        return searchWeeklyByLP(q);
      case "pl5":
        return searchWeeklyByPL5(q);
      case "upn":
        return searchWeeklyByUPN(q);
    }
  }
}

// ─── Cascade children queries ────────────────────────────────────────

export interface ChildrenItem {
  value: string;
  label: string;
}

export interface ChildrenResult {
  lp: string;
  lp_name: string | null;
  pl5s: ChildrenItem[];
  upns: ChildrenItem[];
}

/**
 * 选 LP → 返回该 LP 下所有 PL5 + 选 PL5 → 返回该 LP+PL5 下所有 UPN
 * 只传 lp：     列出该 LP 下所有 PL5（upns 为空）
 * 传 lp + pl5： 列出该 LP+PL5 下所有 UPN（pl5s 不变）
 */
export async function getChildren(params: {
  lp: string;
  pl5?: string;
  table: TableType;
}): Promise<ChildrenResult | null> {
  const { lp, pl5, table } = params;
  return table === "monthly"
    ? getChildrenMonthly(lp, pl5 ?? null)
    : getChildrenWeekly(lp, pl5 ?? null);
}

async function getChildrenMonthly(
  lp: string,
  pl5: string | null,
): Promise<ChildrenResult | null> {
  const rows = await prisma.list_lp_pl5_upn_status_monthly.findMany({
    where: { lp_code: lp },
    select: { lp_code: true, lp_name: true, pl5_code: true, pl5_name: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ pl5_code: "asc" }, { upn: "asc" }],
    take: 5000,
  });

  if (rows.length === 0) return null;

  const pl5Map = new Map<string, string>();
  for (const r of rows) {
    if (!pl5Map.has(r.pl5_code)) {
      pl5Map.set(r.pl5_code, r.pl5_name ?? r.pl5_code);
    }
  }
  const pl5s: ChildrenItem[] = Array.from(pl5Map.entries()).map(([code, name]) => ({
    value: code,
    label: name && name !== code ? `${code} (${name})` : code,
  }));

  const upnMap = new Map<string, string>();
  for (const r of rows) {
    if (pl5 && r.pl5_code !== pl5) continue;
    if (!upnMap.has(r.upn)) upnMap.set(r.upn, r.upn);
  }
  const upns: ChildrenItem[] = Array.from(upnMap.keys()).map((upn) => ({
    value: upn,
    label: upn,
  }));

  return { lp: rows[0].lp_code, lp_name: rows[0].lp_name ?? null, pl5s, upns };
}

async function getChildrenWeekly(
  lp: string,
  pl5: string | null,
): Promise<ChildrenResult | null> {
  const rows = await prisma.calc_weekly_upn_split_result.findMany({
    where: { lp_code: lp },
    select: { lp_code: true, pl5_code: true, upn: true },
    distinct: ["lp_code", "pl5_code", "upn"],
    orderBy: [{ pl5_code: "asc" }, { upn: "asc" }],
    take: 5000,
  });

  if (rows.length === 0) return null;

  const pl5Map = new Map<string, string>();
  for (const r of rows) {
    if (!pl5Map.has(r.pl5_code)) pl5Map.set(r.pl5_code, r.pl5_code);
  }
  const pl5s: ChildrenItem[] = Array.from(pl5Map.entries()).map(([code]) => ({
    value: code,
    label: code,
  }));

  const upnMap = new Map<string, string>();
  for (const r of rows) {
    if (pl5 && r.pl5_code !== pl5) continue;
    if (!upnMap.has(r.upn)) upnMap.set(r.upn, r.upn);
  }
  const upns: ChildrenItem[] = Array.from(upnMap.keys()).map((upn) => ({
    value: upn,
    label: upn,
  }));

  return { lp: rows[0].lp_code, lp_name: null, pl5s, upns };
}
