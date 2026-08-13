import { FormulaExpression } from "@/components/formula/formula-expression";
import {
  formatWeeklyFormulaDependency,
  shouldShowWeeklyFormula,
  WEEKLY_FORMULA_REGISTRY,
  type WeeklyFormulaCode,
} from "@/lib/weekly-formula-registry";

export function FormulaColumnHeaderDetail({ code }: { code: WeeklyFormulaCode }) {
  const definition = WEEKLY_FORMULA_REGISTRY[code];
  const showFormula = shouldShowWeeklyFormula(code);

  if (!showFormula) {
    return null;
  }

  return (
    <div className="min-h-12 w-max max-w-none normal-case font-normal tracking-normal" data-formula-column={code}>
      <div className="text-[11px] text-foreground">
        <FormulaExpression tex={definition.symbolic} />
      </div>
      <div
        className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground"
        aria-label={`${code}字段含义`}
      >
        {definition.dependencies.map((dependency) => (
          <span key={dependency}>{formatWeeklyFormulaDependency(dependency)}</span>
        ))}
      </div>
    </div>
  );
}
