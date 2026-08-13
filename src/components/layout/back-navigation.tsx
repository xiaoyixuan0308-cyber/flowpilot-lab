"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const HOME_RETURN_PATHS = new Set(["/help", "/all-entries"]);

export function BackNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") return null;

  const returnsHome = HOME_RETURN_PATHS.has(pathname);

  function navigateBack() {
    if (returnsHome || window.history.length <= 1) {
      router.push("/");
      return;
    }
    router.back();
  }

  return (
    <button
      type="button"
      onClick={navigateBack}
      className="mb-4 inline-flex h-10 items-center gap-2 rounded-lg border border-sky-200 bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-[border-color,background-color,transform] duration-150 hover:border-sky-300 hover:bg-sky-50/60 active:scale-[0.97]"
    >
      <ArrowLeft className="size-4" />
      {returnsHome ? "返回首页" : "返回上一页"}
    </button>
  );
}
