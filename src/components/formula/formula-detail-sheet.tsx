"use client";

import { Info } from "lucide-react";
import { FormulaExpression } from "@/components/formula/formula-expression";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WEEKLY_FORMULA_REGISTRY, type FormulaTrace } from "@/lib/weekly-formula-registry";

export function FormulaDetailSheet({ trace }: { trace: FormulaTrace }) {
  const definition = WEEKLY_FORMULA_REGISTRY[trace.code];

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button type="button" variant="ghost" size="icon-sm" title={`查看 ${trace.code} 公式详情`}>
            <Info className="size-4" />
            <span className="sr-only">{`查看 ${trace.code} 公式详情`}</span>
          </Button>
        }
      />
      <SheetContent className="w-[min(92vw,34rem)] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{`${definition.name} (${trace.code})`}</SheetTitle>
          <SheetDescription>{definition.description}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          <div>
            <div className="mb-2 text-xs text-muted-foreground">完整公式</div>
            <div className="overflow-x-auto rounded-md border bg-muted/30 p-3">
              <FormulaExpression tex={trace.symbolic} displayMode />
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs text-muted-foreground">实际代入</div>
            <div className="overflow-x-auto rounded-md border bg-muted/30 p-3">
              <FormulaExpression tex={trace.substituted} displayMode />
            </div>
          </div>
          <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">正式结果</dt>
            <dd className="font-mono tabular-nums">{trace.result ?? "空"}</dd>
            <dt className="text-muted-foreground">粒度</dt>
            <dd>{trace.granularity}</dd>
            <dt className="text-muted-foreground">执行分支</dt>
            <dd>{trace.branch}</dd>
            <dt className="text-muted-foreground">依赖</dt>
            <dd>{definition.dependencies.join("、")}</dd>
          </dl>
        </div>
      </SheetContent>
    </Sheet>
  );
}
