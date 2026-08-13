import { FormulaDetailSheet } from "@/components/formula/formula-detail-sheet";
import { FormulaExpression } from "@/components/formula/formula-expression";
import {
  shouldShowWeeklyFormula,
  WEEKLY_FORMULA_REGISTRY,
  type FormulaTrace,
} from "@/lib/weekly-formula-registry";

export function FormulaMetric({ trace, label }: { trace: FormulaTrace; label?: string }) {
  const definition = WEEKLY_FORMULA_REGISTRY[trace.code];
  const showFormula = shouldShowWeeklyFormula(trace.code);

  return (
    <div className="min-w-0 border-l-2 border-border pl-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label ?? `${definition.name} (${trace.code})`}</span>
        {showFormula && <FormulaDetailSheet trace={trace} />}
      </div>
      <div className="font-mono text-lg font-semibold tabular-nums">{trace.result ?? "空"}</div>
      {!showFormula ? (
        <div className="mt-1 text-xs text-muted-foreground">直接取值</div>
      ) : (
        <div className="mt-1 whitespace-normal break-words text-xs text-muted-foreground">
          <FormulaExpression tex={trace.substituted} />
        </div>
      )}
    </div>
  );
}
