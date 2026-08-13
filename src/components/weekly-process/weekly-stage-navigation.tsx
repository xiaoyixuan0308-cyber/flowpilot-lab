import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WEEKLY_STAGE_DEFINITIONS,
  buildWeeklyStageHref,
  type WeeklyStageSlug,
} from "@/lib/weekly-stage-registry";

interface WeeklyStageNavigationProps {
  calendarDate: string;
  currentSlug?: WeeklyStageSlug;
  query?: string;
  compact?: boolean;
}

export function WeeklyStageNavigation({
  calendarDate,
  currentSlug,
  query = "",
  compact = false,
}: WeeklyStageNavigationProps) {
  const currentIndex = currentSlug
    ? WEEKLY_STAGE_DEFINITIONS.findIndex((stage) => stage.slug === currentSlug)
    : -1;
  const previous = currentIndex > 0 ? WEEKLY_STAGE_DEFINITIONS[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < WEEKLY_STAGE_DEFINITIONS.length - 1
      ? WEEKLY_STAGE_DEFINITIONS[currentIndex + 1]
      : null;

  if (compact && currentSlug) {
    return (
      <nav className="flex flex-wrap items-center justify-between gap-3 border-y py-3">
        {previous ? (
          <Link
            href={buildWeeklyStageHref(calendarDate, previous.slug, query)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="size-4" />
            {previous.shortTitle}
          </Link>
        ) : <span />}
        <Link
          href={`/calc/weekly-process/${calendarDate}${query ? `?${query}` : ""}`}
          className="text-sm text-primary underline"
        >
          计算导航
        </Link>
        {next ? (
          <Link
            href={buildWeeklyStageHref(calendarDate, next.slug, query)}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            {next.shortTitle}
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Link
            href={`/calc/weekly-results/${calendarDate}${query ? `?${query}` : ""}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            全字段明细
            <ArrowRight className="size-4" />
          </Link>
        )}
      </nav>
    );
  }

  return (
    <nav className="overflow-x-auto border-y py-5">
      <div className="flex min-w-max items-center gap-2">
        {WEEKLY_STAGE_DEFINITIONS.map((stage, index) => (
          <div key={stage.slug} className="flex items-center gap-2">
            <Link
              href={buildWeeklyStageHref(calendarDate, stage.slug, query)}
              className={cn(
                "grid h-20 w-40 content-center gap-1 rounded-md border px-3 text-left transition-colors hover:bg-accent",
                currentSlug === stage.slug && "border-primary bg-primary/5",
              )}
            >
              <span className="text-sm font-medium">{stage.shortTitle}</span>
              <Badge variant="outline" className="w-fit text-[10px]">{stage.granularity}</Badge>
            </Link>
            {index < WEEKLY_STAGE_DEFINITIONS.length - 1 && (
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            )}
          </div>
        ))}
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
        <Link
          href={`/calc/weekly-results/${calendarDate}${query ? `?${query}` : ""}`}
          className="grid h-20 w-36 content-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
        >
          全字段明细
        </Link>
      </div>
    </nav>
  );
}
