import { PageIntro } from "@/components/page-intro";
import { UnifiedDataQuery } from "./unified-data-query";

export default function UnifiedDataQueryPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        title="统一数据查询"
        description="按经销商、产品层级或物料查询月拆分与周拆分数据关系。"
        breadcrumbs={[
          { label: "基础数据中心", href: "/data" },
          { label: "统一数据查询" },
        ]}
      />
      <UnifiedDataQuery />
    </div>
  );
}
