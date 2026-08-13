"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BellRing,
  Calculator,
  ChevronDown,
  CircleX,
  ClipboardList,
  Database,
  Home,
  Layers3,
  PieChart,
  Search,
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { toBusinessTerm } from "@/lib/business-terminology";
import {
  calcPageItems,
  dashboardPageItems,
  dataWorkspacePageItems,
  monthlyInputPageItems,
  monthlyResultPageItems,
  processPageItems,
  tempPageItems,
  weeklyCalculationPageItems,
  weeklyInputPageItems,
  weeklyResultPageItems,
} from "@/lib/dsc-catalog";

type NavEntry = { title: string; href: string };
type NavGroup = { title: string; icon: typeof Home; href?: string; items?: NavEntry[] };

const asEntries = (items: { title: string; href: string }[]) => items.map(({ title, href }) => ({ title, href }));

const menuItems: NavGroup[] = [
  { title: "供应链驾驶舱", icon: Home, href: "/" },
  { title: "数据中心", icon: Database, items: asEntries([...dataWorkspacePageItems, ...monthlyInputPageItems, ...weeklyInputPageItems]) },
  { title: "补货计划与执行", icon: Calculator, items: asEntries([...calcPageItems, ...weeklyCalculationPageItems]) },
  { title: "异常中心", icon: BellRing, href: "/exceptions" },
  { title: "分析与结果", icon: PieChart, items: asEntries([...monthlyResultPageItems, ...weeklyResultPageItems, ...dashboardPageItems]) },
  { title: "计算追溯", icon: Layers3, items: asEntries(processPageItems) },
  { title: "开发与校验", icon: ClipboardList, items: asEntries(tempPageItems) },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const activeGroup = menuItems.find((group) => group.items?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)))?.title;
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([activeGroup ?? "数据中心"]));
  const normalizedQuery = query.trim().toLowerCase();
  const visibleGroups = useMemo(() => {
    if (!normalizedQuery) return menuItems;
    return menuItems.map((group) => ({ ...group, items: group.items?.filter((item) => `${group.title} ${item.title}`.toLowerCase().includes(normalizedQuery)) }))
      .filter((group) => group.title.toLowerCase().includes(normalizedQuery) || group.href || (group.items?.length ?? 0) > 0);
  }, [normalizedQuery]);

  function toggleGroup(title: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }

  return (
    <Sidebar className="border-r border-sidebar-border/70 bg-sidebar/96">
      <SidebarHeader className="space-y-4 border-b border-sidebar-border/70 px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--primary),color-mix(in_oklab,var(--primary)_72%,#14b8a6))] text-primary-foreground shadow-md shadow-primary/20"><BarChart3 className="size-5" /></div>
          <div className="min-w-0"><div className="truncate text-sm font-semibold tracking-wide">FlowPilot</div><div className="truncate text-xs text-sidebar-foreground/55">供应链智能决策平台</div></div>
        </Link>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/45" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索页面或业务数据" className="h-10 w-full rounded-xl border border-sidebar-border bg-background/80 pl-9 pr-9 text-sm outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/8" />
          {query && <button type="button" aria-label="清空搜索" onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-sidebar-foreground/45 hover:bg-sidebar-accent"><CircleX className="size-4" /></button>}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3 [scrollbar-width:thin]">
        <nav className="space-y-1">
          {visibleGroups.map((group) => {
            const active = group.href === pathname || group.items?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
            const open = normalizedQuery ? true : openGroups.has(group.title);
            return <div key={group.title} className="rounded-xl">
              {group.items ? (
                <button type="button" aria-expanded={open} onClick={() => toggleGroup(group.title)} className={`flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}>
                  <group.icon className="size-4" /><span className="flex-1 text-left">{toBusinessTerm(group.title)}</span><ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              ) : (
                <Link href={group.href!} className={`flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-primary/10 text-primary" : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}><group.icon className="size-4" />{toBusinessTerm(group.title)}</Link>
              )}
              {group.items && open && <div className="mt-1 space-y-0.5 pl-6">
                {group.items.map((item, index) => <Link key={`${item.href}-${index}`} href={item.href} className={`group flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition ${pathname === item.href ? "bg-primary/8 font-medium text-primary" : "text-sidebar-foreground/68 hover:bg-sidebar-accent/80 hover:text-sidebar-foreground"}`}><span className="min-w-0 flex-1 truncate">{toBusinessTerm(item.title)}</span></Link>)}
              </div>}
            </div>;
          })}
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/70 p-3 text-[11px] text-sidebar-foreground/45">通用供应链演示版 · V1.0</SidebarFooter>
    </Sidebar>
  );
}




