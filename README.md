# FlowPilot Lab

FlowPilot Lab 是一个面向供应链规划与履约场景的全栈演示平台，用于展示从基础数据治理、补货规划到周度配货执行与异常分析的完整数据链路。

项目内置一套可重复初始化的虚构业务数据，适合用于产品演示、流程验证和全栈开发实践。所有名称、编码与业务数据均为演示用途。

## 核心能力

- **供应链驾驶舱**：集中展示库存、在途、风险、建议金额和健康度指标。
- **统一数据中心**：支持基础表浏览、关键字段筛选、组合查询、Excel 导入与导出。
- **月度补货规划**：结合历史采购、需求预测、库存天数和配额生成补货建议。
- **周度配货执行**：综合库存、在途、未清订单、金额目标和业务约束形成发货建议。
- **异常识别**：覆盖预测缺失、库存不足、目标偏差、金额差额和约束冲突等场景。
- **计算追溯**：展示中间指标、计算口径和逐阶段结果，便于验证与解释。
- **多页签工作区**：支持同时打开多个业务页面并快速切换。

## 技术栈

| 层级 | 技术 |
| --- | --- |
| Web 应用 | Next.js 16、React 19、TypeScript |
| UI 与图表 | Tailwind CSS、Recharts、Lucide Icons |
| 数据访问 | Prisma ORM、PostgreSQL |
| 文件处理 | ExcelJS、JSZip |
| 数据校验 | Zod、TypeScript |

## 快速开始

### 1. 环境要求

- Node.js 20 或更高版本
- PostgreSQL 14 或更高版本
- npm

### 2. 安装依赖

```bash
npm install
```

### 3. 配置数据库

复制环境变量模板并填写本地开发数据库信息：

```bash
cp .env.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env
```

环境变量示例：

```env
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="flowpilot_lab"
DB_SCHEMA="poc"
DB_USER="postgres"
DB_PASSWORD="your_password"
```

### 4. 初始化数据库结构

```bash
npx prisma generate
npx prisma db push
```

### 5. 启动应用

```bash
npm run dev
```

访问 [http://localhost:3011](http://localhost:3011)。

## 演示数据

项目内置固定演示工作簿，覆盖5个渠道、6个产品分类、18个SKU，以及月度历史、周度执行、库存、在途、订单、价格、约束和异常场景。

- 首次打开时，系统会检查演示所需的输入表与结果表。
- 数据库为空或关键表缺失时，系统会自动导入固定数据并生成演示结果。
- 数据完整时不会重复导入，也不会覆盖现有测试数据。
- 标准演示计算基准日为 `2026-07-26`。

检查演示数据覆盖：

```bash
npm run demo:audit
```

恢复标准演示数据：

```bash
curl -X POST http://localhost:3011/api/data/restore-standard-demo
```

## 常用命令

```bash
npm run dev          # 启动开发环境
npm run build        # 构建生产版本
npm run start        # 启动生产版本
npm run lint         # 执行代码检查
npm run demo:audit   # 检查演示数据覆盖
```

## 项目结构

```text
src/app/             页面与 API 路由
src/components/      通用 UI、表格与图表组件
src/server/          数据访问、导入导出与计算服务
prisma/              数据模型
demo-data/           固定演示数据
scripts/             校验与维护脚本
```

## 安全说明

- `.env`、构建产物、依赖目录和本地日志不会提交到版本库。
- 请勿将生产数据库地址、真实密码、访问令牌或客户数据写入代码。
- 演示工作簿仅包含虚构数据。

## License

本项目用于个人学习、作品展示与技术交流。
