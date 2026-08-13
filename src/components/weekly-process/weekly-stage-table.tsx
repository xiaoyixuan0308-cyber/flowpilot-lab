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
  sc_bu: string;
  lp_code: string;
  pl5_code: string;
  upn: string;
  traces: Record<WeeklyFormulaCode, FormulaTrace>;
}

interface WeeklyStageTableProps {
  calendarDate: string;
  title: string;
  fields: WeeklyFormulaCode[];
  rows: WeeklyStageTableRow[];
  initialFilters: { bu?: string; lp?: string; pl5?: string; upn?: string };
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
      { key: "sc_bu", header: "业务单元" },
      {
        key: "lp_code",
        header: "LP",
        className: "sticky left-0 z-10 bg-background",
        headerDetailClassName: "sticky left-0 z-10 bg-muted/20",
      },
      { key: "pl5_code", header: "产品分类" },
      { key: "upn", header: "SKU" },
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
        keys: { bu: "sc_bu", lp: "lp_code", pl5: "pl5_code", upn: "upn" },
        initialValues: initialFilters,
      }}
      exportTable="calc_weekly_upn_split_result"
      exportParams={{ calendar_date: calendarDate }}
    />
  );
}
