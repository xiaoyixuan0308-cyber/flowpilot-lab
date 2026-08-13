import { BookOpen, Clock3, Headset, Mail } from "lucide-react";

const SUPPORT_EMAIL = "support@flowpilot.example";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">帮助与支持</h1>
        <p className="mt-1 text-sm text-muted-foreground">系统使用过程中遇到问题，可通过以下方式获取帮助。</p>
      </div>

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b bg-[linear-gradient(100deg,rgba(37,99,235,0.06),rgba(6,182,212,0.04))] px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headset className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">小肖供应链科技</h2>
            <p className="text-sm text-muted-foreground">FlowPilot 演示支持中心</p>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
            <Clock3 className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-xs text-muted-foreground">支持时间</span>
              <span className="font-medium">工作日 9:00—18:00</span>
            </span>
          </div>

          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.03]">
            <Mail className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">演示支持邮箱</span>
              <span className="block truncate font-medium">{SUPPORT_EMAIL}</span>
            </span>
          </a>

          <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <span>
              <span className="block text-xs text-muted-foreground">使用指南</span>
              <span className="font-medium">平台操作手册</span>
            </span>
            <BookOpen className="size-4 shrink-0 text-primary" />
          </div>
        </div>
        <div className="border-t bg-muted/35 px-5 py-3 text-xs text-muted-foreground">本页面为通用供应链平台演示信息，不包含任何真实企业联系方式。</div>
      </section>
    </div>
  );
}
