import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CircleHelp, ShieldCheck } from "lucide-react";
import "katex/dist/katex.min.css";
import "./globals.css";
import "./platform.css";
import { AppSidebar } from "@/components/layout/sidebar";
import { BackNavigation } from "@/components/layout/back-navigation";
import { UserProfile } from "@/components/layout/user-profile";
import { WorkspaceTabs } from "@/components/layout/workspace-tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ensureStandardDemoData } from "@/server/services/import/ensure-standard-demo-data.service";

export const metadata: Metadata = {
  title: "FlowPilot Lab - 供应链决策平台",
  description: "让供应链先看见，再行动",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await ensureStandardDemoData();
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="min-w-0 flex-1 overflow-auto bg-background">
              <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-background/88 px-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6">
                <SidebarTrigger className="rounded-lg border bg-card shadow-sm" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-tight">供应链决策工作台</div>
                  <div className="hidden text-xs text-muted-foreground sm:block">今天，也让每一次决策更早一步</div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 xl:flex"><ShieldCheck className="size-3.5" />数据链路正常</div>
                  <Link href="/help" aria-label="帮助中心" className="inline-flex size-9 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary"><CircleHelp className="size-4" /></Link>
                  <UserProfile />
                </div>
              </header>
              <Suspense fallback={<div className="h-11 border-b border-border/80 bg-muted/45" />}><WorkspaceTabs /></Suspense>
              <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
                <BackNavigation />
                {children}
              </div>
            </main>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
