"use client";

import { useMemo } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { FormulaColumnHeaderDetail } from "@/components/formula/formula-column-header";
import { FormulaValueCell } from "@/components/formula/formula-value-cell";
import {
  WEEKLY_FORMULA_REGISTRY,
  type FormulaTrace,
  type WeeklyFormulaCode,
} from "@/lib/weekly-formula-registry";

export interface WeeklyStageTableRow extends Record<string, unknown> {
  id: string;
  business_unit: string;
  channel_code: string;
  category_code: string;
  sku: string;
  traces: Record<WeeklyFormulaCode, FormulaTrace>;
}

interface WeeklyStageTableProps {
  calendarDate: string;
  title: string;
  fields: WeeklyFormulaCode[];
  rows: WeeklyStageTableRow[];
  initialFilters: { bu?: string; channel?: string; category?: string; sku?: string };
}

export function WeeklyStageTable({
  calendarDate,
  title,
  fields,
  rows,
  initialFilters,
}: WeeklyStageTableProps) {
  const columns = useMemo<Column<WeeklyStageTableRow>[]>(
    () => [
      { key: "business_unit", header: "业务单元" },
      {
        key: "channel_code",
        header: "渠道",
        className: "sticky left-0 z-10 bg-background",
        headerDetailClassName: "sticky left-0 z-10 bg-muted/20",
      },
      { key: "category_code", header: "产品分类" },
      { key: "sku", header: "SKU" },
      ...fields.map((code) => ({
        key: code,
        header: `${WEEKLY_FORMULA_REGISTRY[code].name} (${code})`,
        headerDetail: <FormulaColumnHeaderDetail code={code} />,
        className: "align-top",
        render: (row: WeeklyStageTableRow) => <FormulaValueCell trace={row.traces[code]} />,
      })),
    ],
    [fields],
  );

  return (
    <DataTable<WeeklyStageTableRow>
      title={title}
      columns={columns}
      data={rows}
      dimensionFilters={{
        keys: { bu: "business_unit", channel: "channel_code", category: "category_code", sku: "sku" },
        initialValues: initialFilters,
      }}
      exportTable="calc_weekly_sku_split_result"
      exportParams={{ calendar_date: calendarDate }}
    />
  );
}
