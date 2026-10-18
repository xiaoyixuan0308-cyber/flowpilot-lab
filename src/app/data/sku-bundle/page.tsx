import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedSkuBundleRows } from "@/server/repositories";

type Row = {
  id: string;
  sku: string;
  bundle_qty: string;
  source_system: string;
};

const columns: Column<Row>[] = [
  { key: "sku", header: "SKU" },
  { key: "bundle_qty", header: "套包量" },
  { key: "source_system", header: "数据来源" },
];

export default async function SkuBundlePage() {
  const rows = await listLoadedSkuBundleRows();
  const data: Row[] = rows.map((row) => ({ ...row }));

  return (
    <DataPageLayout
      title="SKU套包规则"
      description="维护最终 RRA 向下取整使用的 SKU 套包量；没有记录时有效套包量为 1。"
      actions={<BaseTableActions table="skuBundle" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "SKU数", value: new Set(data.map((row) => row.sku)).size },
      ]}
      statsColumns={2}
      table={{
        title: "SKU套包规则明细",
        columns,
        data,
        searchKey: "sku",
        searchPlaceholder: "搜索SKU...",
        exportTable: "ods_sku_bundle_manual",
        exportParams: {},
      }}
    />
  );
}
