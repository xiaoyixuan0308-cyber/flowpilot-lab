const terminologyRules: Array<[RegExp, string]> = [
  [/月拆分结果/g, "月度补货建议"],
  [/周拆分结果/g, "周度发货建议"],
  [/月拆分计算/g, "月度补货规划"],
  [/周拆分计算/g, "周度配货执行"],
  [/月拆分/g, "月度补货规划"],
  [/周拆分/g, "周度配货执行"],
  [/供应链计算/g, "补货计划与执行"],
  [/AD\s*→\s*SA\s*→\s*RA\s*→\s*RRA/gi, "建议补货→缩减调整→金额补差→最终发货"],
  [/P\s*→\s*Q\s*→\s*R\s*→\s*S/gi, "补货缺口→理论补货→基础补货→调剂补货"],
  [/Pattern\s*Gap/gi, "目标差额"],
  [/DIOH/gi, "库存天数"],
  [/Dealer\s+SKU/gi, "经销商SKU"],
  [/\bBusiness\s*Unit\b/gi, "业务单元"],
  [/\bCentral\s*Warehouse\b/gi, "中央仓"],
  [/\bDealer\b/gi, "经销商"],
  [/\bT2\b/gi, "二级渠道"],
  [/\bCategory\b/gi, "产品分类"],
  [/\bChannel\b/gi, "渠道"],
];

/**
 * 将计算口径中的英文缩写（DIOH、T2、计算阶段代号等）转换成通用业务术语，
 * 便于在页面上展示。数据库字段、URL 和计算公式保持英文标识。
 */
export function toBusinessTerm(value: string): string {
  return terminologyRules.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  );
}
