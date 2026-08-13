# FlowPilot Lab 数据可视化仪表板 — 演示脚本

## 环境准备

```bash
# 1. 确认在正确分支
git branch  # 应该显示 feat/calc-viz

# 2. 安装依赖
cd dsc-poc && npm install

# 3. 生成测试数据（如果还没有）
npm run testdata:build

# 4. 启动 dev server
npm run dev

# 5. 打开浏览器
open http://localhost:3011/calc/dashboard
```

## 演示流程

### 1. Dashboard 首页概览（30 秒）

- 展示页面标题 "数据可视化仪表板"
- 顶部 KPI 卡片：月度批次数、成功批次、错误率、平均 DIOH、调整后 DIOH
- 说明：所有数据来自真实数据库查询，实时刷新

### 2. ODS 趋势折线图（60 秒）

- **T2采购历史趋势**：按月份展示各 PL5 的采购量变化
  - Hover 查看某月某 PL5 的具体采购数量
  - 说明：数据来自 `ods_t2_purchase_monthly` 表，X 轴为年月，每条线代表一个 Top 5 PL5

- **库存变化趋势**：按月展示各经销商（LP）的库存量变化
  - 说明：数据来自 `ods_inventory_dealer_upn` 表

- **LP-PL5 预测趋势**：按月展示 LP-PL5 级预测数量
  - 说明：数据来自 `ods_fcst_lp_pl5_monthly` 表

- **T2-PL5 预测趋势**：按月展示 T2-PL5 级预测数量
  - 说明：数据来自 `ods_fcst_t2_pl5_monthly` 表

- **BU 周金额趋势**：实际金额 vs 目标金额的双线对比图
  - Hover 查看某周的累计实际 vs 月目标

- **LP-PL5 配额分配趋势**：按月展示配额分配量

### 3. 柱状图对比（30 秒）

- **月度补货管线**：P → Q → R → S 四阶段分组柱状图
  - 说明每个阶段含义：
    - P: 理论补货值（目标库存 - 当前库存）
    - Q: 实际理论值（P ≥ 0 时取值，< 0 时为 0）
    - R: 基础补货量（按 Q*/W 比例分配后）
    - S: 容差补货量（最终输出，含容差调整）

- **周配货管线**：AD → SA → RA → RRA 四阶段
  - AD: OR 建议量
  - SA: 系统调整后（超额自动缩减）
  - RA: 缺口补差量（不足时自动补差）
  - RRA: 最终确认量

### 4. 异常可视化（30 秒）

- **异常类型分布环形图**：展示各类异常的占比
  - 中心数字：异常总数
  - 说明：数据来自月度计算结果中 `is_error = true` 的行

- **DIOH < 30 告警 UPN 表**：列出库存天数不足 30 天的 UPN
  - 按 DIOH 升序排列
  - 支持搜索和分页

- **异常 UPN 明细表**（页面底部）：所有被标记为异常的 UPN
  - 显示 LP 编码、UPN、PL5、异常信息、S 容差补货量
  - 支持搜索过滤

### 5. 筛选联动（30 秒）

- 切换 `period_month` 下拉框 → 月度补货管线和异常数据更新
- 切换 `calendar_date` 下拉框 → 周配货管线数据更新
- 点击"刷新"按钮 → 所有图表重新加载

### 6. Dark Mode 展示（30 秒）

- 切换系统 dark mode
- 展示图表颜色在 dark mode 下的可读性
- 每个图表颜色保持区分度（CVD 安全调色板）

## 文件清单

```
dsc-poc/
├── src/
│   ├── app/
│   │   ├── api/calc/viz/
│   │   │   ├── ods-trends/route.ts        # ODS 趋势数据 API
│   │   │   ├── pipeline/route.ts          # 月度补货管线 API
│   │   │   ├── weekly-pipeline/route.ts   # 周配货管线 API
│   │   │   ├── errors/route.ts            # 异常数据 API
│   │   │   └── summary/route.ts           # KPI 汇总 API
│   │   ├── calc/dashboard/
│   │   │   ├── page.tsx                   # Server Component
│   │   │   └── dashboard-client.tsx       # Client Component
│   │   └── globals.css                    # 图表颜色变量
│   ├── components/charts/
│   │   ├── chart-card.tsx                 # 图表容器
│   │   ├── line-chart.tsx                 # 折线图
│   │   ├── bar-chart.tsx                  # 柱状图
│   │   └── donut-chart.tsx               # 环形图
│   └── lib/
│       ├── chart-colors.ts               # 颜色常量
│       └── dsc-catalog.ts                # 导航项（已更新）
├── package.json                           # 新增 recharts 依赖
└── scripts/demo-viz.md                    # 本文件
```
