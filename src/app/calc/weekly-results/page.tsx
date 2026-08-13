import { redirect } from "next/navigation";
import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { SectionCard } from "@/components/section-card";
import { getCurrentCalculationCalendarDate, getWeeklyCalcBatchSummary } from "@/server/repositories";

export default async function WeeklyResultsPage() {
  const [summary, currentCalendarDate] = await Promise.all([
    getWeeklyCalcBatchSummary(),
    getCurrentCalculationCalendarDate(),
  ]);
  const currentBatch = summary.batches.find(
    (batch) => batch.calendar_date.toISOString().slice(0, 10) === currentCalendarDate,
  );
  const targetDate = currentBatch
    ? currentCalendarDate
    : summary.batches[0]?.calendar_date
    ? summary.batches[0].calendar_date.toISOString().slice(0, 10)
    : null;

  if (targetDate) {
    redirect(`/calc/weekly-results/${targetDate}`);
  }

  return (
    <div className="space-y-6">
      <PageIntro
        title="周度发货建议"
        description="当前还没有可查看的周度发货建议。"
      />

      <SectionCard title="暂无结果" description="请先执行一版周拆分计算。">
        <PageFeedbackCard
          title="暂无周度发货建议"
          description="先到“周度配货执行”页执行一次计算，系统会生成当前正式结果。"
        />
      </SectionCard>
    </div>
  );
}
