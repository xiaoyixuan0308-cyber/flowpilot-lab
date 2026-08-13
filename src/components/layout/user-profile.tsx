"use client";

import { useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";

export function UserProfile() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button type="button" aria-label="打开个人菜单" onClick={() => setOpen((value) => !value)} className="group flex h-10 items-center gap-2 rounded-xl border border-border/75 bg-card/90 p-1 pr-2 shadow-sm transition hover:border-primary/25 hover:shadow-md">
        <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(145deg,#172554,#2563eb_58%,#06b6d4)] text-xs font-bold tracking-wide text-white shadow-sm">
          XS
          <span className="absolute -bottom-2 -right-2 size-5 rounded-full bg-white/15" />
        </span>
        <span className="hidden text-left lg:block">
          <span className="block text-xs font-semibold leading-4">小肖</span>
          <span className="block text-[10px] leading-3 text-muted-foreground">供应链分析</span>
        </span>
        <ChevronDown className={`hidden size-3.5 text-muted-foreground transition lg:block ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <>
        <button type="button" aria-label="关闭个人菜单" onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
        <div className="absolute right-0 top-12 z-40 w-52 rounded-2xl border bg-popover p-2 shadow-xl">
          <div className="flex items-center gap-3 border-b px-2 py-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-4" /></span>
            <div><div className="text-sm font-semibold">小肖</div><div className="text-xs text-muted-foreground">FlowPilot 工作空间</div></div>
          </div>
          <button type="button" className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted"><Settings className="size-4 text-muted-foreground" />个人设置</button>
          <button type="button" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"><LogOut className="size-4" />退出演示</button>
        </div>
      </>}
    </div>
  );
}
