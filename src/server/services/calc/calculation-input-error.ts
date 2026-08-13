export interface CalculationInputIssue {
  source: string;
  field: string;
  key: string;
  message: string;
}

export class CalculationInputError extends Error {
  readonly code = "CALCULATION_INPUT_INVALID";

  constructor(readonly issues: CalculationInputIssue[]) {
    super(`计算未执行：发现 ${issues.length} 条必填数据问题`);
    this.name = "CalculationInputError";
  }
}
