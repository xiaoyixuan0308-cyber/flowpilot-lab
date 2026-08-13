import type { WeeklyFormulaCode } from "@/lib/weekly-formula-registry";

export const WEEKLY_STAGE_DEFINITIONS = [
  {
    slug: "week-target",
    title: "周目标形成",
    shortTitle: "周目标",
    fields: ["H_ROW", "CD", "L", "J", "JA", "JB"] as WeeklyFormulaCode[],
    batchMetrics: ["CD"] as WeeklyFormulaCode[],
    granularity: "行级 + UPN级",
  },
  {
    slug: "available-inventory",
    title: "可发库存",
    shortTitle: "可发库存",
    fields: ["YA", "YB", "YC", "Y", "R"] as WeeklyFormulaCode[],
    batchMetrics: [] as WeeklyFormulaCode[],
    granularity: "UPN级",
  },
  {
    slug: "initial-suggestion",
    title: "初始发货建议",
    shortTitle: "初始建议AD",
    fields: ["JA", "JB", "Y", "R", "Z", "AD"] as WeeklyFormulaCode[],
    batchMetrics: [] as WeeklyFormulaCode[],
    granularity: "行级 + UPN级",
  },
  {
    slug: "amount-gap",
    title: "建议金额与差额",
    shortTitle: "AO/AQ/AR/AS",
    fields: ["AD", "AM", "AO"] as WeeklyFormulaCode[],
    batchMetrics: ["CE", "CD", "CB", "CA", "CR", "AQ", "AR", "AS"] as WeeklyFormulaCode[],
    granularity: "行级 + 批次级",
  },
  {
    slug: "overage-reduction",
    title: "金额超额缩减",
    shortTitle: "超额走SA",
    fields: ["AD", "SA"] as WeeklyFormulaCode[],
    batchMetrics: ["AS", "CR", "AQ"] as WeeklyFormulaCode[],
    granularity: "行级 + 批次级",
  },
  {
    slug: "gap-eligibility",
    title: "补差资格",
    shortTitle: "补差资格",
    fields: ["BB", "BA", "H_UPN", "O", "JB", "BD", "BL"] as WeeklyFormulaCode[],
    batchMetrics: ["AS"] as WeeklyFormulaCode[],
    granularity: "行级 + UPN级",
  },
  {
    slug: "gap-allocation",
    title: "补差分配",
    shortTitle: "RA/RB",
    fields: ["BH", "BI", "BK", "BL", "RA", "RB"] as WeeklyFormulaCode[],
    batchMetrics: ["AR", "AS"] as WeeklyFormulaCode[],
    granularity: "行级 + UPN级 + 批次级",
  },
  {
    slug: "final-adjustment",
    title: "最终发货调整",
    shortTitle: "RRA人工调整",
    fields: ["AD", "RRA_DEFAULT", "RRA_MANUAL", "RRA", "RRB"] as WeeklyFormulaCode[],
    batchMetrics: ["CR", "RRC", "RD"] as WeeklyFormulaCode[],
    granularity: "行级 + 批次级",
  },
] as const;

export type WeeklyStageSlug = (typeof WEEKLY_STAGE_DEFINITIONS)[number]["slug"];

export function getWeeklyStageDefinition(slug: string) {
  return WEEKLY_STAGE_DEFINITIONS.find((stage) => stage.slug === slug) ?? null;
}

export function buildWeeklyStageHref(calendarDate: string, slug: WeeklyStageSlug, query = "") {
  return `/calc/weekly-process/${calendarDate}/${slug}${query ? `?${query}` : ""}`;
}
