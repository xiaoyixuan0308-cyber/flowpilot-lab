import { redirect } from "next/navigation";
import { getCurrentCalculationCalendarDate } from "@/server/repositories";

export const dynamic = "force-dynamic";

export default async function WeeklyProcessEntryPage() {
  const calendarDate = await getCurrentCalculationCalendarDate();
  redirect(`/calc/weekly-process/${calendarDate}`);
}
