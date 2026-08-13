import type { Column } from "@/components/data-table";
import { BaseTableActions } from "@/components/base-table-actions";
import { DataPageLayout } from "@/components/data-page-layout";
import { listLoadedLpUpnPurchasePriceRows } from "@/server/repositories";

type Row = {
  id: string;
  dealer_code: string;
  dealer_type: string;
  upn: string;
  bsc_std_sell_price: string;
  bsc_std_sell_price_vat: string;
  source_sell_price: string;
  source_sell_price_vat: string;
  source_currency: string;
  usd_to_cny_rate: string;
};

const columns: Column<Row>[] = [
  { key: "dealer_code", header: "经销商编码" },
  { key: "dealer_type", header: "经销商类型" },
  { key: "upn", header: "SKU" },
  { key: "source_sell_price", header: "原始不含税价" },
  { key: "source_sell_price_vat", header: "原始含税价" },
  { key: "source_currency", header: "输入币种" },
  { key: "usd_to_cny_rate", header: "导入汇率(1 USD=CNY)" },
  { key: "bsc_std_sell_price", header: "不含税价(USD)" },
  { key: "bsc_std_sell_price_vat", header: "含税价(USD)" },
];

export default async function LpUpnPurchasePricePage() {
  const rows = await listLoadedLpUpnPurchasePriceRows();
  const data: Row[] = rows.map((row) => ({
    id: row.id,
    dealer_code: row.dealer_code,
    dealer_type: row.dealer_type,
    upn: row.upn,
    bsc_std_sell_price: row.bsc_std_sell_price ?? "",
    bsc_std_sell_price_vat: row.bsc_std_sell_price_vat ?? "",
    source_sell_price: row.source_sell_price ?? "",
    source_sell_price_vat: row.source_sell_price_vat ?? "",
    source_currency: row.source_currency,
    usd_to_cny_rate: row.usd_to_cny_rate,
  }));
  const dealerCount = Array.from(new Set(data.map((row) => row.dealer_code))).length;
  const upnCount = Array.from(new Set(data.map((row) => row.upn))).length;

  return (
    <DataPageLayout
      title="Dealer SKU单价"
      description="保存各经销商类型的 USD/CNY 单价；当前周拆分金额公式只使用 LP 类型的不含税 USD 单价。"
      actions={<BaseTableActions table="lpUpnPurchasePrice" />}
      statsItems={[
        { label: "总记录数", value: data.length },
        { label: "经销商数", value: dealerCount },
        { label: "SKU数", value: upnCount },
      ]}
      statsColumns={3}
      table={{
        title: "Dealer SKU单价明细",
        columns,
        data,
        searchKey: "upn",
        searchPlaceholder: "搜索SKU...",
        exportTable: "ods_lp_upn_purchase_price",
        exportParams: {},
      }}
    />
  );
}
