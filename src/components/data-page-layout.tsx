import type { ReactNode } from "react";
import { PageIntro } from "@/components/page-intro";
import { SummaryStatsGrid, type SummaryStatItem } from "@/components/summary-stats-grid";
import { DataTable, type DataTableProps } from "@/components/data-table";
import { toBusinessTerm } from "@/lib/business-terminology";

interface DataPageLayoutProps<T extends Record<string, unknown>> {
  title: string;
  description?: ReactNode;
  statsItems?: SummaryStatItem[];
  statsColumns?: 2 | 3 | 4;
  actions?: ReactNode;
  table: DataTableProps<T>;
}

export function DataPageLayout<T extends Record<string, unknown>>({
  title,
  description,
  statsItems = [],
  statsColumns = 4,
  actions,
  table,
}: DataPageLayoutProps<T>) {
  return (
    <div className="space-y-4">
      <PageIntro title={toBusinessTerm(title)} description={typeof description === "string" ? toBusinessTerm(description) : description} />
      {actions}
      {statsItems.length > 0 && (
        <SummaryStatsGrid
          items={statsItems.map((item) => ({ ...item, label: toBusinessTerm(item.label) }))}
          columns={statsColumns}
        />
      )}
      <DataTable {...table} />
    </div>
  );
}


