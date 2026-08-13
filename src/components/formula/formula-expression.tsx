import katex from "katex";
import { cn } from "@/lib/utils";

interface FormulaExpressionProps {
  tex: string;
  displayMode?: boolean;
  className?: string;
}

export function FormulaExpression({ tex, displayMode = false, className }: FormulaExpressionProps) {
  const html = katex.renderToString(tex, {
    displayMode,
    throwOnError: false,
    strict: "warn",
    trust: false,
    output: "htmlAndMathml",
  });

  return (
    <span
      className={cn("formula-expression", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
