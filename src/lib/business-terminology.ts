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
  [/LP-PL5-UPN/gi, "渠道-产品分类-SKU"],
  [/LP-PL5/gi, "渠道-产品分类"],
  [/PL5-UPN/gi, "产品分类-SKU"],
  [/Dealer\s+UPN/gi, "经销商SKU"],
  [/SC[\s_]*BU|SCBU/gi, "业务单元"],
  [/\bBSC\b/gi, "中央仓"],
  [/\bDealer\b/gi, "经销商"],
  [/\bT2\b/gi, "二级渠道"],
  [/\bUPN\b/gi, "SKU"],
  [/\bPL5\b/gi, "产品分类"],
  [/\bLP\b/gi, "渠道"],
];

/**
 * 将当前医疗器械模板的技术维度名称转换成跨行业业务术语。
 * 数据库字段、URL 和计算公式仍使用原始编码，避免影响既有计算链路。
 */
export function toBusinessTerm(value: string): string {
  return terminologyRules.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  );
}
