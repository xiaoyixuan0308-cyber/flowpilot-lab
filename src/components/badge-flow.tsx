import { Badge } from "@/components/ui/badge";

interface BadgeFlowProps {
  items: string[];
  highlightFrom?: number;
}

export function BadgeFlow({
  items,
  highlightFrom = items.length,
}: BadgeFlowProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <div key={item} className="flex items-center gap-1">
          <Badge variant={index >= highlightFrom ? "default" : "secondary"}>
            {item}
          </Badge>
          {index < items.length - 1 && <span className="text-muted-foreground">&rarr;</span>}
        </div>
      ))}
    </div>
  );
}
