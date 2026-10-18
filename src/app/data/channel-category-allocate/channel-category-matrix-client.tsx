"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ChannelCategoryMatrixRecord {
  id: string;
  period: string;
  dealer_channel_code: string;
  dealer_channel_name: string | null;
  category_code: string;
  category_name: string | null;
  fcst_qty: string;
}

interface ChannelCategoryMatrixClientProps {
  rows: ChannelCategoryMatrixRecord[];
  periodOptions: string[];
  initialPeriod: string;
}

interface MatrixChannelColumn {
  code: string;
  name: string;
  label: string;
}

interface MatrixCategoryRow {
  code: string;
  name: string;
  label: string;
}

const pageSizeOptions = [10, 30, 60, 100];

function formatNumber(value: string) {
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }).format(num);
}

function getChannelLabel(code: string, name: string | null) {
  const safeName = name?.trim();
  return safeName ? `${safeName} (${code})` : code;
}

function getCategoryLabel(code: string, name: string | null) {
  const safeName = name?.trim();
  return safeName ? `${safeName} (${code})` : code;
}

export function ChannelCategoryMatrixClient({
  rows,
  periodOptions,
  initialPeriod,
}: ChannelCategoryMatrixClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [currentPage, setCurrentPage] = useState(1);

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  function handlePeriodChange(value: string | null) {
    setSelectedPeriod(value ?? initialPeriod);
    resetToFirstPage();
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    resetToFirstPage();
  }

  function handlePageSizeChange(value: string | null) {
    setPageSize(Number(value ?? pageSizeOptions[0]));
    resetToFirstPage();
  }

  const periodRows = useMemo(
    () => rows.filter((row) => row.period === selectedPeriod),
    [rows, selectedPeriod]
  );

  const matrix = useMemo(() => {
    const channelMap = new Map<string, MatrixChannelColumn>();
    const categoryMap = new Map<string, MatrixCategoryRow>();
    const qtyMap = new Map<string, string>();

    for (const row of periodRows) {
      if (!channelMap.has(row.dealer_channel_code)) {
        channelMap.set(row.dealer_channel_code, {
          code: row.dealer_channel_code,
          name: row.dealer_channel_name ?? "",
          label: getChannelLabel(row.dealer_channel_code, row.dealer_channel_name),
        });
      }

      if (!categoryMap.has(row.category_code)) {
        categoryMap.set(row.category_code, {
          code: row.category_code,
          name: row.category_name ?? "",
          label: getCategoryLabel(row.category_code, row.category_name),
        });
      }

      const key = `${row.category_code}::${row.dealer_channel_code}`;
      const existing = qtyMap.get(key);
      if (existing === undefined) {
        qtyMap.set(key, row.fcst_qty);
      } else {
        qtyMap.set(key, String(Number(existing) + Number(row.fcst_qty)));
      }
    }

    const channelColumns = Array.from(channelMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "zh-CN")
    );
    const categoryRows = Array.from(categoryMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "zh-CN")
    );

    return { channelColumns, categoryRows, qtyMap };
  }, [periodRows]);

  const searchText = search.trim().toLowerCase();
  const filteredCategoryRows = useMemo(() => {
    if (!searchText) return matrix.categoryRows;
    return matrix.categoryRows.filter(
      (row) =>
        row.code.toLowerCase().includes(searchText) ||
        row.name.toLowerCase().includes(searchText)
    );
  }, [matrix.categoryRows, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredCategoryRows.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = filteredCategoryRows.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCategoryRows.length);
  const visibleCategoryRows = filteredCategoryRows.slice(startIndex, endIndex);
  const filledCellCount = matrix.qtyMap.size;
  const totalCellCount = matrix.channelColumns.length * matrix.categoryRows.length;
  const missingCellCount = Math.max(0, totalCellCount - filledCellCount);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle>渠道-产品分类 动态矩阵</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">月份</span>
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="min-w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((period) => (
                  <SelectItem key={period} value={period}>
                    {period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="搜索 产品分类..."
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>渠道 列数: {matrix.channelColumns.length}</span>
          <span>产品分类 行数: {matrix.categoryRows.length}</span>
          <span>有预测数据: {filledCellCount}</span>
          <span>空白组合: {missingCellCount}</span>
        </div>

        <div className="max-h-[65vh] overflow-auto rounded-lg border">
          <Table className="min-w-max border-separate border-spacing-0">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky left-0 top-0 z-30 min-w-64 border-b border-r bg-muted">
                  产品分类 \ 渠道
                </TableHead>
                {matrix.channelColumns.map((channel) => (
                  <TableHead
                    key={channel.code}
                    title={channel.label}
                    className="sticky top-0 z-20 min-w-40 max-w-48 border-b border-r bg-muted text-right"
                  >
                    <div className="truncate">{channel.name || channel.code}</div>
                    {channel.name && (
                      <div className="truncate text-xs font-normal text-muted-foreground">
                        {channel.code}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleCategoryRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={Math.max(1, matrix.channelColumns.length + 1)}
                    className="py-8 text-center text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                visibleCategoryRows.map((category) => (
                  <TableRow key={category.code}>
                    <TableCell
                      title={category.label}
                      className="sticky left-0 z-10 min-w-64 max-w-72 border-r bg-background font-medium"
                    >
                      <div className="truncate">{category.name || category.code}</div>
                      {category.name && (
                        <div className="truncate text-xs font-normal text-muted-foreground">
                          {category.code}
                        </div>
                      )}
                    </TableCell>
                    {matrix.channelColumns.map((channel) => {
                      const value = matrix.qtyMap.get(`${category.code}::${channel.code}`);

                      return (
                        <TableCell
                          key={`${category.code}-${channel.code}`}
                          className="min-w-40 border-r text-right tabular-nums"
                        >
                          {value === undefined ? "" : formatNumber(value)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>
            显示 {filteredCategoryRows.length === 0 ? 0 : startIndex + 1}-{endIndex} /{" "}
            {filteredCategoryRows.length} 个 产品分类
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
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
