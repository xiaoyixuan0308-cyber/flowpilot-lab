import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { toBusinessTerm } from "@/lib/business-terminology";

export interface SummaryStatItem {
  label: string;
  value: ReactNode;
}

interface SummaryStatsGridProps {
  items: SummaryStatItem[];
  columns?: 2 | 3 | 4 | 5;
}

const columnClassMap: Record<NonNullable<SummaryStatsGridProps["columns"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
};

export function SummaryStatsGrid({
  items,
  columns = 4,
}: SummaryStatsGridProps) {
  return (
    <div className={`grid gap-3 ${columnClassMap[columns]}`}>
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{toBusinessTerm(item.label)}</div>
            <div className="mt-1 text-lg font-semibold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


