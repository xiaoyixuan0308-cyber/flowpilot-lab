import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CURRENT_SETTING_ID = "CURRENT";

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function parseCalculationCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("计算基准日必须使用 YYYY-MM-DD 格式");
  }

  const date = new Date(`${value}T08:00:00+08:00`);
  if (Number.isNaN(date.getTime()) || toDateKey(date) !== value) {
    throw new Error("计算基准日不是有效日期");
  }

  return date;
}

export async function getCurrentCalculationCalendarDate(
  db: Prisma.TransactionClient = prisma,
) {
  const setting = await db.calc_runtime_setting.findUnique({
    where: { id: CURRENT_SETTING_ID },
    select: { calendar_date: true },
  });

  if (setting) return toDateKey(setting.calendar_date);

  const latestCalendar = await db.ods_calendar_pattern_weekly.findFirst({
    orderBy: { week_end_date: "desc" },
    select: { week_end_date: true },
  });

  return latestCalendar
    ? toDateKey(latestCalendar.week_end_date)
    : toDateKey(new Date());
}

export async function saveCurrentCalculationCalendarDate(
  calendarDate: string,
  db: Prisma.TransactionClient = prisma,
) {
  const parsedDate = parseCalculationCalendarDate(calendarDate);

  await db.calc_runtime_setting.upsert({
    where: { id: CURRENT_SETTING_ID },
    create: {
      id: CURRENT_SETTING_ID,
      calendar_date: parsedDate,
      updated_at: new Date(),
    },
    update: {
      calendar_date: parsedDate,
      updated_at: new Date(),
    },
  });

  return calendarDate;
}
