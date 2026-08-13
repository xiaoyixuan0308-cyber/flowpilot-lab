"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DataTableToolbar,
  type DataTableToolbarFilter,
  type DataTableToolbarOption,
} from "@/components/data-table/toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResultDimensionFilters,
  type ResultDimensionOption,
  type ResultDimensionValues,
} from "@/components/result-dimension-filters";
import { cn } from "@/lib/utils";
import { toBusinessTerm } from "@/lib/business-terminology";

export interface Column<T> {
  key: string;
  header: string;
  headerDetail?: React.ReactNode;
  headerDetailClassName?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  hrefKey?: keyof T & string;
}

export type DataTableFilterOption = DataTableToolbarOption;

export interface DataTableSearchField<T> {
  key: keyof T & string;
  label: string;
}

export interface DataTableFilterConfig<T> {
  key: keyof T & string;
  label?: string;
  placeholder?: string;
  options?: DataTableFilterOption[];
  sort?: "asc" | "desc";
  includeEmpty?: boolean;
  formatOptionLabel?: (value: string) => string;
  optionLabelKey?: keyof T & string;
}

export interface DataTableProps<T> {
  title: string;
  actions?: React.ReactNode;
  columns: Column<T>[];
  data: T[];
  searchKey?: string;
  searchFields?: DataTableSearchField<T>[];
  searchPlaceholder?: string;
  filterKey?: string;
  filterLabel?: string;
  filterPlaceholder?: string;
  filterOptions?: DataTableFilterOption[];
  filters?: DataTableFilterConfig<T>[];
  /** 导出用的表名，传入后显示导出按钮 */
  exportTable?: string;
  exportParams?: Record<string, string>;
  exportHref?: string;
  exportLabel?: string;
  dimensionFilters?: ResultDimensionFilterConfig<T>;
}

export interface ResultDimensionFilterConfig<T> {
  keys: {
    bu: keyof T & string;
    lp: keyof T & string;
    pl5: keyof T & string;
    upn: keyof T & string;
  };
  labelKeys?: Partial<Record<keyof ResultDimensionValues, keyof T & string>>;
  initialValues?: Partial<ResultDimensionValues>;
}

const pageSizeOptions = [10, 30, 60, 100];
const commonSearchFieldPattern =
  /(code|name|upn|material|customer|sold_to|sapid|date|period|year|month|sloc|division|product_type|sc_bu|currency)/i;

function buildAutoFilterOptions<T extends Record<string, unknown>>(
  rows: T[],
  filter: DataTableFilterConfig<T>,
): DataTableFilterOption[] {
  const labelsByValue = new Map<string, string>();
  for (const row of rows) {
    const rawValue = row[filter.key];
    if (rawValue === null || rawValue === undefined) continue;

    const value = String(rawValue);
    if (!filter.includeEmpty && value.trim() === "") continue;

    const rawLabel = filter.optionLabelKey ? row[filter.optionLabelKey] : null;
    const businessLabel = rawLabel === null || rawLabel === undefined ? "" : String(rawLabel).trim();
    if (!labelsByValue.has(value) || businessLabel) {
      labelsByValue.set(
        value,
        businessLabel && businessLabel !== value ? `${businessLabel}（${value}）` : value,
      );
    }
  }

  const direction = filter.sort === "desc" ? -1 : 1;

  return Array.from(labelsByValue.entries())
    .sort(([a], [b]) => direction * a.localeCompare(b))
    .map(([value, businessLabel]) => ({
      label: filter.formatOptionLabel ? filter.formatOptionLabel(value) : businessLabel,
      value,
    }));
}

export function DataTable<T extends Record<string, unknown>>({
  title,
  actions,
  columns,
  data,
  searchKey,
  searchFields,
  searchPlaceholder = "输入关键词查询...",
  filterKey,
  filterLabel,
  filterPlaceholder = "全部",
  filterOptions = [],
  filters = [],
  exportTable,
  exportParams = {},
  exportHref,
  exportLabel,
  dimensionFilters,
}: DataTableProps<T>) {
  const inferredSearchFields = columns
    .filter(
      (column) =>
        column.key === searchKey ||
        commonSearchFieldPattern.test(column.key) ||
        /(名称|编码|日期|月份|年份|物料|客户|库位|币种)/.test(column.header),
    )
    .map((column) => ({ key: column.key as keyof T & string, label: toBusinessTerm(column.header) }));
  const resolvedSearchFields =
    searchFields && searchFields.length > 0
      ? searchFields
      : inferredSearchFields.length > 0
        ? inferredSearchFields
        : columns.map((column) => ({ key: column.key as keyof T & string, label: toBusinessTerm(column.header) }));
  const hasHeaderDetail = columns.some((column) => column.headerDetail !== undefined);
  const router = useRouter();
  const pathname = usePathname();
  const resolvedFilters = filters.map((filter) => ({
    ...filter,
    options:
      filter.options && filter.options.length > 0
        ? filter.options
        : buildAutoFilterOptions(data, filter),
  }));
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("__all__");
  const [filterValue, setFilterValue] = useState("__all__");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map((filter) => [filter.key, "__all__"])),
  );
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dimensionValues, setDimensionValues] = useState<ResultDimensionValues>({
    bu: dimensionFilters?.initialValues?.bu ?? "",
    lp: dimensionFilters?.initialValues?.lp ?? "",
    pl5: dimensionFilters?.initialValues?.pl5 ?? "",
    upn: dimensionFilters?.initialValues?.upn ?? "",
  });

  function rowMatchesDimensions(
    row: T,
    values: ResultDimensionValues,
    ignoredKey?: keyof ResultDimensionValues,
  ) {
    if (!dimensionFilters) return true;
    return (Object.keys(values) as Array<keyof ResultDimensionValues>).every((key) => {
      if (key === ignoredKey || !values[key]) return true;
      return String(row[dimensionFilters.keys[key]] ?? "") === values[key];
    });
  }

  function buildDimensionOptions(key: keyof ResultDimensionValues): ResultDimensionOption[] {
    if (!dimensionFilters) return [];
    const valueKey = dimensionFilters.keys[key];
    const labelKey = dimensionFilters.labelKeys?.[key];
    const options = new Map<string, string>();

    for (const row of data) {
      if (!rowMatchesDimensions(row, dimensionValues, key)) continue;
      const value = String(row[valueKey] ?? "").trim();
      if (!value) continue;
      const labelValue = labelKey ? String(row[labelKey] ?? "").trim() : "";
      options.set(value, labelValue && labelValue !== value ? `${labelValue} (${value})` : value);
    }

    return [...options.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([value, label]) => ({ value, label }));
  }

  const dimensionCandidates = useMemo(
    () => ({
      bu: buildDimensionOptions("bu"),
      lp: buildDimensionOptions("lp"),
      pl5: buildDimensionOptions("pl5"),
      upn: buildDimensionOptions("upn"),
    }),
    // 数据和三个精确条件变化时重新计算候选范围。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, dimensionFilters, dimensionValues.bu, dimensionValues.lp, dimensionValues.pl5, dimensionValues.upn],
  );

  function updateDimensionValues(nextValues: ResultDimensionValues) {
    setDimensionValues(nextValues);
    resetToFirstPage();

    const params = new URLSearchParams(window.location.search);
    for (const key of ["bu", "lp", "pl5", "upn"] as const) {
      if (nextValues[key]) params.set(key, nextValues[key]);
      else params.delete(key);
    }
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetToFirstPage();
  }

  function handleSearchFieldChange(value: string | null) {
    setSearchField(value ?? "__all__");
    resetToFirstPage();
  }

  function handleFilterChange(value: string | null) {
    setFilterValue(value ?? "__all__");
    resetToFirstPage();
  }

  function handleMultiFilterChange(key: string, value: string | null) {
    setFilterValues((prev) => ({
      ...prev,
      [key]: value ?? "__all__",
    }));
    resetToFirstPage();
  }

  function handlePageSizeChange(value: string | null) {
    setPageSize(Number(value ?? pageSizeOptions[0]));
    resetToFirstPage();
  }

  function resetFilters() {
    setSearch("");
    setSearchField("__all__");
    setFilterValue("__all__");
    setFilterValues(Object.fromEntries(filters.map((filter) => [filter.key, "__all__"])));
    resetToFirstPage();
  }

  const exportSearchParams = new URLSearchParams({
    table: exportTable ?? "",
    ...(exportTable ? { scope: "loaded" } : {}),
    ...exportParams,
  });

  if (search.trim()) {
    exportSearchParams.set(
      "search_key",
      searchField === "__all__"
        ? resolvedSearchFields.map((field) => field.key).join(",")
        : searchField || searchKey || "",
    );
    exportSearchParams.set("search_value", search.trim());
  }

  if (filterKey && filterValue !== "__all__") {
    exportSearchParams.set(filterKey, filterValue);
  }

  for (const filter of resolvedFilters) {
    const selected = filterValues[filter.key];
    if (selected && selected !== "__all__") {
      exportSearchParams.set(filter.key, selected);
    }
  }
  if (dimensionFilters) {
    if (dimensionValues.bu) exportSearchParams.set("sc_bu", dimensionValues.bu);
    if (dimensionValues.lp) exportSearchParams.set("lp_code", dimensionValues.lp);
    if (dimensionValues.pl5) exportSearchParams.set("pl5_code", dimensionValues.pl5);
    if (dimensionValues.upn) exportSearchParams.set("upn", dimensionValues.upn);
  }

  const filtered = data.filter((row) => {
    const normalizedSearch = search.trim().toLowerCase();
    const activeSearchFields =
      searchField === "__all__"
        ? resolvedSearchFields
        : resolvedSearchFields.filter((field) => field.key === searchField);
    const searchMatched =
      !normalizedSearch ||
      activeSearchFields.some((field) => {
        const value = row[field.key];
        return value != null && String(value).toLowerCase().includes(normalizedSearch);
      });

    const filterMatched = filterKey
      ? filterValue === "__all__" || String(row[filterKey] ?? "") === filterValue
      : true;

    const multiFilterMatched = resolvedFilters.every((filter) => {
      const selected = filterValues[filter.key] ?? "__all__";
      return selected === "__all__" || String(row[filter.key] ?? "") === selected;
    });

    const dimensionMatched = rowMatchesDimensions(row, dimensionValues);

    return searchMatched && filterMatched && multiFilterMatched && dimensionMatched;
  });
  const resolvedExportHref =
    exportHref ?? (exportTable ? `/api/data/export?${exportSearchParams.toString()}` : undefined);
  const resolvedExportLabel =
    exportLabel ?? (exportTable ? `导出当前范围（${filtered.length}条）` : undefined);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = filtered.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filtered.length);
  const paginated = filtered.slice(startIndex, endIndex);
  const hasActiveFilters =
    search.trim().length > 0 ||
    searchField !== "__all__" ||
    (filterKey ? filterValue !== "__all__" : false) ||
    Object.values(filterValues).some((value) => value !== "__all__");
  const dimensionFilterNode = dimensionFilters ? (
    <ResultDimensionFilters
      values={dimensionValues}
      candidates={dimensionCandidates}
      onChange={(key, value) =>
        updateDimensionValues({ ...dimensionValues, [key]: value })
      }
      onClearAll={() => updateDimensionValues({ bu: "", lp: "", pl5: "", upn: "" })}
    />
  ) : null;

  return (
    <Card>
      <DataTableToolbar
        title={toBusinessTerm(title)}
        actions={
          actions || dimensionFilterNode ? (
            <div className="flex flex-wrap items-end gap-2">
              {actions}
              {dimensionFilterNode}
            </div>
          ) : undefined
        }
        exportHref={resolvedExportHref}
        exportLabel={resolvedExportLabel}
        search={{
          value: search,
          placeholder: toBusinessTerm(searchPlaceholder),
          onChange: handleSearchChange,
          field: searchField,
          fields: resolvedSearchFields.map((field) => ({
            label: toBusinessTerm(field.label),
            value: field.key,
          })),
          onFieldChange: handleSearchFieldChange,
        }}
        canReset={hasActiveFilters}
        onReset={resetFilters}
        singleFilter={
          filterKey && filterOptions.length > 0
            ? {
                label: filterLabel ? toBusinessTerm(filterLabel) : filterLabel,
                placeholder: filterPlaceholder,
                value: filterValue,
                options: filterOptions,
                onChange: handleFilterChange,
              }
            : undefined
        }
        filters={resolvedFilters.map<DataTableToolbarFilter>((filter) => ({
          key: filter.key,
          label: filter.label ? toBusinessTerm(filter.label) : filter.label,
          placeholder: filter.placeholder,
          value: filterValues[filter.key] ?? "__all__",
          options: filter.options,
          onChange: (value) => handleMultiFilterChange(filter.key, value),
        }))}
      />
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {toBusinessTerm(col.header)}
                </TableHead>
              ))}
            </TableRow>
            {hasHeaderDetail && (
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "h-auto py-2 align-top whitespace-normal",
                      col.headerDetailClassName,
                    )}
                  >
                    <div className="min-h-12">{col.headerDetail}</div>
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, idx) => (
                <TableRow key={startIndex + idx}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? (
                        col.render(row)
                      ) : col.hrefKey && row[col.hrefKey] ? (
                        <a href={String(row[col.hrefKey])} className="text-primary underline">
                          {String(row[col.key] ?? "")}
                        </a>
                      ) : (
                        String(row[col.key] ?? "")
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            显示 {filtered.length === 0 ? 0 : startIndex + 1}-{endIndex} / {filtered.length} 条
            {hasActiveFilters ? "（已筛选）" : ""}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>每页</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              第 {safeCurrentPage} / {totalPages} 页
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, Math.max(1, page) + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
        <div className="hidden">
          共 {filtered.length} 条记录{hasActiveFilters ? " (已筛选)" : ""}
        </div>
      </CardContent>
    </Card>
  );
}


