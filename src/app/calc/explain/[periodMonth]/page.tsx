import Link from "next/link";
import { Calculator, CheckCircle2, CircleAlert, Database, Search } from "lucide-react";
import { FormulaBlock } from "@/components/formula-block";
import { MetaBadgeRow } from "@/components/meta-badge-row";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCalculationExplainView } from "@/server/services/calc/explain-calculation.service";
import { CalculationExplainQueryForm } from "./calculation-explain-query-form";

interface CalculationExplainPageProps {
  params: Promise<{ periodMonth: string }>;
  searchParams: Promise<{
    lp?: string;
    pl5?: string;
    upn?: string;
    source?: string;
  }>;
}

const sourceOptions = [
  { value: "", label: "全部来源" },
  { value: "purchase", label: "采购/预测" },
  { value: "inventory", label: "库存" },
  { value: "dioh", label: "库存天数规则" },
  { value: "allocation", label: "配额/分配" },
  { value: "formula", label: "公式派生" },
];

function statusClass(status: "ok" | "warn" | "info") {
  if (status === "ok") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-border bg-muted text-muted-foreground";
}

function statusLabel(status: "ok" | "warn" | "info") {
  if (status === "ok") return "一致";
  if (status === "warn") return "需复核";
  return "说明";
}

function optionList(options: { label: string; value: string }[], selected?: string) {
  return options.map((option) => (
    <option key={option.value || "__all__"} value={option.value}>
      {option.label}
      {selected === option.value ? " *" : ""}
    </option>
  ));
}

export default async function CalculationExplainPage({
  params,
  searchParams,
}: CalculationExplainPageProps) {
  const { periodMonth } = await params;
  const query = await searchParams;
  const view = await getCalculationExplainView(periodMonth, {
    lpCode: query.lp,
    pl5Code: query.pl5,
    upn: query.upn,
    sourceKey: query.source,
  });

  if (!view) {
    return (
      <div className="space-y-6">
        <PageIntro
          title="计算流程展示"
          description={`${periodMonth} 的计算链路说明`}
          breadcrumbs={[
            { label: "结果总览", href: "/calc/results" },
            { label: "计算流程展示" },
          ]}
        />
        <PageFeedbackCard title="未找到批次" />
      </div>
    );
  }

  const selected = view.selectedRow;
  const lpValue = query.lp ?? selected?.dealerlpcode ?? "";
  const pl5Value = query.pl5 ?? selected?.pl5_code ?? "";
  const upnValue = query.upn ?? selected?.upn ?? "";
  const sourceValue = query.source ?? "";
  const visibleSteps = sourceValue
    ? view.steps.filter((step) => step.sourceKey === sourceValue)
    : view.steps;
  const warnCount = visibleSteps.filter((step) => step.status === "warn").length;
  const okCount = visibleSteps.filter((step) => step.status === "ok").length;
  const optionRows = view.traces.map((row) => ({
    lp: row.dealerlpcode,
    pl5: row.pl5_code,
    upn: row.upn,
  }));

  return (
    <div className="space-y-6">
      <PageIntro
        title="计算流程展示"
        description="按字段、公式、代入值、快照结果和重算结果逐步核对当前SKU的计算链路。"
        breadcrumbs={[
          { label: "结果总览", href: "/calc/results" },
          { label: "结果数据明细", href: `/calc/results/${periodMonth}` },
          { label: "计算流程展示" },
        ]}
      />

      <SectionCard
        title="查询条件"
        description="当前版本基于结果快照和过程追踪表展示，不回查每张基础表明细。"
        action={
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/calc/results/${periodMonth}`} className="text-primary underline whitespace-nowrap">
              返回结果明细
            </Link>
            <Link href={`/calc/trace/${periodMonth}`} className="text-primary underline whitespace-nowrap">
              查看Trace表
            </Link>
          </div>
        }
      >
        <CalculationExplainQueryForm
          periodMonth={periodMonth}
          lpValue={lpValue}
          pl5Value={pl5Value}
          upnValue={upnValue}
          sourceValue={sourceValue}
          lpOptions={view.options.lp}
          sourceOptions={sourceOptions}
          optionRows={optionRows}
          pl5NameByCode={view.names.pl5NameByCode}
        />
        <form className="hidden" action={`/calc/explain/${periodMonth}`}>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">LP</span>
            <select
              name="lp"
              defaultValue={lpValue}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部LP</option>
              {optionList(view.options.lp, lpValue)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">产品分类</span>
            <select
              name="pl5"
              defaultValue={pl5Value}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">全部产品分类</option>
              {optionList(view.options.pl5, pl5Value)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">SKU</span>
            <Input name="upn" defaultValue={upnValue} placeholder="输入或粘贴SKU" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">基础来源</span>
            <select
              name="source"
              defaultValue={sourceValue}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {sourceOptions.map((option) => (
                <option key={option.value || "__all__"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">
              <Search />
              查询
            </Button>
          </div>
        </form>
      </SectionCard>

      {selected ? (
        <>
          <SectionCard title="当前选中行" contentClassName="space-y-4">
            <MetaBadgeRow
              items={[
                { value: view.periodMonth, variant: "secondary" },
                { value: selected.dealerlpcode, variant: "outline" },
                { value: selected.pl5_code, variant: "outline" },
                { value: selected.upn },
                ...(selected.is_error
                  ? [{ value: "异常", variant: "destructive" as const }]
                  : [{ value: "正常", variant: "secondary" as const }]),
              ]}
            />
            <SummaryStatsGrid
              columns={4}
              items={[
                { label: "渠道名称", value: view.names.lpNameByCode[selected.dealerlpcode] ?? selected.dealerlpcode },
                { label: "产品分类名称", value: view.names.pl5NameByCode[selected.pl5_code] ?? selected.pl5_code },
                { label: "当前筛选步骤", value: visibleSteps.length },
                { label: "需复核步骤", value: warnCount },
              ]}
            />
            {selected.error_message && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {selected.error_message}
              </div>
            )}
          </SectionCard>

          <div className="grid gap-4">
            {visibleSteps.map((step) => (
              <SectionCard
                key={step.key}
                title={`${step.badge}：${step.title}`}
                description={step.source}
                action={
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${statusClass(step.status)}`}
                  >
                    {step.status === "warn" ? <CircleAlert className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                    {statusLabel(step.status)}
                  </span>
                }
                contentClassName="space-y-4"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                  <div className="rounded-md border bg-background p-3">
                    <FormulaBlock formula={step.formulaLatex} />
                  </div>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-md border p-2">
                        <div className="text-xs text-muted-foreground">快照值</div>
                        <div className="mt-1 font-mono">{step.actual || "-"}</div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-xs text-muted-foreground">重算值</div>
                        <div className="mt-1 font-mono">{step.expected ?? "-"}</div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-xs text-muted-foreground">差异</div>
                        <div className="mt-1 font-mono">{step.diff ?? "-"}</div>
                      </div>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Database className="size-3.5" />
                        代入值
                      </div>
                      {step.inputs.length === 0 ? (
                        <div className="text-sm text-muted-foreground">该字段依赖历史窗口聚合，当前快照仅展示结果值。</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {step.inputs.map((input) => (
                            <div key={input.key} className="rounded bg-muted px-2 py-1 text-xs">
                              <span className="text-muted-foreground">{input.label}</span>
                              <span className="ml-2 font-mono">{input.value || "-"}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {step.note && (
                  <div className="flex items-start gap-2 rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                    <Calculator className="mt-0.5 size-4" />
                    <span>{step.note}</span>
                  </div>
                )}
              </SectionCard>
            ))}
          </div>

          <SectionCard title="校验汇总">
            <SummaryStatsGrid
              columns={3}
              items={[
                { label: "展示步骤", value: visibleSteps.length },
                { label: "一致步骤", value: okCount },
                { label: "需复核步骤", value: warnCount },
              ]}
            />
          </SectionCard>
        </>
      ) : (
        <PageFeedbackCard title="当前批次没有可展示的Trace行" />
      )}
    </div>
  );
}
