export type FormulaGranularity = "行级" | "UPN级" | "批次级";

export interface WeeklyFormulaDefinition {
  name: string;
  symbolic: string;
  granularity: FormulaGranularity;
  dependencies: string[];
  description: string;
  showFormula?: boolean;
}

export const WEEKLY_FORMULA_REGISTRY = {
  H_ROW: {
    name: "月建议量",
    symbolic: String.raw`H_{row}=S_{row}`,
    granularity: "行级",
    dependencies: ["月拆分S"],
    description: "当前 LP+PL5+UPN 行从月拆分承接的月建议量。",
    showFormula: false,
  },
  CD: {
    name: "累计周配比",
    symbolic: String.raw`CD=\frac{\mathrm{Pattern\ pct}}{100}`,
    granularity: "批次级",
    dependencies: ["Calendar"],
    description: "截至本周的累计 Pattern 比例。",
    showFormula: false,
  },
  L: {
    name: "LP本月已发量",
    symbolic: String.raw`L=\sum \mathrm{DN}_{LP,UPN,month}`,
    granularity: "行级",
    dependencies: ["DN", "Calendar"],
    description: "当前 LP+UPN 在本月截至计算日的已发货量。",
    showFormula: false,
  },
  O: {
    name: "UPN本月已发总量",
    symbolic: String.raw`O=\sum_{Dealer}L`,
    granularity: "UPN级",
    dependencies: ["L"],
    description: "同一 UPN 全部 Dealer 在本月截至计算日的已发货量。",
    showFormula: false,
  },
  J: {
    name: "累计目标量",
    symbolic: String.raw`J=H_{row}\times CD`,
    granularity: "行级",
    dependencies: ["H_ROW", "CD"],
    description: "当前行截至本周累计应达到的目标量。",
  },
  JA: {
    name: "LP待发量",
    symbolic: String.raw`JA=\max(J-L,0)`,
    granularity: "行级",
    dependencies: ["J", "L"],
    description: "当前 LP+UPN 距离累计周目标尚需发货的数量。",
  },
  JB: {
    name: "UPN待发总量",
    symbolic: String.raw`JB=\sum_{LP}JA`,
    granularity: "UPN级",
    dependencies: ["JA"],
    description: "同一 UPN 在全部 LP 行的待发量合计。",
  },
  YA: {
    name: "BSC库存",
    symbolic: String.raw`YA=\sum \mathrm{BSC\ unrestricted\ inventory}`,
    granularity: "UPN级",
    dependencies: ["BSC库存"],
    description: "同一 UPN 可观察到的 BSC 非限制库存。",
    showFormula: false,
  },
  YB: {
    name: "当周在途量",
    symbolic: String.raw`YB=\sum \mathrm{Intransit}_{week}`,
    granularity: "UPN级",
    dependencies: ["在途", "Calendar"],
    description: "预计在当前周到达的 UPN 在途数量。",
    showFormula: false,
  },
  YC: {
    name: "安全库存",
    symbolic: String.raw`YC=\mathrm{SafetyStock}_{UPN}`,
    granularity: "UPN级",
    dependencies: ["安全库存规则"],
    description: "不可用于常规发货的安全库存；无记录时使用已确认默认值。",
    showFormula: false,
  },
  Y: {
    name: "可发库存",
    symbolic: String.raw`Y=\max(YA+YB-YC,0)`,
    granularity: "UPN级",
    dependencies: ["YA", "YB", "YC"],
    description: "BSC 库存加当周在途并扣除安全库存，结果做非负保护。",
  },
  R: {
    name: "非LP OR订单",
    symbolic: String.raw`R=S-\sum_{DealerType=LP}P`,
    granularity: "UPN级",
    dependencies: ["S", "P", "Dealer Type"],
    description: "同一 UPN 全部 OR 订单扣除 Dealer Type=LP 的 OR 订单。",
  },
  Z: {
    name: "库存状态",
    symbolic: String.raw`Z=\begin{cases}\varnothing,&JB=\varnothing\ \mathrm{or}\ Y=\varnothing\\\mathrm{STOP},&JB+R>Y\\\mathrm{OK},&JB+R\le Y\end{cases}`,
    granularity: "UPN级",
    dependencies: ["JB", "R", "Y"],
    description: "判断共享可发库存能否覆盖 LP 待发总量及非 LP OR 订单。",
  },
  AD: {
    name: "初始建议量",
    symbolic: String.raw`AD=\begin{cases}\varnothing,&Z=\varnothing\\JA,&Z=\mathrm{OK}\\\frac{JA}{JB}(Y-R),&Z=\mathrm{STOP},Y-R>0,JB>0\\0,&Z=\mathrm{STOP},Y-R\le0\ \mathrm{or}\ JB\le0\end{cases}`,
    granularity: "行级",
    dependencies: ["JA", "JB", "Y", "R", "Z"],
    description: "库存足够时满足行目标；不足时按 JA 占 JB 比例分配可用量。",
  },
  AM: {
    name: "采购单价",
    symbolic: String.raw`AM=\mathrm{USD\ unit\ price}_{LP,UPN}`,
    granularity: "行级",
    dependencies: ["采购价格"],
    description: "当前 LP+UPN 的不含税 USD 单价。",
    showFormula: false,
  },
  AO: {
    name: "建议金额",
    symbolic: String.raw`AO=AD\times AM`,
    granularity: "行级",
    dependencies: ["AD", "AM"],
    description: "当前行初始建议量对应的金额。",
  },
  CE: {
    name: "月LE金额",
    symbolic: String.raw`CE=\mathrm{Month\ LE\ Amount}`,
    granularity: "批次级",
    dependencies: ["月金额目标"],
    description: "本批次作用范围内的整月目标金额。",
    showFormula: false,
  },
  CB: {
    name: "累计目标金额",
    symbolic: String.raw`CB=CE\times CD`,
    granularity: "批次级",
    dependencies: ["CE", "CD"],
    description: "截至本周累计应达到的金额目标。",
  },
  CA: {
    name: "累计实际金额",
    symbolic: String.raw`CA=\mathrm{Actual\ Amount}_{to\ week}`,
    granularity: "批次级",
    dependencies: ["BU达成"],
    description: "截至当前周已完成的实际金额。",
    showFormula: false,
  },
  CR: {
    name: "累计待发金额",
    symbolic: String.raw`CR=CB-CA`,
    granularity: "批次级",
    dependencies: ["CB", "CA"],
    description: "累计金额目标扣除累计实际金额后的待发金额。",
  },
  AQ: {
    name: "建议金额合计",
    symbolic: String.raw`AQ=\sum AO`,
    granularity: "批次级",
    dependencies: ["AO"],
    description: "全部正式结果行初始建议金额的合计。",
  },
  AR: {
    name: "建议差额",
    symbolic: String.raw`AR=CR-AQ`,
    granularity: "批次级",
    dependencies: ["CR", "AQ"],
    description: "正数表示建议金额仍不足，负数表示建议金额超额。",
  },
  AS: {
    name: "建议差额占比",
    symbolic: String.raw`AS=\begin{cases}\varnothing,&AR=\varnothing\ \mathrm{or}\ CE\in\{0,\varnothing\}\\\frac{AR}{CE},&\mathrm{otherwise}\end{cases}`,
    granularity: "批次级",
    dependencies: ["AR", "CE"],
    description: "建议差额占整月 LE 金额的比例；CE 为零或依赖未知时为空。",
  },
  SA: {
    name: "超额缩减后数量",
    symbolic: String.raw`SA=\begin{cases}\varnothing,&AD=\varnothing\ \mathrm{or}\ CR=\varnothing\ \mathrm{or}\ AQ=\varnothing\\0,&CR\le0\ \mathrm{or}\ AQ\le0\\\operatorname{round}\left(\frac{CR}{AQ}AD\right),&AS<-T_o\\AD,&\mathrm{otherwise}\end{cases}`,
    granularity: "行级",
    dependencies: ["CR", "AQ", "AS", "超额缩减阈值", "AD"],
    description: "仅在超过当前 SCBU 的负向阈值时等比缩减，并按业务流程四舍五入为整数。",
  },
  BB: {
    name: "ABC类型",
    symbolic: String.raw`BB=\mathrm{ABCClass}_{LP,UPN}`,
    granularity: "行级",
    dependencies: ["DIOH规则"],
    description: "当前 LP+UPN 的 ABC 类型，仅用于追溯展示，不参与当前补差资格判断。",
    showFormula: false,
  },
  BA: {
    name: "约束类型",
    symbolic: String.raw`BA=\mathrm{ConstraintTypes}_{month,UPN}`,
    granularity: "UPN级",
    dependencies: ["约束规则"],
    description: "同月同 UPN 的周不能超、月不能超规则集合；两种规则可同时存在。",
    showFormula: false,
  },
  H_UPN: {
    name: "UPN月上限",
    symbolic: String.raw`H_{upn}=\sum_{LP,PL5}H_{row}`,
    granularity: "UPN级",
    dependencies: ["H_ROW"],
    description: "同一 UPN 全部行的月建议量合计，用于月不能超约束。",
  },
  BD: {
    name: "允许补差",
    symbolic: String.raw`BD=\begin{cases}N,&\mathrm{WEEK\ CAP}\in BA\\\varnothing,&\mathrm{MONTH\ CAP}\in BA,\ H_{upn}=\varnothing\ \mathrm{or}\ JB=\varnothing\\N,&\mathrm{MONTH\ CAP}\in BA,\ O+JB\ge H_{upn}\\Y,&\mathrm{MONTH\ CAP}\in BA,\ O+JB<H_{upn}\\Y,&\mathrm{otherwise}\end{cases}`,
    granularity: "UPN级",
    dependencies: ["BA", "O", "JB", "H_UPN"],
    description: "周不能超优先禁止；月不能超在月上限仍有余额时允许；无约束允许。",
  },
  BL: {
    name: "月剩余可调量",
    symbolic: String.raw`BL=\begin{cases}\varnothing,&BD=\varnothing\\H_{upn}-O-JB,&\mathrm{MONTH\ CAP}\in BA,BD=Y\\Y,&\mathrm{MONTH\ CAP}\notin BA,BD=Y\\0,&BD=N\end{cases}`,
    granularity: "UPN级",
    dependencies: ["BA", "BD", "H_UPN", "O", "JB", "Y"],
    description: "月不能超时使用剩余月额度；无月约束时使用可发库存；不可调整时为零。",
  },
  BH: {
    name: "剩余可发库存",
    symbolic: String.raw`BH=\max(Y-R-\sum AD,0)`,
    granularity: "UPN级",
    dependencies: ["Y", "R", "AD"],
    description: "初始建议完成后，同一 UPN 尚可用于补差的共享库存。",
  },
  BE: {
    name: "目标期末库存",
    symbolic: String.raw`BE=M_{monthly}`,
    granularity: "行级",
    dependencies: ["月拆分M"],
    description: "月拆分生成的原目标期末库存。",
    showFormula: false,
  },
  BF: {
    name: "当前库存",
    symbolic: String.raw`BF=J_{monthly}`,
    granularity: "行级",
    dependencies: ["月拆分J"],
    description: "与本次月拆分 J 同源同值的 LP+UPN 实际库存。",
    showFormula: false,
  },
  BI: {
    name: "目标库存可调上限",
    symbolic: String.raw`BI=\max(BE-BF-AD,0)`,
    granularity: "行级",
    dependencies: ["BE", "BF", "AD"],
    description: "避免补差后超过原目标期末库存。",
  },
  BK: {
    name: "补货后DIOH",
    symbolic: String.raw`BK=\begin{cases}\varnothing,&AD=\varnothing\ \mathrm{or}\ BF=\varnothing\ \mathrm{or}\ BJ=\varnothing\ \mathrm{or}\ BJ\le0\\\frac{AD+BF}{BJ}\times30,&BJ>0\end{cases}`,
    granularity: "行级",
    dependencies: ["AD", "BF", "BJ"],
    description: "用于决定 RA 补差顺序；BJ 为零或未知时为空且不参与补差。",
  },
  BJ: {
    name: "T2采购3月均量",
    symbolic: String.raw`BJ=F_{monthly}`,
    granularity: "行级",
    dependencies: ["月拆分F"],
    description: "月拆分承接的 T2 采购三个月平均量。",
    showFormula: false,
  },
  RA: {
    name: "补差数量",
    symbolic: String.raw`RA_i=\begin{cases}\varnothing,&AD_i=\varnothing\\0,&BD_i=N\ \mathrm{or}\ BJ_i\le0\\\varnothing,&AR=\varnothing\\0,&AS=\varnothing\ \mathrm{or}\ AS\le T_s\\\varnothing,&AS>T_s,\ \exists X\in\{BD_i,BH_i,BI_i,BL_i,AM_i,BJ_i,BF_i\}:X=\varnothing\\Q_i,&AS>T_s,E_i\\0,&\mathrm{otherwise}\end{cases}\quad E_i=(BD_i=Y)\land(BK_i\ne\varnothing)\land(BH_i>0)\land(BI_i>0)\land(BL_i>0)\land(AM_i>0)\quad Q_i=\max\left(0,\min\left(BH^{rem}_{upn},BH_i,BI_i,BL^{rem}_{upn},BL_i,\operatorname{down}_{10}\left(\frac{AR^{rem}}{AM_i}\right)\right)\right)`,
    granularity: "行级",
    dependencies: ["AS", "缺口补差阈值", "BK", "BH", "BI", "BL", "AM", "AR"],
    description: "AS 超过正向阈值后按 BK 升序单次扫描，并动态扣减共享 BH/BL。",
  },
  RB: {
    name: "补差后数量",
    symbolic: String.raw`RB=AD+RA`,
    granularity: "行级",
    dependencies: ["AD", "RA"],
    description: "初始建议量加本行贪心补差量。",
  },
  RRA_DEFAULT: {
    name: "系统默认RRA",
    symbolic: String.raw`RRA_{\mathrm{default}}=\begin{cases}\varnothing,&Q_{\mathrm{branch}}=\varnothing\\\left\lfloor\frac{Q_{\mathrm{branch}}}{BG}\right\rfloor BG,&\mathrm{otherwise}\end{cases}\quad Q_{\mathrm{branch}}=\begin{cases}\varnothing,&AR=\varnothing\\SA,&CR\le0\ \mathrm{or}\ AQ\le0\ \mathrm{or}\ AS<-T_o\\RB,&AS>T_s\\AD,&\mathrm{otherwise}\end{cases}`,
    granularity: "行级",
    dependencies: ["SA", "RB", "AD", "BG", "AR", "CR", "AQ", "AS", "两个阈值"],
    description: "按超额、缺口或容差内分支选数量后，用有效套包量向下取整；缺套包记录时有效值为1。",
  },
  BG: {
    name: "套包数量",
    symbolic: String.raw`BG=\begin{cases}\mathrm{BundleQty}_{UPN},&\mathrm{configured}\\1,&\mathrm{otherwise}\end{cases}`,
    granularity: "UPN级",
    dependencies: ["套包规则"],
    description: "最终数量向下取整使用的有效 UPN 套包数；未配置记录时默认1。",
    showFormula: false,
  },
  RRA_MANUAL: {
    name: "人工RRA",
    symbolic: String.raw`RRA_{\mathrm{manual}}=\mathrm{UserInput}`,
    granularity: "行级",
    dependencies: ["用户输入"],
    description: "用户保存的最终数量覆盖值；允许为空，非空值必须为整数；负数和非套包倍数仍产生软警告。",
    showFormula: false,
  },
  RRA: {
    name: "生效RRA",
    symbolic: String.raw`RRA=\begin{cases}RRA_{\mathrm{manual}},&RRA_{\mathrm{manual}}\ne\varnothing\\RRA_{\mathrm{default}},&RRA_{\mathrm{manual}}=\varnothing\end{cases}`,
    granularity: "行级",
    dependencies: ["RRA_MANUAL", "RRA_DEFAULT", "SA", "RB", "AD", "BG", "AS", "两个阈值"],
    description: "人工值优先；无人工值时使用系统默认值。",
  },
  RRB: {
    name: "最终金额",
    symbolic: String.raw`RRB=RRA\times AM`,
    granularity: "行级",
    dependencies: ["RRA", "AM"],
    description: "当前生效最终数量对应的金额。",
  },
  RRC: {
    name: "最终金额合计",
    symbolic: String.raw`RRC=\sum RRB`,
    granularity: "批次级",
    dependencies: ["RRB"],
    description: "全部正式结果行生效最终金额的合计。",
  },
  RD: {
    name: "最终差额",
    symbolic: String.raw`RD=CR-RRC`,
    granularity: "批次级",
    dependencies: ["CR", "RRC"],
    description: "批次目标待发金额与生效最终金额之间的差额。",
  },
} as const satisfies Record<string, WeeklyFormulaDefinition>;

export type WeeklyFormulaCode = keyof typeof WEEKLY_FORMULA_REGISTRY;

export const WEEKLY_FORMULA_DEPENDENCY_LABELS = {
  "月拆分S": "月拆分行级建议量",
  Calendar: "周历与周配比",
  DN: "经销商发货记录",
  BSC库存: "BSC非限制库存",
  在途: "当周在途库存",
  安全库存规则: "UPN安全库存规则",
  S: "同一 UPN 全部 OR 未清订单总量",
  P: "当前 LP+UPN 的 OR 未清订单量",
  "Dealer Type": "经销商类型",
  采购价格: "LP+UPN采购单价",
  月金额目标: "整月 LE 金额目标",
  BU达成: "截至当前周实际金额",
  超额缩减阈值: "超额缩减阈值",
  DIOH规则: "DIOH/ABC规则",
  约束规则: "周不能超/月不能超规则",
  月拆分M: "月拆分目标期末库存",
  月拆分J: "月拆分期初库存",
  月拆分F: "T2采购三个月日均量",
  缺口补差阈值: "缺口补差阈值",
  两个阈值: "超额缩减阈值和缺口补差阈值",
  套包规则: "UPN套包规则",
  用户输入: "人工最终数量输入",
} as const;

export function formatWeeklyFormulaDependency(dependency: string) {
  if (Object.prototype.hasOwnProperty.call(WEEKLY_FORMULA_REGISTRY, dependency)) {
    const code = dependency as WeeklyFormulaCode;
    return `${code} [${WEEKLY_FORMULA_REGISTRY[code].name}]`;
  }
  const label = WEEKLY_FORMULA_DEPENDENCY_LABELS[
    dependency as keyof typeof WEEKLY_FORMULA_DEPENDENCY_LABELS
  ];
  return label ? `${dependency} [${label}]` : dependency;
}

export function shouldShowWeeklyFormula(code: WeeklyFormulaCode) {
  const definition: WeeklyFormulaDefinition = WEEKLY_FORMULA_REGISTRY[code];
  return definition.showFormula !== false;
}

export interface FormulaTrace {
  code: WeeklyFormulaCode;
  result: string | null;
  symbolic: string;
  substituted: string;
  branch: string;
  granularity: FormulaGranularity;
}
