"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Home, MoreHorizontal, X } from "lucide-react";
import {
  calcPageItems, dashboardPageItems, dataWorkspacePageItems, monthlyInputPageItems,
  monthlyResultPageItems, processPageItems, tempPageItems, weeklyCalculationPageItems,
  weeklyInputPageItems, weeklyResultPageItems,
} from "@/lib/dsc-catalog";
import { toBusinessTerm } from "@/lib/business-terminology";

type WorkspaceTab = { key: string; href: string; title: string };
const STORAGE_KEY = "flowpilot-workspace-tabs-v1";
const HOME_TAB: WorkspaceTab = { key: "/", href: "/", title: "驾驶舱" };
const catalog = [
  ...dataWorkspacePageItems, ...monthlyInputPageItems, ...weeklyInputPageItems, ...calcPageItems,
  ...weeklyCalculationPageItems, ...monthlyResultPageItems, ...weeklyResultPageItems,
  ...dashboardPageItems, ...processPageItems, ...tempPageItems,
];
const fixedTitles: Record<string, string> = { "/exceptions": "异常中心", "/help": "帮助中心" };

function titleForPath(pathname: string) {
  if (pathname === "/") return HOME_TAB.title;
  if (fixedTitles[pathname]) return fixedTitles[pathname];
  const exact = catalog.find((item) => item.href === pathname);
  if (exact) return toBusinessTerm(exact.title);
  const resultDate = pathname.match(/^\/calc\/weekly-results\/([^/]+)/);
  if (resultDate) return `周结果 ${decodeURIComponent(resultDate[1])}`;
  const processDate = pathname.match(/^\/calc\/weekly-process\/([^/]+)/);
  if (processDate) return `周计算 ${decodeURIComponent(processDate[1])}`;
  const segment = decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) ?? "业务页面");
  return toBusinessTerm(segment.replaceAll("-", " "));
}

function loadTabs(): WorkspaceTab[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return [HOME_TAB];
    const parsed = JSON.parse(stored) as WorkspaceTab[];
    return [HOME_TAB, ...parsed.filter((tab) => tab?.key && tab.key !== "/").slice(-14)];
  } catch { return [HOME_TAB]; }
}

export function WorkspaceTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tabs, setTabs] = useState<WorkspaceTab[]>([HOME_TAB]);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const href = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => { setTabs(loadTabs()); setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    setTabs((current) => {
      const nextTab = { key: pathname, href, title: titleForPath(pathname) };
      const existing = current.findIndex((tab) => tab.key === pathname);
      let next = existing >= 0
        ? current.map((tab, index) => index === existing ? nextTab : tab)
        : [...current, nextTab];
      if (next.length > 15) next = [HOME_TAB, ...next.filter((tab) => tab.key !== "/").slice(-14)];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, [href, pathname, ready]);
  useEffect(() => { activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }, [pathname, tabs.length]);

  function persist(next: WorkspaceTab[]) {
    setTabs(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  function closeTab(key: string) {
    if (key === "/") return;
    const index = tabs.findIndex((tab) => tab.key === key);
    const next = tabs.filter((tab) => tab.key !== key);
    persist(next);
    if (key === pathname) router.push(next[Math.max(0, index - 1)]?.href ?? "/");
  }
  function closeOthers() {
    const active = tabs.find((tab) => tab.key === pathname);
    persist(active && active.key !== "/" ? [HOME_TAB, active] : [HOME_TAB]);
    setMenuOpen(false);
  }
  function closeAll() {
    persist([HOME_TAB]);
    setMenuOpen(false);
    router.push("/");
  }

  return (
    <div className="relative z-10 flex h-11 min-w-0 items-end border-b border-border/80 bg-muted/45 px-3 sm:px-5">
      <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = tab.key === pathname;
          return (
            <div key={tab.key} className={`group relative flex h-9 max-w-52 shrink-0 items-center rounded-t-lg border border-b-0 text-xs transition-all ${active ? "border-border bg-background font-semibold text-primary shadow-[0_-3px_12px_rgba(15,23,42,0.04)]" : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/65 hover:text-foreground"}`}>
              {active && <span className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary" />}
              <Link ref={active ? activeRef : undefined} href={tab.href} title={tab.title} className="flex min-w-0 items-center gap-2 py-2 pl-3 pr-2">
                {tab.key === "/" ? <Home className="size-3.5 shrink-0" /> : <span className={`size-1.5 shrink-0 rounded-full ${active ? "bg-primary" : "bg-muted-foreground/35"}`} />}
                <span className="truncate">{tab.title}</span>
              </Link>
              {tab.key !== "/" && <button type="button" aria-label={`关闭${tab.title}`} onClick={() => closeTab(tab.key)} className="mr-2 rounded p-0.5 opacity-45 transition hover:bg-muted hover:opacity-100 group-hover:opacity-100"><X className="size-3.5" /></button>}
            </div>
          );
        })}
      </div>
      <div className="relative ml-2 flex h-full shrink-0 items-center border-l border-border/70 pl-2">
        <button type="button" aria-label="页签管理" onClick={() => setMenuOpen((value) => !value)} className="flex h-7 items-center gap-0.5 rounded-md border bg-background px-2 text-muted-foreground shadow-sm transition hover:border-primary/30 hover:text-primary"><MoreHorizontal className="size-4" /><ChevronDown className="size-3" /></button>
        {menuOpen && <><button type="button" aria-label="关闭页签菜单" className="fixed inset-0 z-30 cursor-default" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-9 z-40 w-40 overflow-hidden rounded-xl border bg-popover p-1.5 text-sm shadow-xl">
            <button type="button" onClick={() => closeTab(pathname)} disabled={pathname === "/"} className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">关闭当前页签</button>
            <button type="button" onClick={closeOthers} className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted">关闭其他页签</button>
            <button type="button" onClick={closeAll} className="w-full rounded-lg px-3 py-2 text-left hover:bg-muted">关闭全部页签</button>
          </div></>}
      </div>
    </div>
  );
}
