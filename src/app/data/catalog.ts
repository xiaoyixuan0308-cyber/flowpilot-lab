export interface DataCatalogEntry {
  title: string;
  href: string;
  description: string;
  status: "ready" | "blocked";
}

export const MONTHLY_INPUT_ENTRIES: DataCatalogEntry[] = [
  {
    title: "库存天数规则表",
    href: "/data/dioh-target",
    description: "维护经销商与 SKU 的目标库存天数和容差规则。",
    status: "ready",
  },
  {
    title: "库存基础表",
    href: "/data/inventory",
    description: "维护月拆分使用的经销商 SKU 库存基础值。",
    status: "ready",
  },
  {
    title: "T2采购历史表",
    href: "/data/t2-purchase",
    description: "维护最近六个月采购数据，支撑历史占比和月拆分计算。",
    status: "ready",
  },
  {
    title: "LP-产品分类配货预测表",
    href: "/data/fcst-lp-pl5",
    description: "维护 LP-产品分类 层配货预测数据。",
    status: "ready",
  },
  {
    title: "T2-产品分类预测表",
    href: "/data/fcst-t2-pl5",
    description: "维护 T2-产品分类 层预测数据。",
    status: "ready",
  },
];

export const WEEKLY_INPUT_ENTRIES: DataCatalogEntry[] = [
  {
    title: "USD/CNY汇率",
    href: "/data/exchange-rate",
    description: "维护 1 USD 对应的 CNY 数量；后续 CNY 导入按该汇率标准化为 USD。",
    status: "ready",
  },
  {
    title: "经销商发货记录",
    href: "/data/dealer-upn-dn",
    description: "FOMS 发货输入表，支持模板下载、导入、导出和明细查看。",
    status: "ready",
  },
  {
    title: "经销商未清订单",
    href: "/data/dealer-upn-open-order",
    description: "FOMS Open Order 输入表，保留订单类型明细。",
    status: "ready",
  },
  {
    title: "BSC库存",
    href: "/data/bsc-upn-inventory",
    description: "BSC 库存输入表，维护库位与非限制库存数量。",
    status: "ready",
  },
  {
    title: "BSC在途库存",
    href: "/data/bsc-upn-intransit",
    description: "BSC 在途输入表，维护 ETA 与在途数量。",
    status: "ready",
  },
  {
    title: "安全库存",
    href: "/data/upn-safety-stock",
    description: "手工安全库存输入表，维护 SKU 安全库存数量。",
    status: "ready",
  },
  {
    title: "SKU周月约束规则",
    href: "/data/upn-constraint",
    description: "维护 SKU 在指定月份使用的周不能超、月不能超规则。",
    status: "ready",
  },
  {
    title: "SKU套包规则",
    href: "/data/upn-bundle",
    description: "维护最终 RRA 向下取整使用的 SKU 套包量。",
    status: "ready",
  },
  {
    title: "Dealer SKU单价",
    href: "/data/lp-upn-purchase-price",
    description: "维护经销商编码 + 类型 + SKU 单价；当前金额计算只取 LP 类型。",
    status: "ready",
  },
  {
    title: "周金额调整阈值",
    href: "/data/weekly-amount-threshold",
    description: "按 SC_BU 维护 SA 超额缩减阈值和 RA 缺口补差当前阈值。",
    status: "ready",
  },
  {
    title: "周历与周配比",
    href: "/data/calendar-pattern-weekly",
    description: "业务周、业务月与截至本周累计配比输入表，支撑周边界和累计目标推进比例。",
    status: "ready",
  },
  {
    title: "业务单元周/月预算",
    href: "/data/bu-pattern-amount-weekly",
    description: "每周每个业务单元一条，维护可空的累计实际金额和必填的月目标金额。",
    status: "ready",
  },
];

export const ALL_BASE_INPUT_ENTRIES = [...MONTHLY_INPUT_ENTRIES, ...WEEKLY_INPUT_ENTRIES];

export const WEEKLY_PHASE_ONE_READY_ENTRIES = WEEKLY_INPUT_ENTRIES;
export const WEEKLY_PHASE_ONE_BLOCKED_ENTRIES: DataCatalogEntry[] = [];
