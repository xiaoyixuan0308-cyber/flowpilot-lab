"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Option = {
  label: string;
  value: string;
};

type OptionRow = {
  channel: string;
  category: string;
  sku: string;
};

interface CalculationExplainQueryFormProps {
  periodMonth: string;
  channelValue: string;
  categoryValue: string;
  skuValue: string;
  sourceValue: string;
  channelOptions: Option[];
  sourceOptions: Option[];
  optionRows: OptionRow[];
  categoryNameByCode: Record<string, string>;
}

function buildOptions(values: string[], labelByValue?: Record<string, string>) {
  return Array.from(new Set(values.filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: labelByValue?.[value] ?? value, value }));
}

export function CalculationExplainQueryForm({
  periodMonth,
  channelValue,
  categoryValue,
  skuValue,
  sourceValue,
  channelOptions,
  sourceOptions,
  optionRows,
  categoryNameByCode,
}: CalculationExplainQueryFormProps) {
  const [channel, setChannel] = useState(channelValue);
  const [category, setCategory] = useState(categoryValue);
  const [sku, setSku] = useState(skuValue);

  const categoryOptions = useMemo(() => {
    const rows = channel ? optionRows.filter((row) => row.channel === channel) : optionRows;
    return buildOptions(
      rows.map((row) => row.category),
      categoryNameByCode
    );
  }, [channel, optionRows, categoryNameByCode]);
  const effectiveCategory = categoryOptions.some((option) => option.value === category) ? category : "";

  const skuOptions = useMemo(() => {
    const rows = optionRows.filter(
      (row) => (!channel || row.channel === channel) && (!effectiveCategory || row.category === effectiveCategory)
    );
    return buildOptions(rows.map((row) => row.sku));
  }, [channel, effectiveCategory, optionRows]);
  const effectiveSku = skuOptions.some((option) => option.value === sku) ? sku : "";

  return (
    <form className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]" action={`/calc/explain/${periodMonth}`}>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">渠道</span>
        <select
          name="channel"
          value={channel}
          onChange={(event) => {
            setChannel(event.target.value);
            setCategory("");
            setSku("");
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">全部渠道</option>
          {channelOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">产品分类</span>
        <select
          name="category"
          value={effectiveCategory}
          onChange={(event) => {
            setCategory(event.target.value);
            setSku("");
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">全部产品分类</option>
          {categoryOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">SKU</span>
        <select
          name="sku"
          value={effectiveSku}
          onChange={(event) => setSku(event.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">全部SKU</option>
          {skuOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted-foreground">基础来源</span>
        <select
          name="source"
          defaultValue={sourceValue}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {sourceOptions.map((option) => (
            <option key={option.value || "__all__"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <Button type="submit">
          <Search />
          查询
        </Button>
      </div>
    </form>
  );
}
