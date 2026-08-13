import { PageFeedbackCard } from "@/components/page-feedback-card";
import { PageIntro } from "@/components/page-intro";
import { SummaryStatsGrid } from "@/components/summary-stats-grid";
import { listAllLoadedFcstLpPl5Rows } from "@/server/repositories";
import { LpPl5MatrixClient, type LpPl5MatrixRecord } from "./lp-pl5-matrix-client";

function toPeriodKey(year: string, month: string) {
  return `${year}-${month.padStart(2, "0")}`;
}

export default async function LpPl5AllocatePage() {
  const rows = await listAllLoadedFcstLpPl5Rows();
  const data: LpPl5MatrixRecord[] = rows.map((row) => ({
    id: row.id,
    period: toPeriodKey(row.year, row.month),
    dealerlpcode: row.dealerlpcode,
    dealerlpname: row.dealerlpname,
    pl5_code: row.pl5_code,
    pl5_name: row.pl5_name,
    fcst_qty: row.fcst_qty.toString(),
  }));

  const periodOptions = Array.from(new Set(data.map((row) => row.period))).sort((a, b) =>
    b.localeCompare(a)
  );
  const latestPeriod = periodOptions[0] ?? "";
  const latestRows = latestPeriod ? data.filter((row) => row.period === latestPeriod) : [];
  const latestPl5Count = Array.from(new Set(latestRows.map((row) => row.pl5_code))).length;
  const latestLpCount = Array.from(new Set(latestRows.map((row) => row.dealerlpcode))).length;
  const latestFilledCells = Array.from(
    new Set(latestRows.map((row) => `${row.pl5_code}::${row.dealerlpcode}`))
  ).length;
  const latestMatrixCells = latestPl5Count * latestLpCount;
  const latestMissingCells = Math.max(0, latestMatrixCells - latestFilledCells);

  return (
    <div className="space-y-4">
      <PageIntro
        title="LP-产品分类配额矩阵视图"
        description="根据 LP-产品分类 配货预测表动态生成矩阵：横轴为 LP，纵轴为 产品分类；有预测数据的单元格显示预测数量，空白组合表示该 LP 未给对应 产品分类 配额。"
      />

      <SummaryStatsGrid
        items={[
          { label: "最新月份", value: latestPeriod || "-" },
          { label: "最新月份记录数", value: latestRows.length },
          { label: "最新月份LP数", value: latestLpCount },
          { label: "最新月份空白组合", value: latestMissingCells },
        ]}
      />

      {latestPeriod ? (
        <LpPl5MatrixClient rows={data} periodOptions={periodOptions} initialPeriod={latestPeriod} />
      ) : (
        <PageFeedbackCard
          title="暂无LP-产品分类预测数据"
          description="请先导入 LP-产品分类 配货预测表，系统会基于该表生成 LP x 产品分类 矩阵。"
        />
      )}
    </div>
  );
}
