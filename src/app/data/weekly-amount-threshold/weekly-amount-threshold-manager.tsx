"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, RotateCcw, Save, Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type WeeklyAmountThresholdManagerRow = Record<string, unknown> & {
  sc_bu: string;
  overage_threshold_pct: string;
  shortfall_threshold_pct: string;
  source_system: string;
};

type FormState = {
  scBu: string;
  overageThresholdPct: string;
  shortfallThresholdPct: string;
};

const EMPTY_FORM: FormState = {
  scBu: "",
  overageThresholdPct: "5",
  shortfallThresholdPct: "5",
};

export function WeeklyAmountThresholdManager({
  rows,
}: {
  rows: WeeklyAmountThresholdManagerRow[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  function resetForm() {
    setForm(EMPTY_FORM);
    setMessage("");
    setIsError(false);
  }

  function editRow(row: WeeklyAmountThresholdManagerRow) {
    setForm({
      scBu: row.sc_bu,
      overageThresholdPct: row.overage_threshold_pct,
      shortfallThresholdPct: row.shortfall_threshold_pct,
    });
    setMessage("");
    setIsError(false);
  }

  async function saveRule() {
    setPendingAction("save");
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/settings/weekly-amount-threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "阈值保存失败");
      setForm({
        scBu: payload.rule.scBu,
        overageThresholdPct: String(payload.rule.overageThresholdPct),
        shortfallThresholdPct: String(payload.rule.shortfallThresholdPct),
      });
      setMessage("阈值已保存，后续新计算将使用该规则。");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "阈值保存失败");
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteRule(row: WeeklyAmountThresholdManagerRow) {
    setPendingAction(`delete:${row.sc_bu}`);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/settings/weekly-amount-threshold", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scBu: row.sc_bu }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "阈值删除失败");
      if (form.scBu === row.sc_bu) resetForm();
      setMessage(`${row.sc_bu} 已恢复默认 5%/5%。`);
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "阈值删除失败");
    } finally {
      setPendingAction(null);
    }
  }

  const columns: Column<WeeklyAmountThresholdManagerRow>[] = [
    { key: "sc_bu", header: "业务单元" },
    { key: "overage_threshold_pct", header: "超额缩减阈值(%)" },
    { key: "shortfall_threshold_pct", header: "缺口补差阈值(%)" },
    {
      key: "actions",
      header: "操作",
      className: "w-40",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="sm" onClick={() => editRow(row)}>
            <Pencil />
            编辑
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pendingAction !== null}
            onClick={() => deleteRule(row)}
          >
            <Trash2 />
            {pendingAction === `delete:${row.sc_bu}` ? "删除中" : "删除"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <SectionCard title="新增或修改规则" description="规则保存后用于后续新计算批次。">
        <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] lg:items-end">
          <label className="text-sm font-medium">
            业务单元
            <Input
              className="mt-1"
              value={form.scBu}
              onChange={(event) => setForm((current) => ({ ...current, scBu: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium">
            超额缩减阈值(%)
            <Input
              className="mt-1 font-mono"
              type="number"
              min="0"
              max="100"
              step="0.0000000001"
              value={form.overageThresholdPct}
              onChange={(event) => setForm((current) => ({ ...current, overageThresholdPct: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium">
            缺口补差阈值(%)
            <Input
              className="mt-1 font-mono"
              type="number"
              min="0"
              max="100"
              step="0.0000000001"
              value={form.shortfallThresholdPct}
              onChange={(event) => setForm((current) => ({ ...current, shortfallThresholdPct: event.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={pendingAction !== null} onClick={saveRule}>
              <Save />
              {pendingAction === "save" ? "保存中" : "保存规则"}
            </Button>
            <Button type="button" variant="outline" disabled={pendingAction !== null} onClick={resetForm}>
              <RotateCcw />
              清空
            </Button>
          </div>
        </div>
        {message ? (
          <p className={isError ? "mt-3 text-sm text-destructive" : "mt-3 text-sm text-muted-foreground"} aria-live="polite">
            {message}
          </p>
        ) : null}
      </SectionCard>

      <DataTable
        title="阈值明细"
        columns={columns}
        data={rows}
        searchKey="sc_bu"
        searchPlaceholder="搜索业务单元..."
        exportTable="ods_weekly_amount_threshold_manual"
        exportParams={{}}
      />
    </div>
  );
}
