export interface AppNavItem {
  title: string;
  href: string;
  description: string;
}

export const dataWorkspacePageItems: AppNavItem[] = [
  {
    title: "基础数据中心",
    href: "/data",
    description: "集中查看月拆分和周拆分基础数据入口。",
  },
  {
    title: "统一数据查询",
    href: "/data/query",
    description: "按经销商、产品分类 或 SKU 查询数据关系。",
  },
];

export const monthlyInputPageItems: AppNavItem[] = [
  {
    title: "DIOH规则表",
    href: "/data/dioh-target",
    description: "维护目标天数和容差规则。",
  },
  {
    title: "库存基础表",
    href: "/data/inventory",
    description: "维护月拆分库存基础值。",
  },
  {
    title: "T2采购历史表",
    href: "/data/t2-purchase",
    description: "维护历史采购数据，支撑 E/H/T/U。",
  },
  {
    title: "渠道-产品分类配货预测表",
    href: "/data/fcst-channel-category",
    description: "维护 渠道-产品分类 层配货预测，对应 W。",
  },
  {
    title: "二级渠道-产品分类预测表",
    href: "/data/fcst-t2-category",
    description: "维护 二级渠道-产品分类 层预测，对应 V。",
  },
];

export const processPageItems: AppNavItem[] = [
  {
    title: "渠道-产品分类范围表",
    href: "/data/channel-category-scope",
    description: "查看 渠道-产品分类 组合是如何被补齐出来的。",
  },
  {
    title: "渠道-产品分类状态表",
    href: "/data/channel-category-status",
    description: "查看 渠道-产品分类 范围和状态结果。",
  },
  {
    title: "产品分类-SKU范围表",
    href: "/data/category-sku-scope",
    description: "查看每个 产品分类 可以展开到哪些 SKU。",
  },
  {
    title: "渠道-产品分类-SKU状态表",
    href: "/data/channel-category-sku-status",
    description: "查看 渠道-产品分类-SKU 范围和状态结果。",
  },
  {
    title: "计算过程说明",
    href: "/calc/process",
    description: "查看月拆分和周拆分的过程说明与中间链路。",
  },
];

export const weeklyInputPageItems: AppNavItem[] = [
  {
    title: "USD/CNY汇率",
    href: "/data/exchange-rate",
    description: "维护人民币输入与展示使用的 USD/CNY 汇率。",
  },
  {
    title: "周拆分输入总览",
    href: "/data",
    description: "查看周拆分输入页的维护入口与使用顺序。",
  },
  {
    title: "经销商发货记录",
    href: "/data/dealer-sku-dn",
    description: "OMS 发货输入表。",
  },
  {
    title: "经销商未清订单",
    href: "/data/dealer-sku-open-order",
    description: "OMS Open Order 输入表。",
  },
  {
    title: "中央仓库存",
    href: "/data/central-warehouse-sku-inventory",
    description: "中央仓 库存输入表。",
  },
  {
    title: "中央仓在途库存",
    href: "/data/central-warehouse-sku-intransit",
    description: "中央仓 在途输入表。",
  },
  {
    title: "安全库存",
    href: "/data/sku-safety-stock",
    description: "SKU 安全库存输入表。",
  },
  {
    title: "SKU周月约束规则",
    href: "/data/sku-constraint",
    description: "维护 SKU 的周、月上限规则。",
  },
  {
    title: "SKU套包规则",
    href: "/data/sku-bundle",
    description: "维护最终 RRA 向下取整使用的 SKU 套包量。",
  },
  {
    title: "经销商SKU单价",
    href: "/data/channel-sku-purchase-price",
    description: "经销商编码 + 类型 + SKU 单价输入表；当前金额计算只取 渠道 类型。",
  },
  {
    title: "周金额调整阈值",
    href: "/data/weekly-amount-threshold",
    description: "按 业务单元 维护 SA 超额缩减和 RA 缺口补差使用的当前阈值。",
  },
  {
    title: "周历与周配比",
    href: "/data/calendar-pattern-weekly",
    description: "维护业务周及累计配比。",
  },
  {
    title: "业务单元周/月预算",
    href: "/data/bu-pattern-amount-weekly",
    description: "维护各业务单元的累计实际金额和月目标。",
  },
];

export const calcPageItems: AppNavItem[] = [
  {
    title: "计算基准",
    href: "/calc/sku-split",
    description: "输入一个计算基准日，系统会先月后周统一重算。",
  },
];

export const weeklyCalculationPageItems: AppNavItem[] = [
  {
    title: "计算导航",
    href: "/calc/weekly-process",
    description: "按周目标、库存、金额、补差和最终调整逐段核验周拆分。",
  },
  {
    title: "全字段明细",
    href: "/calc/weekly-results",
    description: "查看周拆分完整结果宽表。",
  },
];

export const tempPageItems: AppNavItem[] = [
  {
    title: "SKU范围关系表",
    href: "/data/sku-active-list",
    description: "临时页。当前仍保留给团队查看，但不应继续视为正式基础输入。",
  },
  {
    title: "渠道-产品分类配额矩阵视图",
    href: "/data/channel-category-allocate",
    description: "临时页。当前仍保留给团队查看，但需要进一步确认是否还应参与计算。",
  },
];

export const monthlyResultPageItems: AppNavItem[] = [
  {
    title: "月拆分结果",
    href: "/calc/results",
    description: "直接打开当前月份的正式结果页面。",
  },
];

export const weeklyResultPageItems: AppNavItem[] = [
  {
    title: "周拆分结果",
    href: "/calc/weekly-results",
    description: "直接打开当前基准日的正式结果页面。",
  },
];

export const dashboardPageItems: AppNavItem[] = [
  {
    title: "数据可视化图表",
    href: "/calc/dashboard",
    description: "查看ODS趋势、补货管线对比、异常检测与周配货全链路可视化。",
  },
];
