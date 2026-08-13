export interface FormulaCatalogItem {
  badge: string;
  title: string;
  formulaLatex: string;
  description: string;
}

export interface FormulaCatalogSection {
  title: string;
  description: string;
  items: FormulaCatalogItem[];
}

export const MONTHLY_FORMULA_SECTIONS: FormulaCatalogSection[] = [
  {
    title: "需求与库存基础量",
    description: "从历史采购、预测、当月采购和库存推导单个产品的需求速度。",
    items: [
      {
        badge: "历史占比",
        title: "产品历史采购占比",
        formulaLatex: String.raw`\text{产品历史采购占比}=\frac{\text{产品近6个月采购量}}{\text{所属分类近6个月采购总量}}`,
        description: "同一渠道与产品分类范围内，单个产品过去 6 个月采购量占分类总采购量的比例；分母为 0 时按 0 处理。",
      },
      {
        badge: "平均需求",
        title: "产品三期平均需求量",
        formulaLatex: String.raw`\text{三期平均需求}=\text{历史占比}\times\frac{\text{前两月实际采购量}+\text{当月分类预测量}}{3}`,
        description: "将产品分类前两个月的实际采购量与当月预测量取平均，再按产品历史占比分配。",
      },
      {
        badge: "采购预测",
        title: "产品当月采购预测量",
        formulaLatex: String.raw`\text{产品当月采购预测量}=\text{历史占比}\times\text{产品分类当月预测量}`,
        description: "把产品分类的当月预测量按产品历史采购占比分摊。",
      },
      {
        badge: "剩余需求",
        title: "产品当月剩余采购需求",
        formulaLatex: String.raw`\text{剩余采购需求}=\max(\text{当月采购预测量}-\text{当月已采购量},0)`,
        description: "从当月采购预测量中扣除已经发生的采购量，剩余需求不允许为负数。",
      },
      {
        badge: "当前库存天数",
        title: "当前库存天数",
        formulaLatex: String.raw`\text{当前库存天数}=\frac{\text{期初库存}}{\text{当月采购预测量}}\times30`,
        description: "当月采购预测量为 0 时按 0 处理。",
      },
    ],
  },
  {
    title: "目标库存与理论补货",
    description: "先在渠道与产品分类层计算配货后天数，再回到单个产品计算目标库存。",
    items: [
      {
        badge: "分类汇总",
        title: "渠道与产品分类分组汇总",
        formulaLatex: String.raw`\text{分类库存}=\sum\text{产品库存},\quad\text{分类剩余需求}=\sum\text{产品剩余需求},\quad\text{分类平均需求}=\sum\text{产品平均需求}`,
        description: "汇总当前渠道与产品分类下所有产品的指标。",
      },
      {
        badge: "配货后天数",
        title: "配货后预计库存天数",
        formulaLatex: String.raw`\text{配货后库存天数}=\frac{\text{分类库存}+\text{计划配货量}-\text{分类剩余需求}}{\text{分类平均需求}}\times30`,
        description: "分类平均需求为 0 时按 0 处理。",
      },
      {
        badge: "目标库存",
        title: "原目标期末库存",
        formulaLatex: String.raw`\text{原目标库存}=\frac{\text{目标库存天数}}{30}\times\text{产品平均需求}`, description: "依据目标库存天数折算库存数量。",
      },
      {
        badge: "动态目标", title: "动态目标期末库存",
        formulaLatex: String.raw`\text{动态目标库存}=\frac{\text{配货后库存天数}}{30}\times\text{产品平均需求}`,
        description: "按渠道与产品分类配货后的整体天数折算到单个产品。",
      },
      {
        badge: "最终目标",
        title: "最终目标库存",
        formulaLatex: String.raw`\text{最终目标库存}=\begin{cases}\text{原目标库存},&\text{动态目标较高且不允许调剂}\\\text{动态目标库存},&\text{其余情况}\end{cases}`,
        description: "不允许调剂时，动态目标超过原目标的部分会被封顶。",
      },
      {
        badge: "补货缺口",
        title: "理论补货量",
        formulaLatex: String.raw`\text{理论补货量}=\max(\text{最终目标库存}+\text{剩余采购需求}-\text{期初库存},0)`,
        description: "理论补货量不允许为负数。",
      },
    ],
  },
  {
    title: "配额调整与最终 DIOH",
    description: "在渠道与产品分类分组内按计划配货量约束并进行余量调剂。",
    items: [
      {
        badge: "分类补货", title: "产品分类理论补货汇总",
        formulaLatex: String.raw`\text{分类理论补货量}=\sum\text{各产品理论补货量}`,
        description: "汇总当前渠道与产品分类下所有产品的理论补货量。",
      },
      {
        badge: "基础补货",
        title: "基础补货量",
        formulaLatex: String.raw`\text{基础补货量}=\begin{cases}\text{产品理论补货量},&\text{分类理论补货量}<\text{计划配货量}\\\text{产品理论补货占比}\times\text{计划配货量},&\text{其余情况}\end{cases}`,
        description: "理论总量超过计划配货量时，按产品理论补货占比等比缩减。",
      },
      {
        badge: "调剂补货", title: "调剂后补货量",
        formulaLatex: String.raw`\text{调剂后补货量}=\begin{cases}\text{基础补货量},&\text{不允许调剂}\\\text{基础补货量}+\text{可调剂余量按历史占比分配},&\text{允许调剂}\end{cases}`,
        description: "剩余配货量只在允许调剂的产品间按历史采购占比分配。",
      },
      {
        badge: "调整后天数", title: "调整后库存天数",
        formulaLatex: String.raw`\text{调整后库存天数}=\frac{\text{期初库存}+\text{调剂后补货量}-\text{剩余采购需求}}{\text{产品平均需求}}\times30`,
        description: "产品平均需求为 0 时按 0 处理。调剂后补货量也是周度配货执行默认承接的月度补货建议量。",
      },
    ],
  },
];

export const WEEKLY_FORMULA_SECTIONS: FormulaCatalogSection[] = [
  {
    title: "累计目标与库存分配",
    description: "依据截至当前周的累计进度比例，将月度补货建议转换为周度累计目标并检查库存是否充足。",
    items: [
      {
        badge: "可用库存",
        title: "中央仓可用库存",
        formulaLatex: String.raw`\text{中央仓可用库存}=\max(\text{现有库存}+\text{在途库存}-\text{安全库存},0)`,
        description: "现有库存与在途库存相加后扣除必须保留的安全库存，可用量不允许为负数。",
      },
      {
        badge: "累计目标",
        title: "渠道累计目标与待发量",
        formulaLatex: String.raw`\text{渠道累计目标}=\text{月度补货建议}\times\text{累计进度比例},\quad\text{渠道待发量}=\max(\text{累计目标}-\text{本月已发量},0)`,
        description: "根据本月截至基准日的实际发货量，计算当前仍需发出的数量。",
      },
      {
        badge: "产品汇总",
        title: "产品累计目标与待发汇总",
        formulaLatex: String.raw`\text{产品累计目标}=\sum\text{各渠道累计目标},\quad\text{产品待发汇总}=\sum\text{各渠道待发量}`,
        description: "针对同一产品，跨渠道汇总累计目标和待发需求。",
      },
      {
        badge: "目标完成率",
        title: "已发占累计目标比例",
        formulaLatex: String.raw`\text{目标完成率}=\frac{\text{产品本月已发总量}}{\text{产品累计目标}}`,
        description: "产品累计目标为 0 时按 0 处理。",
      },
      {
        badge: "库存状态",
        title: "库存状态",
        formulaLatex: String.raw`\text{库存状态}=\begin{cases}\text{不足},&\text{产品待发需求}+\text{其他渠道订单}>\text{可用库存}\\\text{充足},&\text{其余情况}\end{cases}`,
        description: "同时考虑当前待发需求和其他渠道对同一产品的未清订单压力。",
      },
      {
        badge: "建议补货",
        title: "库存约束后建议补货量",
        formulaLatex: String.raw`\text{建议补货量}=\begin{cases}\text{渠道待发量},&\text{库存充足}\\0,&\text{无剩余库存或无待发需求}\\\text{渠道待发占比}\times\text{扣除订单后的可用库存},&\text{库存不足}\end{cases}`,
        description: "库存不足时，将扣除其他渠道订单压力后的可用库存，按各渠道待发需求占比分配。",
      },
    ],
  },
  {
    title: "金额差额与系统调整",
    description: "将建议数量转换为金额，与截至当前周的累计金额目标对比并按差异进行缩减。",
    items: [
      {
        badge: "调整边界",
        title: "数量调整边界",
        formulaLatex: String.raw`\text{可分配库存余额}=\max(\text{可用库存}-\text{其他订单}-\text{已建议总量},0),\quad\text{目标库存缺口}=\max(\text{目标库存}-\text{当前库存}-\text{建议补货量},0)`,
        description: "同时计算产品可分配库存余额、目标库存缺口和补货后的预计库存天数，作为后续补差上限。",
      },
      {
        badge: "建议金额",
        title: "建议金额",
        formulaLatex: String.raw`\text{建议金额}=\text{建议补货量}\times\text{渠道产品单价}`,
        description: "使用对应渠道和产品的采购单价计算建议金额。",
      },
      {
        badge: "金额目标",
        title: "累计金额目标",
        formulaLatex: String.raw`\text{累计金额目标}=\text{整月目标金额}\times\text{累计进度比例},\quad\text{累计待发金额}=\text{累计金额目标}-\text{累计实际金额}`,
        description: "将整月目标按周进度折算，再扣除截至当前周已经完成的实际金额。",
      },
      {
        badge: "金额差额",
        title: "建议金额差额",
        formulaLatex: String.raw`\text{建议金额差额}=\text{累计待发金额}-\text{建议金额合计},\quad\text{差额比例}=\frac{\text{建议金额差额}}{\text{整月目标金额}}`,
        description: "差额大于 0 时进入补差；差额小于或等于 0 时进入缩减调整。",
      },
      {
        badge: "缩减数量",
        title: "系统调整后数量",
        formulaLatex: String.raw`\text{系统调整数量}=\begin{cases}0,&\text{无待发金额或无建议金额}\\\operatorname{round}(\text{累计待发金额}\times\text{建议数量占比}),&\text{超额超过阈值}\\\text{原建议补货量},&\text{其余情况}\end{cases}`,
        description: "当建议金额明显超出累计待发金额时，按金额目标等比缩减并四舍五入。",
      },
    ],
  },
  {
    title: "约束、补差与最终结果",
    description: "补差按照库存天数、渠道、产品分类和产品编码排序逐行分配，并动态扣减产品级余额。",
    items: [
      {
        badge: "约束余额",
        title: "月约束余额",
        formulaLatex: String.raw`\text{月约束余额}=\max(\text{产品月度建议总量}-\text{已占用数量}-\text{产品待发汇总},0)`,
        description: "周不能超时不追加补差；月不能超时受月度建议余额限制；无约束的重点产品可使用剩余可用库存。",
      },
      {
        badge: "金额补差",
        title: "金额补差量",
        formulaLatex: String.raw`\text{金额补差量}=\max\left(\min\left(\text{库存余额},\text{目标库存缺口},\text{约束余额},\left\lfloor\frac{\text{剩余待补金额}}{\text{产品单价}}\right\rfloor\right),0\right)`,
        description: "仅存在正向金额缺口、允许调整且单价有效的记录参与，库存、约束和金额余额会逐行扣减。",
      },
      {
        badge: "补差数量",
        title: "补差后数量",
        formulaLatex: String.raw`\text{补差后数量}=\text{建议补货量}+\text{金额补差量}`,
        description: "在原建议补货量上追加允许的金额补差数量。",
      },
      {
        badge: "最终发货量",
        title: "最终建议发货量",
        formulaLatex: String.raw`\text{最终建议发货量}=\left\lfloor\frac{\text{补差或缩减后的数量}}{\text{包装规格}}\right\rfloor\times\text{包装规格}`,
        description: "金额不足时使用缩减后的数量，金额有缺口时使用补差后数量；配置包装规格后向下取整到整包。",
      },
      {
        badge: "最终金额",
        title: "最终金额与差额",
        formulaLatex: String.raw`\text{最终金额}=\text{最终建议发货量}\times\text{产品单价},\quad\text{最终金额差额}=\text{累计待发金额}-\text{最终金额合计}`,
        description: "用于衡量最终发货建议与累计待发金额目标之间仍存在的差异。",
      },
    ],
  },
];
