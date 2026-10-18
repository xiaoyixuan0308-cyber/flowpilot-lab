import { prisma } from "@/lib/prisma";

export interface HierarchyRow {
  channel_code: string;
  channel_name: string | null;
  category_code: string;
  category_name: string | null;
  sku: string;
  source: string;
}

export type SearchType = "channel" | "category" | "sku";
export type TableType = "monthly" | "weekly";

// ─── Monthly table queries ───────────────────────────────────────────

async function searchMonthlyByChannel(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingChannels = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: {
      OR: [
        { channel_code: { contains: trimmed, mode: "insensitive" } },
        { channel_name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { channel_code: true },
    distinct: ["channel_code"],
    take: 200,
  });

  if (matchingChannels.length === 0) return [];

  const channelCodes = matchingChannels.map((r) => r.channel_code);

  const rows = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: { channel_code: { in: channelCodes } },
    select: { channel_code: true, channel_name: true, category_code: true, category_name: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ channel_code: "asc" }, { category_code: "asc" }, { sku: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    ...r,
    channel_name: r.channel_name ?? null,
    category_name: r.category_name ?? null,
    source: "monthly",
  }));
}

async function searchMonthlyByCategory(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingCategories = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: {
      OR: [
        { category_code: { contains: trimmed, mode: "insensitive" } },
        { category_name: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { category_code: true },
    distinct: ["category_code"],
    take: 200,
  });

  if (matchingCategories.length === 0) return [];

  const categoryCodes = matchingCategories.map((r) => r.category_code);

  const rows = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: { category_code: { in: categoryCodes } },
    select: { channel_code: true, channel_name: true, category_code: true, category_name: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ category_code: "asc" }, { channel_code: "asc" }, { sku: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    ...r,
    channel_name: r.channel_name ?? null,
    category_name: r.category_name ?? null,
    source: "monthly",
  }));
}

async function searchMonthlyBySku(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const rows = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: { sku: { contains: trimmed, mode: "insensitive" } },
    select: { channel_code: true, channel_name: true, category_code: true, category_name: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ sku: "asc" }, { channel_code: "asc" }, { category_code: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    ...r,
    channel_name: r.channel_name ?? null,
    category_name: r.category_name ?? null,
    source: "monthly",
  }));
}

// ─── Weekly table queries ────────────────────────────────────────────

async function searchWeeklyByChannel(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingChannels = await prisma.calc_weekly_sku_split_result.findMany({
    where: { channel_code: { contains: trimmed, mode: "insensitive" } },
    select: { channel_code: true },
    distinct: ["channel_code"],
    take: 200,
  });

  if (matchingChannels.length === 0) return [];

  const channelCodes = matchingChannels.map((r) => r.channel_code);

  const rows = await prisma.calc_weekly_sku_split_result.findMany({
    where: { channel_code: { in: channelCodes } },
    select: { channel_code: true, category_code: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ channel_code: "asc" }, { category_code: "asc" }, { sku: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    channel_code: r.channel_code,
    channel_name: null,
    category_code: r.category_code,
    category_name: null,
    sku: r.sku,
    source: "weekly",
  }));
}

async function searchWeeklyByCategory(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const matchingCategories = await prisma.calc_weekly_sku_split_result.findMany({
    where: { category_code: { contains: trimmed, mode: "insensitive" } },
    select: { category_code: true },
    distinct: ["category_code"],
    take: 200,
  });

  if (matchingCategories.length === 0) return [];

  const categoryCodes = matchingCategories.map((r) => r.category_code);

  const rows = await prisma.calc_weekly_sku_split_result.findMany({
    where: { category_code: { in: categoryCodes } },
    select: { channel_code: true, category_code: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ category_code: "asc" }, { channel_code: "asc" }, { sku: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    channel_code: r.channel_code,
    channel_name: null,
    category_code: r.category_code,
    category_name: null,
    sku: r.sku,
    source: "weekly",
  }));
}

async function searchWeeklyBySku(q: string): Promise<HierarchyRow[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const rows = await prisma.calc_weekly_sku_split_result.findMany({
    where: { sku: { contains: trimmed, mode: "insensitive" } },
    select: { channel_code: true, category_code: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ sku: "asc" }, { channel_code: "asc" }, { category_code: "asc" }],
    take: 5000,
  });

  return rows.map((r) => ({
    channel_code: r.channel_code,
    channel_name: null,
    category_code: r.category_code,
    category_name: null,
    sku: r.sku,
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
      case "channel":
        return searchMonthlyByChannel(q);
      case "category":
        return searchMonthlyByCategory(q);
      case "sku":
        return searchMonthlyBySku(q);
    }
  } else {
    switch (type) {
      case "channel":
        return searchWeeklyByChannel(q);
      case "category":
        return searchWeeklyByCategory(q);
      case "sku":
        return searchWeeklyBySku(q);
    }
  }
}

// ─── Cascade children queries ────────────────────────────────────────

export interface ChildrenItem {
  value: string;
  label: string;
}

export interface ChildrenResult {
  channel: string;
  channel_name: string | null;
  categories: ChildrenItem[];
  skus: ChildrenItem[];
}

/**
 * 选 渠道 → 返回该 渠道 下所有 产品分类 + 选 产品分类 → 返回该 渠道+产品分类 下所有 SKU
 * 只传 channel：     列出该 渠道 下所有 产品分类（skus 为空）
 * 传 channel + category： 列出该 渠道+产品分类 下所有 SKU（categories 不变）
 */
export async function getChildren(params: {
  channel: string;
  category?: string;
  table: TableType;
}): Promise<ChildrenResult | null> {
  const { channel, category, table } = params;
  return table === "monthly"
    ? getChildrenMonthly(channel, category ?? null)
    : getChildrenWeekly(channel, category ?? null);
}

async function getChildrenMonthly(
  channel: string,
  category: string | null,
): Promise<ChildrenResult | null> {
  const rows = await prisma.list_channel_category_sku_status_monthly.findMany({
    where: { channel_code: channel },
    select: { channel_code: true, channel_name: true, category_code: true, category_name: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ category_code: "asc" }, { sku: "asc" }],
    take: 5000,
  });

  if (rows.length === 0) return null;

  const categoryMap = new Map<string, string>();
  for (const r of rows) {
    if (!categoryMap.has(r.category_code)) {
      categoryMap.set(r.category_code, r.category_name ?? r.category_code);
    }
  }
  const categories: ChildrenItem[] = Array.from(categoryMap.entries()).map(([code, name]) => ({
    value: code,
    label: name && name !== code ? `${code} (${name})` : code,
  }));

  const skuMap = new Map<string, string>();
  for (const r of rows) {
    if (category && r.category_code !== category) continue;
    if (!skuMap.has(r.sku)) skuMap.set(r.sku, r.sku);
  }
  const skus: ChildrenItem[] = Array.from(skuMap.keys()).map((sku) => ({
    value: sku,
    label: sku,
  }));

  return { channel: rows[0].channel_code, channel_name: rows[0].channel_name ?? null, categories, skus };
}

async function getChildrenWeekly(
  channel: string,
  category: string | null,
): Promise<ChildrenResult | null> {
  const rows = await prisma.calc_weekly_sku_split_result.findMany({
    where: { channel_code: channel },
    select: { channel_code: true, category_code: true, sku: true },
    distinct: ["channel_code", "category_code", "sku"],
    orderBy: [{ category_code: "asc" }, { sku: "asc" }],
    take: 5000,
  });

  if (rows.length === 0) return null;

  const categoryMap = new Map<string, string>();
  for (const r of rows) {
    if (!categoryMap.has(r.category_code)) categoryMap.set(r.category_code, r.category_code);
  }
  const categories: ChildrenItem[] = Array.from(categoryMap.entries()).map(([code]) => ({
    value: code,
    label: code,
  }));

  const skuMap = new Map<string, string>();
  for (const r of rows) {
    if (category && r.category_code !== category) continue;
    if (!skuMap.has(r.sku)) skuMap.set(r.sku, r.sku);
  }
  const skus: ChildrenItem[] = Array.from(skuMap.keys()).map((sku) => ({
    value: sku,
    label: sku,
  }));

  return { channel: rows[0].channel_code, channel_name: null, categories, skus };
}
