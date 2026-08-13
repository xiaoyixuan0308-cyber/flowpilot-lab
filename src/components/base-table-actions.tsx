"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImportSheetDefinitionByTable, type ImportSheetTable } from "@/server/constants/import-sheet-map";

interface BaseTableActionsProps {
  table?: ImportSheetTable;
}

interface ImportResponse {
  totalRows?: number;
  errorRows?: number;
  importedSheets?: string[];
  errors?: string[];
  error?: string;
}

interface ImportFeedback {
  tone: "default" | "warning" | "destructive" | "success";
  lines: string[];
}

const DUPLICATE_BU_PATTERN_ERROR =
  /duplicate key detected: period_week=([^,;]+), sc_bu=([^;]+); Excel rows (\d+) and (\d+)/i;

function buildDefaultErrorFeedback(message: string): ImportFeedback {
  return {
    tone: "destructive",
    lines: [message],
  };
}

function buildBuPatternDuplicateFeedback(message: string): ImportFeedback | null {
  const matched = message.match(DUPLICATE_BU_PATTERN_ERROR);
  if (!matched) return null;

  const [, periodWeek, scBu, firstRow, secondRow] = matched;

  return {
    tone: "warning",
    lines: [
      "业务单元周/月预算存在重复键，当前无法导入。",
      `同一周次与业务单元只能保留 1 条记录：${periodWeek} / ${scBu}`,
      `请检查 Excel 第 ${firstRow} 行和第 ${secondRow} 行，合并为该周该业务单元唯一的预算输入。`,
    ],
  };
}

function buildImportFeedback(table: ImportSheetTable | undefined, response: ImportResponse): ImportFeedback | null {
  const definition = getImportSheetDefinitionByTable(table ?? null);
  const label = definition?.label ?? "统一整包";

  if (response.errors?.length) {
    const duplicateFeedback =
      table === "buPatternAmountWeekly" || !table
        ? response.errors.map(buildBuPatternDuplicateFeedback).find((item): item is ImportFeedback => Boolean(item))
        : null;

    if (duplicateFeedback) {
      return duplicateFeedback;
    }

    return {
      tone: response.importedSheets?.length ? "warning" : "destructive",
      lines: response.errors,
    };
  }

  if (response.totalRows !== undefined) {
    return {
      tone: "success",
      lines: [
        `${label} 导入完成：${response.totalRows} 行`,
        ...(response.importedSheets ?? []),
      ],
    };
  }

  return null;
}

export function BaseTableActions({ table }: BaseTableActionsProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setFeedback(buildDefaultErrorFeedback("仅支持 Excel 工作簿（.xlsx）。请先在 Excel 中将文件另存为 .xlsx 格式后再导入。"));
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("file", file);
    if (table) {
      formData.append("table", table);
    }

    try {
      const response = await fetch("/api/data/import", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ImportResponse;

      if (!response.ok) {
        throw new Error(result.error ?? "导入失败");
      }

      setFeedback(buildImportFeedback(table, result));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      const duplicateFeedback =
        table === "buPatternAmountWeekly" || !table ? buildBuPatternDuplicateFeedback(message) : null;
      setFeedback(duplicateFeedback ?? buildDefaultErrorFeedback(message));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={(props) => (
          <a href={table ? `/api/data/template?table=${table}` : "/api/data/template"} download {...props}>
            <Download className="h-4 w-4" />
            {table ? "下载模板" : "下载统一整包模板"}
          </a>
        )}
      />
      {!table ? (
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={(props) => (
            <a href="/api/data/export-package" download {...props}>
              <Download className="h-4 w-4" />
              下载统一整包数据
            </a>
          )}
        />
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {isUploading ? "导入中..." : table ? "导入数据" : "导入统一整包"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChange}
      />
      {feedback ? (
        <div
          className={`basis-full text-sm ${
            feedback.tone === "destructive"
              ? "text-destructive"
              : feedback.tone === "warning"
                ? "text-yellow-700"
                : feedback.tone === "success"
                  ? "text-green-700"
                  : "text-muted-foreground"
          }`}
        >
          {feedback.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
