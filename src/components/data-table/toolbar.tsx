"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronDown,
  Download,
  ListFilter,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DataTableToolbarOption {
  label: string;
  value: string;
}

export interface DataTableToolbarFilter {
  key: string;
  label?: string;
  placeholder?: string;
  value: string;
  options: DataTableToolbarOption[];
  onChange: (value: string | null) => void;
}

interface DataTableToolbarProps {
  title: string;
  actions?: React.ReactNode;
  exportHref?: string;
  exportLabel?: string;
  search?: {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    field: string;
    fields: DataTableToolbarOption[];
    onFieldChange: (value: string | null) => void;
  };
  canReset?: boolean;
  onReset?: () => void;
  singleFilter?: {
    label?: string;
    placeholder: string;
    value: string;
    options: DataTableToolbarOption[];
    onChange: (value: string | null) => void;
  };
  filters?: DataTableToolbarFilter[];
}

export function DataTableToolbar({
  title,
  actions,
  exportHref,
  exportLabel,
  search,
  singleFilter,
  filters = [],
  canReset = false,
  onReset,
}: DataTableToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [
    ...(singleFilter && singleFilter.value !== "__all__"
      ? [
          {
            key: "__single__",
            label: singleFilter.label ?? "筛选",
            value:
              singleFilter.options.find((option) => option.value === singleFilter.value)?.label ??
              singleFilter.value,
          },
        ]
      : []),
    ...filters
      .filter((filter) => filter.value !== "__all__")
      .map((filter) => ({
        key: filter.key,
        label: filter.label ?? "筛选",
        value:
          filter.options.find((option) => option.value === filter.value)?.label ?? filter.value,
      })),
  ];
  const hasSelectableFilters =
    Boolean(singleFilter && singleFilter.options.length > 0) || filters.length > 0;

  return (
    <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
      <CardHeader className="gap-3 border-b bg-muted/10 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <CardTitle className="shrink-0 whitespace-nowrap text-lg">{title}</CardTitle>
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 xl:justify-end">
            {actions}
        {search && (
          <div className="flex min-w-64 flex-1 items-center rounded-lg border bg-background shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 xl:max-w-xl">
            {search.fields.length > 1 && (
              <Select value={search.field} onValueChange={search.onFieldChange}>
                <SelectTrigger
                  aria-label="查询字段"
                  className="w-36 shrink-0 rounded-r-none border-0 border-r bg-muted/30 shadow-none focus-visible:ring-0"
                >
                  <SelectValue>
                    {search.field === "__all__"
                      ? "全部关键字段"
                      : search.fields.find((field) => field.value === search.field)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部关键字段</SelectItem>
                  {search.fields.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative min-w-36 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="查询关键词"
                placeholder={search.placeholder}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="rounded-l-none border-0 pl-8 shadow-none focus-visible:ring-0"
              />
            </div>
          </div>
        )}
            {hasSelectableFilters && (
              <CollapsibleTrigger
                render={
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 bg-background" />
                }
              >
                <ListFilter className="h-4 w-4" />
                筛选条件
                {activeFilters.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
                    {activeFilters.length}
                  </span>
                )}
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")}
                />
              </CollapsibleTrigger>
            )}
            {exportHref && (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={(props) => (
                  <a href={exportHref} download {...props}>
                    <Download className="mr-1 h-4 w-4" />
                    {exportLabel ?? "导出"}
                  </a>
                )}
              />
            )}
        {canReset && onReset && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            重置
          </Button>
        )}
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted-foreground">已选</span>
            {activeFilters.map((filter) => (
              <Badge key={filter.key} variant="secondary" className="font-normal">
                {filter.label}：{filter.value}
              </Badge>
            ))}
          </div>
        )}

        {hasSelectableFilters && (
          <CollapsibleContent className="overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0">
            <div className="mt-1 grid gap-3 rounded-xl border bg-background p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
              {singleFilter && singleFilter.options.length > 0 && (
                <FilterSelect
                  label={singleFilter.label}
                  placeholder={singleFilter.placeholder}
                  value={singleFilter.value}
                  options={singleFilter.options}
                  onChange={singleFilter.onChange}
                />
              )}
              {filters.map((filter) => (
                <FilterSelect
                  key={filter.key}
                  label={filter.label}
                  placeholder={filter.placeholder ?? "全部"}
                  value={filter.value}
                  options={filter.options}
                  onChange={filter.onChange}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </CardHeader>
    </Collapsible>
  );
}

function FilterSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label?: string;
  placeholder: string;
  value: string;
  options: DataTableToolbarOption[];
  onChange: (value: string | null) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label ?? "筛选条件"}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder={placeholder}>
            {value === "__all__"
              ? placeholder
              : options.find((option) => option.value === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
