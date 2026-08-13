import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface BadgeInfoListItem {
  badge: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
}

interface BadgeInfoListProps {
  items: BadgeInfoListItem[];
  className?: string;
}

export function BadgeInfoList({
  items,
  className,
}: BadgeInfoListProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 rounded bg-muted/50"
        >
          <Badge variant="outline" className="shrink-0">
            {item.badge}
          </Badge>
          <div className="text-sm">
            {item.title && <div className="font-medium">{item.title}</div>}
            {item.description && (
              <div className={cn(item.title ? "text-muted-foreground mt-1" : "text-muted-foreground")}>
                {item.description}
              </div>
            )}
            {item.extra}
          </div>
        </div>
      ))}
    </div>
  );
}
