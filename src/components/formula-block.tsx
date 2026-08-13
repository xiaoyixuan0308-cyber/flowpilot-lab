import katex from "katex";

interface FormulaBlockProps {
  formula: string;
  className?: string;
}

export function FormulaBlock({ formula, className }: FormulaBlockProps) {
  let html: string;

  try {
    html = katex.renderToString(formula, {
      displayMode: true,
      throwOnError: false,
      strict: false,
    });
  } catch {
    html = `<pre>${formula}</pre>`;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
