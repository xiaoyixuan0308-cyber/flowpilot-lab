import Link from "next/link";
import {
  AlertTriangle, ArrowRight, Boxes, Calculator, ChartNoAxesCombined, CheckCircle2,
  Database, Gauge, PackageCheck, Route, Search, ShieldCheck, Sparkles, Truck,
} from "lucide-react";
import { HomeCalculationStatus } from "@/components/home-calculation-status";
import { loadSupplyChainOverview } from "@/server/services/dashboard/supply-chain-overview";

const workspaces = [
  { title: "数据工作台", detail: "主数据、库存与订单", href: "/data", icon: Database, tone: "bg-blue-50 text-blue-700" },
  { title: "全局查询", detail: "快速追溯业务关系", href: "/data/query", icon: Search, tone: "bg-cyan-50 text-cyan-700" },
  { title: "补货计划", detail: "月度规划与周度执行", href: "/calc/upn-split", icon: Calculator, tone: "bg-violet-50 text-violet-700" },
  { title: "分析洞察", detail: "趋势与结果可视化", href: "/calc/dashboard", icon: ChartNoAxesCombined, tone: "bg-emerald-50 text-emerald-700" },
  { title: "过程追溯", detail: "输入、约束与输出", href: "/calc/process", icon: Route, tone: "bg-amber-50 text-amber-700" },
];

export default async function Home() {
  const overview = await loadSupplyChainOverview();
  const healthySkuCount = Math.max(overview.skuCount - overview.anomalySkuCount, 0);
  const healthRate = overview.skuCount > 0 ? Math.round((healthySkuCount / overview.skuCount) * 100) : 100;
  const metrics = [
    { label: "管理中 SKU", value: overview.skuCount.toLocaleString("zh-CN"), detail: `${overview.categoryCount} 个产品分类`, icon: PackageCheck, tone: "text-blue-700 bg-blue-50", href: "/calc/weekly-results" },
    { label: "需关注风险", value: overview.anomalySkuCount.toLocaleString("zh-CN"), detail: `${healthRate}% SKU 状态正常`, icon: AlertTriangle, tone: "text-rose-700 bg-rose-50", href: "/exceptions" },
    { label: "在途总量", value: overview.intransitQty.toLocaleString("zh-CN", { maximumFractionDigits: 0 }), detail: `覆盖 ${overview.intransitSkuCount} 个 SKU`, icon: Truck, tone: "text-cyan-700 bg-cyan-50", href: "/data/bsc-upn-intransit" },
    { label: "有效约束", value: `${overview.constraintTypeCount} 类`, detail: `${overview.constrainedSkuCount} 个 SKU 已配置`, icon: ShieldCheck, tone: "text-violet-700 bg-violet-50", href: "/data/upn-constraint" },
  ];

  return (
    <div className="space-y-5">
      <section className="grid overflow-hidden rounded-[1.75rem] border border-slate-800/10 bg-[#071b33] text-white shadow-[0_22px_65px_rgba(7,27,51,0.18)] lg:grid-cols-[1.45fr_0.55fr]">
        <div className="relative overflow-hidden px-6 py-8 sm:px-9 lg:py-11">
          <div className="absolute -left-20 -top-24 size-72 rounded-full bg-cyan-400/10 blur-2xl" />
          <div className="absolute bottom-0 right-0 h-full w-1/2 bg-[radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.22),transparent_65%)]" />
          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium text-cyan-100"><Sparkles className="size-3.5" />FlowPilot 智能决策中枢</div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">让供应链先看见，<span className="text-cyan-300">再行动。</span></h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">连接需求、库存与在途，把分散的数据变成清晰判断，让每一次补货决策都有依据。</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/exceptions" className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-200">查看今日风险 <ArrowRight className="size-4" /></Link>
              <Link href="/calc/upn-split" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-white/10"><Calculator className="size-4" />进入补货计划与执行</Link>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-white/[0.045] p-6 backdrop-blur-sm lg:border-l lg:border-t-0 lg:p-7">
          <div className="flex items-center justify-between"><div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">今日运行概览</div><span className="flex items-center gap-1.5 text-xs text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-300" />实时</span></div>
          <div className="mt-7 flex items-end gap-3"><span className="text-5xl font-semibold tracking-tight">{healthRate}%</span><span className="pb-1 text-sm text-slate-400">SKU 健康率</span></div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[linear-gradient(90deg,#22d3ee,#34d399)]" style={{ width: `${healthRate}%` }} /></div>
          <div className="mt-7 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="text-slate-400">业务单元</span><span className="font-medium">{overview.businessUnitCount} 个</span></div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3"><span className="text-slate-400">状态正常</span><span className="font-medium text-emerald-300">{healthySkuCount} 个 SKU</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">待处理风险</span><Link href="/exceptions" className="flex items-center gap-1 font-medium text-amber-300 hover:text-amber-200">{overview.anomalySkuCount} 个 <ArrowRight className="size-3.5" /></Link></div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <Link href={metric.href} key={metric.label} className="surface-card group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
          <div className="flex items-center justify-between"><span className={`flex size-10 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon className="size-5" /></span><ArrowRight className="size-4 text-muted-foreground/25 transition group-hover:translate-x-0.5 group-hover:text-primary" /></div>
          <div className="mt-5 text-2xl font-semibold tabular-nums tracking-tight">{metric.value}</div><div className="mt-1 text-sm font-medium">{metric.label}</div><div className="mt-1 text-xs text-muted-foreground">{metric.detail}</div>
        </Link>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
        <div className="surface-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold">快捷任务</h2><p className="mt-1 text-xs text-muted-foreground">从要完成的工作出发，而不是从数据表出发</p></div><Gauge className="size-5 text-primary/55" /></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {workspaces.map((item) => <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-muted/50">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.detail}</span></span><ArrowRight className="size-4 text-muted-foreground/25 transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>)}
          </div>
          <Link href="/data/import" className="mt-3 flex items-center justify-between rounded-2xl bg-[linear-gradient(110deg,rgba(37,99,235,0.08),rgba(6,182,212,0.08))] p-4 text-sm transition hover:from-blue-500/15 hover:to-cyan-500/15"><span className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm"><Database className="size-4" /></span><span><span className="block font-semibold">导入新的业务数据</span><span className="mt-0.5 block text-xs text-muted-foreground">预校验通过后再写入数据库</span></span></span><ArrowRight className="size-4 text-primary" /></Link>
        </div>
        <HomeCalculationStatus />
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center rounded-2xl border bg-[linear-gradient(100deg,rgba(255,255,255,0.95),rgba(236,253,245,0.75))] p-5 sm:p-6">
        <div className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="size-5" /></span><div><h2 className="font-semibold">通用供应链模式已启用</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">业务单元、渠道、产品分类与 SKU 已采用通用表达，原有计算链路和数据库字段保持兼容。</p></div></div>
        <Link href="/data" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-4 text-sm font-medium shadow-sm transition hover:border-primary/30 hover:text-primary">进入数据中心 <Boxes className="size-4" /></Link>
      </section>
    </div>
  );
}
