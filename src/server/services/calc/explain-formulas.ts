import type { CalcTraceRowRecord } from "@/server/repositories/calc.repository";

export type ExplainMetricKey = keyof Pick<
  CalcTraceRowRecord,
  | "e_t2_mix_portion"
  | "f_t2_purchase_3m_avg"
  | "g_t2_purchase_m0"
  | "i_t2_purchase_mtg"
  | "current_dioh"
  | "x_after_allocate_days"
  | "m_original_target_inventory"
  | "n_new_target_inventory"
  | "o_final_target_inventory"
  | "p_theoretical_replenish"
  | "q_actual_theoretical"
  | "q_star_pl5_theoretical"
  | "r_base_replenish"
  | "s_tolerance_replenish"
  | "t_adjusted_dioh"
>;

export interface ExplainStepDefinition {
  key: ExplainMetricKey;
  badge: string;
  title: string;
  sourceKey: "purchase" | "inventory" | "dioh" | "allocation" | "formula";
  source: string;
  formulaLatex: string;
  inputs: Array<keyof CalcTraceRowRecord | "sum_r_base_by_lp_pl5" | "sum_e_tolerance_y_by_lp_pl5">;
  note?: string;
}

export const CALC_EXPLAIN_STEPS: ExplainStepDefinition[] = [
  {
    key: "e_t2_mix_portion", badge: "历史占比", title: "产品历史采购占比", sourceKey: "purchase",
    source: "该产品过去 6 个月采购量 / 所属渠道与产品分类过去 6 个月采购总量",
    formulaLatex: String.raw`\text{产品历史采购占比}=\frac{\text{产品近6个月采购量}}{\text{所属产品分类近6个月采购总量}}`, inputs: [],
    note: "历史窗口聚合值未写入 Trace，因此本步骤展示快照值，不做页面二次重算。",
  },
  {
    key: "f_t2_purchase_3m_avg", badge: "平均需求", title: "产品三期平均需求量", sourceKey: "purchase",
    source: "产品历史采购占比、产品分类前两个月实际采购量及当月预测量",
    formulaLatex: String.raw`\text{产品三期平均需求量}=\text{历史占比}\times\frac{\text{前两月实际采购量}+\text{当月分类预测量}}{3}`,
    inputs: ["e_t2_mix_portion", "t_pl5_purchase_m2", "u_pl5_purchase_m1", "v_pl5_purchase_m0_fcst"],
  },
  {
    key: "g_t2_purchase_m0", badge: "采购预测", title: "产品当月采购预测量", sourceKey: "purchase",
    source: "产品历史采购占比、所属产品分类当月预测量",
    formulaLatex: String.raw`\text{产品当月采购预测量}=\text{产品历史采购占比}\times\text{产品分类当月预测量}`, inputs: ["e_t2_mix_portion", "v_pl5_purchase_m0_fcst"],
  },
  {
    key: "i_t2_purchase_mtg", badge: "剩余需求", title: "产品当月剩余采购需求", sourceKey: "purchase",
    source: "产品当月采购预测量、当月已采购量",
    formulaLatex: String.raw`\text{当月剩余采购需求}=\max(\text{当月采购预测量}-\text{当月已采购量},0)`, inputs: ["g_t2_purchase_m0", "h_t2_purchase_mtd"],
  },
  {
    key: "current_dioh", badge: "当前 DIOH", title: "当前库存天数", sourceKey: "inventory",
    source: "期初库存、产品当月采购预测量", formulaLatex: String.raw`\text{当前库存天数}=\frac{\text{期初库存}}{\text{当月采购预测量}}\times30`, inputs: ["j_opening_inventory", "g_t2_purchase_m0"],
    note: "当月采购预测量为 0 时按 0 处理。",
  },
  {
    key: "x_after_allocate_days", badge: "配货后天数", title: "配货后预计库存天数", sourceKey: "allocation",
    source: "当前渠道与产品分类的库存、配货量、剩余采购需求和平均需求量", formulaLatex: String.raw`\text{配货后预计库存天数}=\frac{\text{分类库存}+\text{计划配货量}-\text{分类剩余需求}}{\text{分类平均需求量}}\times30`,
    inputs: ["j_star_pl5_inventory", "w_mtg_allocate_qty", "i_star_pl5_mtg", "f_t2_purchase_3m_avg"],
    note: "计算使用当前渠道与产品分类下所有产品的平均需求量汇总。",
  },
  {
    key: "m_original_target_inventory", badge: "目标库存", title: "原目标期末库存", sourceKey: "dioh",
    source: "目标库存天数、产品三期平均需求量", formulaLatex: String.raw`\text{原目标期末库存}=\frac{\text{目标库存天数}}{30}\times\text{产品三期平均需求量}`, inputs: ["k_target_days", "f_t2_purchase_3m_avg"],
  },
  {
    key: "n_new_target_inventory", badge: "动态目标", title: "动态目标期末库存", sourceKey: "formula",
    source: "配货后预计库存天数、产品三期平均需求量", formulaLatex: String.raw`\text{动态目标期末库存}=\frac{\text{配货后预计库存天数}}{30}\times\text{产品三期平均需求量}`, inputs: ["x_after_allocate_days", "f_t2_purchase_3m_avg"],
  },
  {
    key: "o_final_target_inventory", badge: "最终目标", title: "最终目标库存", sourceKey: "dioh",
    source: "原目标库存、动态目标库存及是否允许调剂", formulaLatex: String.raw`\text{最终目标库存}=\begin{cases}\text{原目标库存},&\text{动态目标较高且不允许调剂}\\\text{动态目标库存},&\text{其余情况}\end{cases}`,
    inputs: ["m_original_target_inventory", "n_new_target_inventory", "l_tolerance"],
  },
  {
    key: "p_theoretical_replenish", badge: "补货缺口", title: "理论补货缺口", sourceKey: "formula",
    source: "最终目标库存、当月剩余采购需求、期初库存", formulaLatex: String.raw`\text{理论补货缺口}=\text{最终目标库存}+\text{当月剩余需求}-\text{期初库存}`, inputs: ["o_final_target_inventory", "i_t2_purchase_mtg", "j_opening_inventory"],
  },
  {
    key: "q_actual_theoretical", badge: "理论补货", title: "理论补货量", sourceKey: "formula",
    source: "理论补货缺口", formulaLatex: String.raw`\text{理论补货量}=\max(\text{理论补货缺口},0)`, inputs: ["p_theoretical_replenish"],
  },
  {
    key: "q_star_pl5_theoretical", badge: "分类汇总", title: "产品分类理论补货汇总", sourceKey: "formula",
    source: "当前渠道与产品分类下各产品理论补货量汇总", formulaLatex: String.raw`\text{产品分类理论补货汇总}=\sum\text{各产品理论补货量}`, inputs: ["q_actual_theoretical"],
  },
  {
    key: "r_base_replenish", badge: "基础补货", title: "基础补货量", sourceKey: "allocation",
    source: "产品理论补货量、分类理论补货汇总及计划配货量", formulaLatex: String.raw`\text{基础补货量}=\begin{cases}\text{产品理论补货量},&\text{分类理论补货量}<\text{计划配货量}\\\frac{\text{产品理论补货量}}{\text{分类理论补货量}}\times\text{计划配货量},&\text{其余情况}\end{cases}`,
    inputs: ["q_actual_theoretical", "q_star_pl5_theoretical", "w_mtg_allocate_qty"],
  },
  {
    key: "s_tolerance_replenish", badge: "调剂补货", title: "调剂后补货量", sourceKey: "allocation",
    source: "基础补货量、计划配货量、历史采购占比及是否允许调剂", formulaLatex: String.raw`\text{调剂后补货量}=\begin{cases}\text{基础补货量},&\text{不允许调剂}\\\text{基础补货量}+\text{可调剂余量按历史占比分配},&\text{允许调剂}\end{cases}`,
    inputs: ["r_base_replenish", "w_mtg_allocate_qty", "e_t2_mix_portion", "l_tolerance", "sum_r_base_by_lp_pl5", "sum_e_tolerance_y_by_lp_pl5"],
  },
  {
    key: "t_adjusted_dioh", badge: "调整后天数", title: "调整后库存天数", sourceKey: "formula",
    source: "期初库存、调剂后补货量、剩余采购需求和平均需求量", formulaLatex: String.raw`\text{调整后库存天数}=\frac{\text{期初库存}+\text{调剂后补货量}-\text{剩余采购需求}}{\text{产品三期平均需求量}}\times30`,
    inputs: ["j_opening_inventory", "s_tolerance_replenish", "i_t2_purchase_mtg", "f_t2_purchase_3m_avg"],
    note: "产品三期平均需求量为 0 时按 0 处理。",
  },
];
