import Link from "next/link";
import { BaseTableActions } from "@/components/base-table-actions";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import {
  ALL_BASE_INPUT_ENTRIES,
  MONTHLY_INPUT_ENTRIES,
  WEEKLY_INPUT_ENTRIES,
} from "./catalog";

export default function DataOverviewPage() {
  const sections = [
    {
      title: "月度规划基础数据",
      description: "月度补货规划使用的 5 张基础输入表。",
      entries: MONTHLY_INPUT_ENTRIES,
    },
    {
      title: "周度执行基础数据",
      description: "周度配货执行使用的汇率、库存、订单、价格与周历输入表。",
      entries: WEEKLY_INPUT_ENTRIES,
    },
  ];

  return (
    <div className="space-y-6">
      <PageIntro
        title="基础数据中心"
        description="集中维护月度规划与周度执行基础数据，并从同一入口进入统一查询。"
      />

      <SectionCard
        title="数据操作"
        description="整包维护适合批量更新，统一查询适合按 LP、产品分类 或 SKU 快速定位数据关系。"
        action={<BaseTableActions />}
        contentClassName="flex flex-wrap items-center justify-between gap-3"
      >
        <p className="text-sm text-muted-foreground">
          单表页面保留模板下载、导入、导出和明细筛选能力。
        </p>
        <Link
          href="/data/query"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          进入统一查询
        </Link>
      </SectionCard>

      <SummaryStatsGrid
        items={[
          { label: "基础输入表", value: ALL_BASE_INPUT_ENTRIES.length },
          { label: "月度规划表", value: MONTHLY_INPUT_ENTRIES.length },
          { label: "周度执行表", value: WEEKLY_INPUT_ENTRIES.length },
        ]}
        columns={3}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <SectionCard
            key={section.title}
            title={section.title}
            description={section.description}
            contentClassName="divide-y"
          >
            {section.entries.map((item) => (
              <div key={item.href} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 text-sm font-medium text-primary hover:underline"
                >
                  查看
                </Link>
              </div>
            ))}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
