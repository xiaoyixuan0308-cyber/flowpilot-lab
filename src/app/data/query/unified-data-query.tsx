"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { SectionCard } from "@/components/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchType = "channel" | "category" | "sku";
type TableType = "monthly" | "weekly";

type QueryRow = {
  channel_code: string;
  channel_name: string;
  category_code: string;
  category_name: string;
  sku: string;
  source: string;
};

type QueryResponse = {
  total?: number;
  rows?: Array<{
    channel_code: string;
    channel_name: string | null;
    category_code: string;
    category_name: string | null;
    sku: string;
    source: string;
  }>;
  error?: string;
};

const columns: Column<QueryRow>[] = [
  { key: "channel_name", header: "经销商名称" },
  { key: "channel_code", header: "经销商编码" },
  { key: "category_name", header: "产品分类名称" },
  { key: "category_code", header: "产品分类编码" },
  { key: "sku", header: "SKU" },
  { key: "source", header: "数据范围" },
];

const searchTypes: Array<{ value: SearchType; label: string; placeholder: string }> = [
  { value: "channel", label: "经销商（渠道）", placeholder: "输入经销商名称或编码" },
  { value: "category", label: "产品层级（产品分类）", placeholder: "输入 产品分类 名称或编码" },
  { value: "sku", label: "物料（SKU）", placeholder: "输入 SKU 编码" },
];

export function UnifiedDataQuery() {
  const [table, setTable] = useState<TableType>("monthly");
  const [type, setType] = useState<SearchType>("channel");
  const [keyword, setKeyword] = useState("");
  const [rows, setRows] = useState<QueryRow[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedType = searchTypes.find((item) => item.value === type) ?? searchTypes[0];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = keyword.trim();
    if (!query) {
      setError("请输入查询关键词");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ q: query, type, table });
      const response = await fetch(`/api/search/hierarchy?${params.toString()}`);
      const payload = (await response.json()) as QueryResponse;

      if (!response.ok) {
        throw new Error(payload.error || "查询失败");
      }

      setRows(
        (payload.rows ?? []).map((row) => ({
          channel_code: row.channel_code,
          channel_name: row.channel_name ?? "",
          category_code: row.category_code,
          category_name: row.category_name ?? "",
          sku: row.sku,
          source: row.source === "monthly" ? "月拆分" : "周拆分",
        })),
      );
      setHasSearched(true);
    } catch (queryError) {
      setRows([]);
      setHasSearched(true);
      setError(queryError instanceof Error ? queryError.message : "查询失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SectionCard title="查询条件">
        <form
          className="grid gap-4 lg:grid-cols-[auto_13rem_minmax(16rem,1fr)_auto] lg:items-end"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <span className="text-sm font-medium">数据范围</span>
            <div className="inline-flex rounded-md border bg-muted/30 p-1">
              <Button
                type="button"
                size="sm"
                variant={table === "monthly" ? "secondary" : "ghost"}
                onClick={() => setTable("monthly")}
              >
                月拆分
              </Button>
              <Button
                type="button"
                size="sm"
                variant={table === "weekly" ? "secondary" : "ghost"}
                onClick={() => setTable("weekly")}
              >
                周拆分
              </Button>
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium">查询对象</span>
            <Select value={type} onValueChange={(value) => setType(value as SearchType)}>
              <SelectTrigger className="w-full">
                <SelectValue>{selectedType.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {searchTypes.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">关键词</span>
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={selectedType.placeholder}
            />
          </label>

          <Button type="submit" disabled={loading}>
            <Search />
            {loading ? "查询中" : "查询"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </SectionCard>

      {hasSearched && (
        <DataTable<QueryRow>
          title={`查询结果（${rows.length}）`}
          columns={columns}
          data={rows}
          searchPlaceholder="在当前结果中继续筛选"
          filters={[
            {
              key: "channel_code",
              label: "经销商",
              placeholder: "全部经销商",
              optionLabelKey: "channel_name",
            },
            {
              key: "category_code",
              label: "产品分类",
              placeholder: "全部产品分类",
              optionLabelKey: "category_name",
            },
          ]}
        />
      )}
    </>
  );
}
