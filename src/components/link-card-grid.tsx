import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export interface LinkCardItem {
  title: string;
  href: string;
  description: string;
}

interface LinkCardGridProps {
  items: LinkCardItem[];
}

export function LinkCardGrid({
  items,
}: LinkCardGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Card className="h-full cursor-pointer gap-0 border border-border/70 bg-background/55 py-0 shadow-none ring-0 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:bg-card group-hover:shadow-md">
            <CardHeader className="gap-2.5 p-4">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
              <CardDescription className="line-clamp-2 text-xs leading-5">
                {item.description}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
