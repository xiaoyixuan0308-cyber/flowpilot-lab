import Link from "next/link";
import { FormulaBlock } from "@/components/formula-block";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import {
  MONTHLY_FORMULA_SECTIONS,
  WEEKLY_FORMULA_SECTIONS,
  type FormulaCatalogSection,
} from "@/server/services/calc/formula-catalog";

function FormulaSections({ sections }: { sections: FormulaCatalogSection[] }) {
  return (
    <div className="grid gap-4">
      {sections.map((section) => (
        <SectionCard key={section.title} title={section.title} description={section.description}>
          <div className="grid gap-3 lg:grid-cols-2">
            {section.items.map((item) => (
              <article key={item.badge} className="rounded-lg border bg-background p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex min-w-10 shrink-0 justify-center rounded-md border bg-muted px-2 py-1 text-xs font-semibold">
                    {item.badge}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto rounded-md bg-muted/40 px-3 py-2">
                  <FormulaBlock formula={item.formulaLatex} />
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  );
}

export default function CalcProcessPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        title="计算公式与业务口径"
        description="完整展示月度补货规划和周度配货执行链路。公式与当前服务端实现保持一致，除数为 0、约束分支和套包取整均单独说明。"
        breadcrumbs={[{ label: "统一计算", href: "/calc/upn-split" }, { label: "公式说明" }]}
      />

      <SectionCard
        title="当前结果入口"
        description="公式目录说明通用口径；月度补货规划还可以进入单个产品的代入值与重算校验。"
      >
        <SummaryStatsGrid
          columns={4}
          items={[
            { label: "月度规划指标", value: MONTHLY_FORMULA_SECTIONS.reduce((sum, section) => sum + section.items.length, 0) },
            { label: "周度执行指标", value: WEEKLY_FORMULA_SECTIONS.reduce((sum, section) => sum + section.items.length, 0) },
            {
              label: "月度补货建议",
              value: (
                <Link className="text-primary underline" href="/calc/results">
                  进入结果页
                </Link>
              ),
            },
            {
              label: "周度发货建议",
              value: (
                <Link className="text-primary underline" href="/calc/weekly-results">
                  进入结果页
                </Link>
              ),
            },
          ]}
        />
      </SectionCard>

      <section id="monthly" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">月度补货规划指标</h2>
          <p className="mt-1 text-sm text-muted-foreground">从历史采购占比开始，逐步得到最终补货量和调整后库存天数。</p>
        </div>
        <FormulaSections sections={MONTHLY_FORMULA_SECTIONS} />
      </section>

      <section id="weekly" className="scroll-mt-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">周度配货执行指标</h2>
          <p className="mt-1 text-sm text-muted-foreground">承接月度补货建议，依次完成累计目标、库存分配、金额补差、约束和套包取整。</p>
        </div>
        <FormulaSections sections={WEEKLY_FORMULA_SECTIONS} />
      </section>
    </div>
  );
}
