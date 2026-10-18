import type { ExportTableName } from "@/server/constants/export-table-map";

export interface ExportRequest {
  table: ExportTableName;
  scope?: string | null;
  batchId?: string | null;
  calendarDate?: string | null;
  searchKey?: string | null;
  searchValue?: string | null;
  businessUnit?: string | null;
  channelCode?: string | null;
  categoryCode?: string | null;
  sku?: string | null;
  isError?: string | null;
  errorMessage?: string | null;
  periodMonth?: string | null;
  status?: string | null;
  hasQuota?: string | null;
  hasHistory?: string | null;
  year?: string | null;
  month?: string | null;
  abcClass?: string | null;
  tolerance?: string | null;
}
