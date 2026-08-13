"use client";

import { FormulaDetailSheet } from "@/components/formula/formula-detail-sheet";
import { FormulaExpression } from "@/components/formula/formula-expression";
import { shouldShowWeeklyFormula, type FormulaTrace } from "@/lib/weekly-formula-registry";

export function FormulaValueCell({ trace }: { trace: FormulaTrace }) {
  const showFormula = shouldShowWeeklyFormula(trace.code);

  return (
    <div className={showFormula ? "grid min-w-max grid-cols-[1fr_auto] items-start gap-1" : "min-w-40"}>
      <div>
        <div className="font-mono text-sm font-medium tabular-nums">{trace.result ?? ""}</div>
        {showFormula && (
          <div className="mt-1 w-max max-w-none whitespace-normal text-[11px] text-muted-foreground">
            <FormulaExpression tex={trace.substituted} />
          </div>
        )}
        <div className="mt-1 whitespace-normal text-[11px] text-muted-foreground">
          {trace.branch}
        </div>
      </div>
      {showFormula && <FormulaDetailSheet trace={trace} />}
    </div>
  );
}
