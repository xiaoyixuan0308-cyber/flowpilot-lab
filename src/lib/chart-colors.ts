/** Chart color slots — references CSS custom properties defined in globals.css. */
const CHART_CSS_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Direct hex values, for use outside CSS (e.g. cell backgrounds). */
const CHART_HEX_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"] as const;

export function getChartColor(index: number): string {
  return CHART_CSS_VARS[index % CHART_CSS_VARS.length];
}

export function getChartHex(index: number): string {
  return CHART_HEX_LIGHT[index % CHART_HEX_LIGHT.length];
}

export const CHART_COLORS = CHART_CSS_VARS;
