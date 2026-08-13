import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toBusinessTerm } from "@/lib/business-terminology";

interface SectionCardProps {
  title: string;
  dim?: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function SectionCard({
  title,
  dim,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden border border-border/75 bg-card/95 py-0 shadow-sm ring-0",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "border-b bg-muted/20 px-5 py-4",
          action && "flex flex-row items-start justify-between gap-4",
          headerClassName,
        )}
      >
        {action ? (
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              {toBusinessTerm(title)}
              {dim && <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border bg-muted px-2 text-[11px] font-medium text-muted-foreground">{toBusinessTerm(dim)}</span>}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs leading-5">{typeof description === "string" ? toBusinessTerm(description) : description}</CardDescription>
            )}
          </div>
        ) : (
          <>
            <CardTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              {toBusinessTerm(title)}
              {dim && <span className="inline-flex h-5 shrink-0 items-center rounded-md border border-border bg-muted px-2 text-[11px] font-medium text-muted-foreground">{toBusinessTerm(dim)}</span>}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1 text-xs leading-5">{typeof description === "string" ? toBusinessTerm(description) : description}</CardDescription>
            )}
          </>
        )}
        {action}
      </CardHeader>
      {children && <CardContent className={cn("px-5 py-4", contentClassName)}>{children}</CardContent>}
    </Card>
  );
}

