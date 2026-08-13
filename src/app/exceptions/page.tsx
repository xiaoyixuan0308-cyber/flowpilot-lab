import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  CircleDollarSign,
  DatabaseZap,
  PackageX,
  TrendingUp,
} from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import {
  loadSupplyChainOverview,
  type SupplyChainExceptionKey,
} from "@/server/services/dashboard/supply-chain-overview";

const exceptionMeta: Array<{
  key: SupplyChainExceptionKey;
  title: string;
  level: string;
  description: string;
  reason: string;
  icon: typeof TrendingUp;
  tone: string;
}> = [
  {
    key: "demandSurge",
    title: "需求突增",
    level: "高风险",
    description: "月建议量高于近3个月平均采购量30%以上。",
    reason: "建议复核销售预测、客户订单和促销计划，确认增长是否可持续。",
    icon: TrendingUp,
    tone: "border-rose-200 bg-rose-50 text-rose-700",
  },
  {
    key: "arrivalDelay",
    title: "到货窗口偏晚",
    level: "高风险",
    description: "预计到达日晚于当前计算基准日7天以上。",
    reason: "建议确认供应商交期，必要时提前采购或安排跨仓、跨渠道调拨。",
    icon: CalendarClock,
    tone: "border-orange-200 bg-orange-50 text-orange-700",
  },
  {
    key: "supplyShortage",
    title: "可供库存不足",
    level: "高风险",
    description: "最新计算中库存状态为停止分配，无法继续满足待发需求。",
    reason: "建议核对中央仓库存、在途和未清订单，优先处理有真实订单的SKU。",
    icon: PackageX,
    tone: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    key: "inventoryBacklog",
    title: "库存覆盖偏高",
    level: "关注",
    description: "当前或补货后库存天数超过90天。",
    reason: "建议暂停追加补货，并复核需求下调、渠道库存和滞销风险。",
    icon: Boxes,
    tone: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    key: "constraintConflict",
    title: "业务约束冲突",
    level: "关注",
    description: "SKU触发周/月约束，且当前不允许继续调整。",
    reason: "建议核对周上限、月上限和业务单元预算，必要时进行人工审批。",
    icon: CircleDollarSign,
    tone: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    key: "dataQuality",
    title: "基础数据缺失",
    level: "数据风险",
    description: "SKU缺少采购单价或安全库存，计算结果可能不完整。",
    reason: "建议先补齐主数据，再重新执行月度和周度计算。",
    icon: DatabaseZap,
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  },
];

export default async function ExceptionsPage() {
  const overview = await loadSupplyChainOverview();
  const highRiskSkus = new Set([
    ...overview.exceptions.demandSurge.skus,
    ...overview.exceptions.arrivalDelay.skus,
    ...overview.exceptions.supplyShortage.skus,
  ]);
  const resultBase = overview.calendarDate
    ? `/calc/weekly-results/${overview.calendarDate}`
    : "/calc/weekly-results";

  return (
    <div className="space-y-6">
      <PageIntro
        title="供应链异常中心"
        description="根据最新计算批次自动识别需求、供应、库存、约束和数据质量风险。"
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="surface-card rounded-2xl p-5">
          <div className="text-sm text-muted-foreground">涉及异常SKU</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums">{overview.anomalySkuCount}</div>
          <div className="mt-1 text-xs text-muted-foreground">同一SKU可能同时触发多类风险</div>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <div className="text-sm text-muted-foreground">高风险SKU</div>
          <div className="mt-2 text-3xl font-semibold tabular-nums text-rose-600">{highRiskSkus.size}</div>
          <div className="mt-1 text-xs text-muted-foreground">需求、到货或可供库存需要优先处理</div>
        </div>
        <div className="surface-card rounded-2xl p-5">
          <div className="text-sm text-muted-foreground">计算基准日</div>
          <div className="mt-2 text-lg font-semibold">{overview.calendarDate ?? "暂无结果"}</div>
          <div className="mt-1 text-xs text-muted-foreground">异常随最新计算结果自动更新</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {exceptionMeta.map((item) => {
          const group = overview.exceptions[item.key];
          return (
            <article key={item.key} className="surface-card rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl border ${item.tone}`}>
                  <item.icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{item.title}</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{group.count}项</span>
                    <span className="ml-auto text-xs font-medium text-muted-foreground">{item.level}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <div className="mt-4 rounded-xl bg-muted/55 px-3.5 py-3 text-xs leading-5 text-foreground/80">
                    <span className="font-semibold">建议处理：</span>{item.reason}
                  </div>
                  {group.skus.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.skus.slice(0, 6).map((sku) => (
                        <Link
                          key={sku}
                          href={`${resultBase}?upn=${encodeURIComponent(sku)}`}
                          className="rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium transition hover:border-primary/30 hover:text-primary"
                        >
                          {sku}
                        </Link>
                      ))}
                      {group.skus.length > 6 ? (
                        <span className="px-1 py-1.5 text-xs text-muted-foreground">另有{group.skus.length - 6}项</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-emerald-700">当前批次未发现此类异常</div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 text-primary" />
          <div>
            <h2 className="font-semibold">查看异常如何影响补货结果</h2>
            <p className="mt-1 text-sm text-muted-foreground">点击上方SKU可以带入筛选条件，追溯库存、在途、约束和最终建议量。</p>
          </div>
        </div>
        <Link href={resultBase} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90">
          查看计算明细 <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}

