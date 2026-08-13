"use client";

import Decimal from "decimal.js";
import { RotateCcw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/data-table";
import { FormulaMetric } from "@/components/formula/formula-metric";
import { FormulaColumnHeaderDetail } from "@/components/formula/formula-column-header";
import { FormulaValueCell } from "@/components/formula/formula-value-cell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormulaTrace } from "@/lib/weekly-formula-registry";
import type { WeeklyStageTableRow } from "@/components/weekly-process/weekly-stage-table";

interface FinalAdjustmentRow extends WeeklyStageTableRow {
  manual_final_qty: string | null;
  system_default_final_qty: string | null;
  final_qty: string | null;
  final_amount: string | null;
  unit_price: string | null;
  suggest_qty: string | null;
  bundle_qty: string | null;
  remaining_bsc_available_qty: string | null;
  target_inventory_adjustable_qty: string | null;
  monthly_remaining_adjustable_qty: string | null;
  other_dealer_open_order_or_qty: string | null;
  bsc_available_qty: string | null;
}

interface WeeklyFinalAdjustmentTableProps {
  calendarDate: string;
  batchId: string;
  buSummaries: Array<{
    scBu: string;
    targetPendingAmount: string | null;
    systemDefaultFinalAmountTotal: string | null;
    systemDefaultPatternGapAmount: string | null;
  }>;
  rows: FinalAdjustmentRow[];
  initialFilters: { bu?: string; lp?: string; pl5?: string; upn?: string };
}

interface PreviewRow extends FinalAdjustmentRow {
  previewFinalQty: string | null;
  previewFinalAmount: string | null;
  hardError: string | null;
  softWarnings: string[];
}

const NUMERIC_LIMIT = new Decimal(10).pow(20);

function formatDecimal(value: Decimal.Value) {
  return new Decimal(value)
    .toDecimalPlaces(10, Decimal.ROUND_HALF_UP)
    .toFixed(10)
    .replace(/\.?0+$/, "");
}

function parseDraft(value: string) {
  if (value.trim() === "") return { value: null, error: null };
  try {
    const parsed = new Decimal(value);
    if (!parsed.isFinite() || parsed.abs().gte(NUMERIC_LIMIT)) {
      return { value: null, error: "超出 numeric(30,10) 范围" };
    }
    if (parsed.isNegative()) {
      return { value: null, error: "人工最终数量不能为负数" };
    }
    if (!parsed.isInteger()) {
      return { value: null, error: "人工最终数量必须为整数" };
    }
    return { value: formatDecimal(parsed), error: null };
  } catch {
    return { value: null, error: "请输入合法有限数值" };
  }
}

function cloneTrace(trace: FormulaTrace, result: string | null, substituted: string, branch: string) {
  return { ...trace, result, substituted, branch };
}

export function WeeklyFinalAdjustmentTable({
  calendarDate,
  batchId,
  buSummaries,
  rows,
  initialFilters,
}: WeeklyFinalAdjustmentTableProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((row) => [row.id, row.manual_final_qty ?? ""])),
  );
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [serverWarnings, setServerWarnings] = useState<string[]>([]);

  const preview = useMemo(() => {
    const previewRows: PreviewRow[] = rows.map((row) => {
      const draft = drafts[row.id] ?? "";
      const parsed = parseDraft(draft);
      const previewFinalQty = parsed.error ? null : parsed.value ?? row.system_default_final_qty ?? null;
      const previewFinalAmount =
        previewFinalQty === null || row.unit_price == null
          ? null
          : formatDecimal(new Decimal(previewFinalQty).times(row.unit_price));
      const softWarnings: string[] = [];

      if (!parsed.error && parsed.value !== null) {
        const manual = new Decimal(parsed.value);
        const suggest = new Decimal(row.suggest_qty ?? 0);
        const extra = Decimal.max(manual.minus(suggest), 0);
        if (row.bundle_qty && !new Decimal(row.bundle_qty).isZero() && !manual.mod(row.bundle_qty).isZero()) {
          softWarnings.push(`不是套包${formatDecimal(row.bundle_qty)}的整数倍`);
        }
        for (const [label, value] of [
          ["BH", row.remaining_bsc_available_qty],
          ["BI", row.target_inventory_adjustable_qty],
          ["BL", row.monthly_remaining_adjustable_qty],
        ] as const) {
          if (value !== null && extra.gt(value)) softWarnings.push(`增加量超过${label}`);
        }
      }

      return { ...row, previewFinalQty, previewFinalAmount, hardError: parsed.error, softWarnings };
    });

    const rowsByUpn = new Map<string, PreviewRow[]>();
    for (const row of previewRows) {
      const group = rowsByUpn.get(row.upn) ?? [];
      group.push(row);
      rowsByUpn.set(row.upn, group);
    }
    for (const upnRows of rowsByUpn.values()) {
      if (!upnRows.some((row) => (drafts[row.id] ?? "").trim() !== "")) continue;
      if (upnRows.some((row) => row.previewFinalQty === null)) continue;
      const total = upnRows.reduce((sum, row) => sum.plus(row.previewFinalQty!), new Decimal(0));
      const other = upnRows.find((row) => row.other_dealer_open_order_or_qty !== null)?.other_dealer_open_order_or_qty;
      const available = upnRows.find((row) => row.bsc_available_qty !== null)?.bsc_available_qty;
      if (other != null && available != null && total.plus(other).gt(available)) {
        for (const row of upnRows) row.softWarnings.push("同一SKU共享库存可能超限");
      }
    }

    const summaries = buSummaries.map((summary) => {
      const buRows = previewRows.filter((row) => row.sc_bu === summary.scBu);
      const allAmountsKnown = buRows.every((row) => row.previewFinalAmount !== null);
      const finalAmountTotal = allAmountsKnown
        ? formatDecimal(buRows.reduce((sum, row) => sum.plus(row.previewFinalAmount!), new Decimal(0)))
        : null;
      const finalPatternGapAmount =
        summary.targetPendingAmount === null || finalAmountTotal === null
          ? null
          : formatDecimal(new Decimal(summary.targetPendingAmount).minus(finalAmountTotal));
      return { ...summary, finalAmountTotal, finalPatternGapAmount };
    });

    return { rows: previewRows, summaries };
  }, [buSummaries, drafts, rows]);

  async function saveChanges(changes: Array<{ resultId: string; manualFinalQty: string | null }>) {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/calc/weekly-results/${calendarDate}/manual-final-qty`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batchId, changes }),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "保存失败");
      setServerWarnings((body.warnings ?? []).map((warning: { message: string }) => warning.message));
      setFeedback("人工最终数量已保存，各业务单元的最终金额与差额已由服务端重算。");
      setDrafts((current) => ({
        ...current,
        ...Object.fromEntries(changes.map((change) => [change.resultId, change.manualFinalQty ?? ""])),
      }));
      setDirtyIds(new Set());
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    const changes = [...dirtyIds].map((resultId) => ({
      resultId,
      manualFinalQty: drafts[resultId]?.trim() ? drafts[resultId].trim() : null,
    }));
    if (changes.length === 0) {
      setFeedback("没有待保存的修改。");
      return;
    }
    if (preview.rows.some((row) => dirtyIds.has(row.id) && row.hardError)) {
      setFeedback("存在无法写入 numeric(30,10) 的输入，请先修正。");
      return;
    }
    await saveChanges(changes);
  }

  async function resetRow(rowId: string) {
    await saveChanges([{ resultId: rowId, manualFinalQty: null }]);
  }

  const columns: Column<PreviewRow>[] = [
      { key: "sc_bu", header: "业务单元" },
      {
        key: "lp_code",
        header: "LP",
        className: "sticky left-0 z-10 bg-background",
        headerDetailClassName: "sticky left-0 z-10 bg-muted/20",
      },
      { key: "pl5_code", header: "产品分类" },
      { key: "upn", header: "SKU" },
      {
        key: "AD",
        header: "初始建议量 (AD)",
        headerDetail: <FormulaColumnHeaderDetail code="AD" />,
        render: (row) => <FormulaValueCell trace={row.traces.AD} />,
      },
      {
        key: "RRA_DEFAULT",
        header: "系统默认RRA (RRA_DEFAULT)",
        headerDetail: <FormulaColumnHeaderDetail code="RRA_DEFAULT" />,
        render: (row) => <FormulaValueCell trace={row.traces.RRA_DEFAULT} />,
      },
      {
        key: "manual_final_qty",
        header: "人工RRA (RRA_MANUAL)",
        className: "min-w-48 align-top",
        render: (row) => (
          <div className="space-y-1">
            <Input
              type="number"
              min={0}
              step={1}
              value={drafts[row.id] ?? ""}
              inputMode="numeric"
              aria-label={`${row.lp_code}-${row.upn} 人工RRA`}
              onChange={(event) => {
                const value = event.target.value;
                setDrafts((current) => ({ ...current, [row.id]: value }));
                setDirtyIds((current) => new Set(current).add(row.id));
              }}
            />
            {row.hardError && <div className="text-xs text-destructive">{row.hardError}</div>}
          </div>
        ),
      },
      {
        key: "final_qty",
        header: "生效RRA (RRA)",
        headerDetail: <FormulaColumnHeaderDetail code="RRA" />,
        render: (row) => row.hardError ? <span className="text-sm text-destructive">无法预览</span> : (
          <FormulaValueCell
            trace={cloneTrace(
              row.traces.RRA,
              row.previewFinalQty,
              drafts[row.id]?.trim()
                ? String.raw`RRA=RRA_{manual}=${row.previewFinalQty ?? "\\varnothing"}`
                : String.raw`RRA=RRA_{\mathrm{default}}=${row.previewFinalQty ?? "\\varnothing"}`,
              drafts[row.id]?.trim() ? "人工值优先（预览）" : "使用系统默认值（预览）",
            )}
          />
        ),
      },
      {
        key: "final_amount",
        header: "最终金额 (RRB)",
        headerDetail: <FormulaColumnHeaderDetail code="RRB" />,
        render: (row) => row.hardError ? "" : (
          <FormulaValueCell
            trace={cloneTrace(
              row.traces.RRB,
              row.previewFinalAmount,
              String.raw`${row.previewFinalQty ?? "\\varnothing"}\times${row.unit_price ?? "\\varnothing"}=${row.previewFinalAmount ?? "\\varnothing"}`,
              "按当前生效RRA预览",
            )}
          />
        ),
      },
      {
        key: "warnings",
        header: "软警告",
        className: "min-w-48 whitespace-normal align-top",
        render: (row) => row.softWarnings.length > 0 ? (
          <ul className="space-y-1 text-xs text-amber-700">
            {row.softWarnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        ) : <span className="text-xs text-muted-foreground">无</span>,
      },
      {
        key: "reset",
        header: "重置",
        render: (row) => (
          <Button type="button" variant="outline" size="sm" disabled={saving || row.manual_final_qty === null} onClick={() => resetRow(row.id)}>
            <RotateCcw className="size-4" />
            重置
          </Button>
        ),
      },
    ];

  const summaryTraces = preview.summaries.map((summary) => {
    const traceRow = rows.find((row) => row.sc_bu === summary.scBu) ?? rows[0];
    return {
      scBu: summary.scBu,
      defaultTotal: cloneTrace(
        traceRow.traces.RRC,
        summary.systemDefaultFinalAmountTotal,
        String.raw`\sum RRB_{\mathrm{default}}=${summary.systemDefaultFinalAmountTotal ?? "\\varnothing"}`,
        "系统默认套包结果",
      ),
      defaultGap: cloneTrace(
        traceRow.traces.RD,
        summary.systemDefaultPatternGapAmount,
        String.raw`${summary.targetPendingAmount ?? "\\varnothing"}-${summary.systemDefaultFinalAmountTotal ?? "\\varnothing"}=${summary.systemDefaultPatternGapAmount ?? "\\varnothing"}`,
        "系统默认差额",
      ),
      previewTotal: cloneTrace(
        traceRow.traces.RRC,
        summary.finalAmountTotal,
        String.raw`\sum RRB_{\mathrm{effective}}=${summary.finalAmountTotal ?? "\\varnothing"}`,
        "人工调整实时预览",
      ),
      previewGap: cloneTrace(
        traceRow.traces.RD,
        summary.finalPatternGapAmount,
        String.raw`${summary.targetPendingAmount ?? "\\varnothing"}-${summary.finalAmountTotal ?? "\\varnothing"}=${summary.finalPatternGapAmount ?? "\\varnothing"}`,
        "人工调整实时预览",
      ),
    };
  });

  return (
    <div className="space-y-4">
      {summaryTraces.map((summary) => (
        <div key={summary.scBu} className="space-y-2 border-y py-4">
          <div className="text-sm font-medium">{summary.scBu}</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormulaMetric trace={summary.defaultTotal} label="系统默认最终金额" />
            <FormulaMetric trace={summary.defaultGap} label="系统默认差额" />
            <FormulaMetric trace={summary.previewTotal} label="生效最终金额 (RRC)" />
            <FormulaMetric trace={summary.previewGap} label="生效最终差额 (RD)" />
          </div>
        </div>
      ))}
      {feedback && <div className="rounded-md border px-3 py-2 text-sm">{feedback}</div>}
      {serverWarnings.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {serverWarnings.join("；")}
        </div>
      )}
      <DataTable<PreviewRow>
        title="最终发货调整"
        actions={
          <Button type="button" size="sm" disabled={saving || dirtyIds.size === 0} onClick={saveAll}>
            <Save className="size-4" />
            {saving ? "保存中" : `保存全部修改 (${dirtyIds.size})`}
          </Button>
        }
        columns={columns}
        data={preview.rows}
        dimensionFilters={{
          keys: { bu: "sc_bu", lp: "lp_code", pl5: "pl5_code", upn: "upn" },
          initialValues: initialFilters,
        }}
        exportTable="calc_weekly_upn_split_result"
        exportParams={{ calendar_date: calendarDate }}
      />
    </div>
  );
}
