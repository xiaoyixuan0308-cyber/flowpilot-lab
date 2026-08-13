import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toBusinessTerm } from "@/lib/business-terminology";

interface ChartCardProps {
  title: string;
  dim?: string;
  description?: string;
  height?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  dim,
  description,
  height = 320,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "暂无数据",
  children,
  className,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b bg-muted/20 px-5 py-4">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          {toBusinessTerm(title)}
          {dim && (
            <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border bg-muted px-2 text-[11px] font-medium text-muted-foreground">
              {toBusinessTerm(dim)}
            </span>
          )}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {toBusinessTerm(description)}
          </p>
        )}
      </div>
      <div className="px-5 py-4" style={{ height, minHeight: height }}>
        {isLoading ? (
          <div className="flex flex-col gap-3" style={{ height }}>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="flex-1 w-full" />
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}


