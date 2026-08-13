const CALC_STATUS_LABELS: Record<string, string> = {
  SUCCESS: "成功",
  PARTIAL: "部分异常",
  FAILED: "失败",
  RUNNING: "计算中",
  PENDING: "待执行",
};

export function translateCalcStatus(status: string | null | undefined) {
  if (!status) return "";
  return CALC_STATUS_LABELS[status] ?? status;
}
