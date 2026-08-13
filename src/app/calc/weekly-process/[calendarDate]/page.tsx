import { MetaBadgeRow } from "@/components/meta-badge-row";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { WeeklyStageNavigation } from "@/components/weekly-process/weekly-stage-navigation";
import { getWeeklyCalcBatchDetail } from "@/server/repositories";

interface WeeklyProcessNavigationPageProps {
  params: Promise<{ calendarDate: string }>;
  searchParams: Promise<{ lp?: string; pl5?: string; upn?: string }>;
}

export default async function WeeklyProcessNavigationPage({
  params,
  searchParams,
}: WeeklyProcessNavigationPageProps) {
  const { calendarDate } = await params;
  const filters = await searchParams;
  const batch = await getWeeklyCalcBatchDetail(calendarDate);
  const query = new URLSearchParams();
  if (filters.lp) query.set("lp", filters.lp);
  if (filters.pl5) query.set("pl5", filters.pl5);
  if (filters.upn) query.set("upn", filters.upn);

  if (!batch) {
    return (
      <div className="space-y-6">
        <PageIntro title="周度配货执行" description={`${calendarDate} 的分阶段执行核验入口。`} />
        <PageFeedbackCard title="未找到周度发货建议。" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="周度配货执行"
        description={`${calendarDate} 的正式结果分阶段核验。`}
        breadcrumbs={[{ label: "计算基准", href: "/calc/upn-split" }, { label: calendarDate }]}
      />
      <MetaBadgeRow
        items={[
          { label: "计算基准日", value: calendarDate, variant: "secondary" },
          { label: "结果行数", value: batch.total_rows, variant: "outline" },
          { label: "行级", value: "LP+产品分类+SKU", variant: "outline" },
          { label: "SKU级", value: "同SKU共享", variant: "outline" },
          { label: "批次级", value: "不随筛选变化", variant: "outline" },
        ]}
      />
      <WeeklyStageNavigation calendarDate={calendarDate} query={query.toString()} />
    </div>
  );
}
