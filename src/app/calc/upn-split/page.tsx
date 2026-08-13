import { getCalcBatchSummary, getCurrentCalculationCalendarDate } from "@/server/repositories";
import { buildCalcBatchTableRows } from "@/lib/calc-batch-view";
import { getWeeklyCalcBatchSummary } from "@/server/repositories";
import { ResultSnapshotPageClient } from "./result-snapshot-page-client";

export default async function UpnSplitPage({
  searchParams,
}: {
  searchParams: Promise<{ calendarDate?: string }>;
}) {
  const requestedCalendarDate = (await searchParams).calendarDate;
  const [monthlySummary, weeklySummary, savedCalendarDate] = await Promise.all([
    getCalcBatchSummary(),
    getWeeklyCalcBatchSummary(),
    getCurrentCalculationCalendarDate(),
  ]);
  const initialCalendarDate = /^\d{4}-\d{2}-\d{2}$/.test(requestedCalendarDate ?? "")
    ? requestedCalendarDate!
    : savedCalendarDate;
  const initialMonthlyHistoryRows = buildCalcBatchTableRows(monthlySummary.batches);

  return (
    <ResultSnapshotPageClient
      initialMonthlyHistoryRows={initialMonthlyHistoryRows}
      initialWeeklyHistoryRows={weeklySummary.rows}
      initialCalendarDate={initialCalendarDate}
    />
  );
}
