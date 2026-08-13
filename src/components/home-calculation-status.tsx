"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CirclePlay, Clock3 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type HomeStatus = {
  calendarDate: string;
  availableDates: string[];
  status: string;
  anomalyCount: number;
  calculatedAt: string | null;
  dataAvailable: boolean;
  monthlyResultAvailable: boolean;
  weeklyResultAvailable: boolean;
};

const initialStatus: HomeStatus = {
  calendarDate: "",
  availableDates: [],
  status: "LOADING",
  anomalyCount: 0,
  calculatedAt: null,
  dataAvailable: false,
  monthlyResultAvailable: false,
  weeklyResultAvailable: false,
};

function formatTime(value: string | null) {
  if (!value) return "暂无计算记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function HomeCalculationStatus() {
  const [summary, setSummary] = useState(initialStatus);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");

  const loadStatus = useCallback(async (calendarDate?: string) => {
    const query = calendarDate
      ? `?calendarDate=${encodeURIComponent(calendarDate)}`
      : "";
    const response = await fetch(`/api/calc/home-status${query}`, { cache: "no-store" });
    if (!response.ok) throw new Error("状态读取失败");
    const data = (await response.json()) as HomeStatus;
    setSummary(data);
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/calc/home-status", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Status request failed");
        return response.json() as Promise<HomeStatus>;
      })
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch(() => active && setSummary((current) => ({ ...current, status: "UNAVAILABLE" })))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const statusView = useMemo(() => {
    if (loading) {
      return { label: "正在读取计算状态", detail: "请稍候", tone: "text-muted-foreground", icon: Clock3 };
    }
    if (summary.status === "SUCCESS" && summary.anomalyCount === 0) {
      return { label: "计算成功，可以查看结果", detail: `最近计算：${formatTime(summary.calculatedAt)}`, tone: "text-emerald-700", icon: CheckCircle2 };
    }
    if (summary.status === "PARTIAL" || summary.anomalyCount > 0) {
      return { label: `计算完成，发现 ${summary.anomalyCount} 项异常`, detail: "建议先查看异常明细", tone: "text-amber-700", icon: AlertTriangle };
    }
    if (summary.status === "FAILED") {
      return { label: "计算失败，请重新计算", detail: `最近计算：${formatTime(summary.calculatedAt)}`, tone: "text-destructive", icon: AlertTriangle };
    }
    if (summary.status === "UNAVAILABLE") {
      return { label: "暂时无法读取计算状态", detail: "请检查数据库连接", tone: "text-destructive", icon: AlertTriangle };
    }
    return { label: "该基准日还没有计算结果", detail: "请先运行计算", tone: "text-amber-700", icon: Clock3 };
  }, [loading, summary]);

  const StatusIcon = statusView.icon;
  const calculationHref = summary.calendarDate
    ? `/calc/upn-split?calendarDate=${encodeURIComponent(summary.calendarDate)}`
    : "/calc/upn-split";

  async function selectCalendarDate(calendarDate: string) {
    setLoading(true);
    setSummary((current) => ({ ...current, calendarDate }));
    setSaveError("");
    try {
      const response = await fetch("/api/calc/runtime-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarDate }),
      });
      if (!response.ok) throw new Error("保存失败");
    } catch {
      setSaveError("当前选择将在进入计算页后使用");
    }

    try {
      await loadStatus(calendarDate);
    } catch {
      setSummary((current) => ({ ...current, status: "UNAVAILABLE" }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">计算与结果</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">查看计算状态与结果</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">计算基准日</span>
          <select
            aria-label="计算基准日"
            value={summary.calendarDate}
            onChange={(event) => selectCalendarDate(event.target.value)}
            disabled={loading || summary.availableDates.length === 0}
            className="h-9 max-w-40 rounded-lg border bg-background px-2.5 text-xs font-medium text-foreground outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:opacity-55"
          >
            {summary.availableDates.length === 0 ? <option value="">暂无可选日期</option> : null}
            {summary.availableDates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3 border-b bg-muted/25 px-4 py-3.5">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-background shadow-sm ${statusView.tone}`}>
          <StatusIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-semibold ${statusView.tone}`}>{statusView.label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{saveError || statusView.detail}</div>
        </div>
        <Link
          href={calculationHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-primary/90 active:scale-[0.97]"
        >
          <CirclePlay className="size-3.5" />
          {summary.status === "SUCCESS" ? "重新计算" : "开始计算"}
        </Link>
      </div>

      <div className="grid grid-cols-2 divide-x">
        {summary.monthlyResultAvailable ? (
          <Link href="/calc/results" className="group flex items-center justify-between gap-2 px-4 py-3.5 transition-[background-color,transform] duration-150 hover:bg-muted/40 active:scale-[0.99]">
            <span className="text-sm font-medium">月度补货建议</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              查看结果
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2 px-4 py-3.5 text-muted-foreground">
            <span className="text-sm font-medium">月度补货建议</span>
            <span className="text-xs">暂无结果</span>
          </div>
        )}
        {summary.weeklyResultAvailable ? (
          <Link href="/calc/weekly-results" className="group flex items-center justify-between gap-2 px-4 py-3.5 transition-[background-color,transform] duration-150 hover:bg-muted/40 active:scale-[0.99]">
            <span className="text-sm font-medium">周度发货建议</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              查看结果
              <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-2 px-4 py-3.5 text-muted-foreground">
            <span className="text-sm font-medium">周度发货建议</span>
            <span className="text-xs">暂无结果</span>
          </div>
        )}
      </div>
    </section>
  );
}
