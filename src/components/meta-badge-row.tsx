import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

export interface MetaBadgeItem {
  label?: string;
  value: ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
}

interface MetaBadgeRowProps {
  items: MetaBadgeItem[];
}

export function MetaBadgeRow({
  items,
}: MetaBadgeRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.label && <span className="text-sm text-muted-foreground">{item.label}</span>}
          <Badge variant={item.variant ?? "default"}>{item.value}</Badge>
        </div>
      ))}
    </div>
  );
}
