import { prisma } from "@/lib/prisma";
import { resolveWeeklyCalculationContext, saveCurrentCalculationCalendarDate } from "@/server/repositories";
import { runUpnSplitWithClient } from "./monthly-upn-split";
import { runAndPersistWeeklyUpnSplitWithClient } from "./weekly-upn-split";

export async function runUnifiedCalculation(calendarDate: string) {
  return prisma.$transaction(
    async (tx) => {
      const context = await resolveWeeklyCalculationContext(calendarDate, tx);
      const monthly = await runUpnSplitWithClient(tx, context.periodMonth);
      const weekly = await runAndPersistWeeklyUpnSplitWithClient(tx, { calendarDate });
      await saveCurrentCalculationCalendarDate(calendarDate, tx);

      return {
        success: true as const,
        calendarDate,
        periodMonth: context.periodMonth,
        context,
        monthly,
        weekly,
      };
    },
    { maxWait: 10_000, timeout: 600_000 }
  );
}
