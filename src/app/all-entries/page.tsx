import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import type { DscNavItem } from "@/lib/dsc-catalog";
import {
  calcPageItems,
  dashboardPageItems,
  dataWorkspacePageItems,
  monthlyInputPageItems,
  monthlyResultPageItems,
  processPageItems,
  tempPageItems,
  weeklyInputPageItems,
  weeklyResultPageItems,
} from "@/lib/dsc-catalog";

const groups: Array<{ title: string; description: string; items: DscNavItem[] }> = [
  { title: "数据工作台", description: "导入、查询与基础数据入口", items: dataWorkspacePageItems },
  { title: "月拆分输入", description: "月拆分所需基础数据", items: monthlyInputPageItems },
  { title: "周拆分输入", description: "周拆分规则与业务数据", items: weeklyInputPageItems },
  {
    title: "计算与结果",
    description: "执行计算并查看正式结果",
    items: [...calcPageItems, ...monthlyResultPageItems, ...weeklyResultPageItems, ...dashboardPageItems],
  },
  { title: "过程数据", description: "查看计算链路与中间结果", items: processPageItems },
  { title: "开发工具", description: "团队临时查看入口", items: tempPageItems },
];

export default function AllEntriesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">您的私域管家</h1>
            <p className="mt-1 text-sm text-muted-foreground">功能总览</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{group.title}</h2>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {group.items.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
            </div>
            <div className="divide-y divide-border/60">
              {group.items.map((item) => (
                <Link
                  key={`${group.title}-${item.href}-${item.title}`}
                  href={item.href}
                  className="group flex min-h-14 items-center justify-between gap-4 px-4 py-3 transition-[background-color,transform] duration-150 hover:bg-muted/40 active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
