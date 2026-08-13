import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { toBusinessTerm } from "@/lib/business-terminology";

export interface PageIntroBreadcrumbItem {
  label: string;
  href?: string;
}

interface PageIntroProps {
  title: string;
  description?: ReactNode;
  breadcrumbs?: PageIntroBreadcrumbItem[];
  titleClassName?: string;
  descriptionClassName?: string;
}

export function PageIntro({
  title,
  description,
  breadcrumbs = [],
  titleClassName,
  descriptionClassName,
}: PageIntroProps) {
  return (
    <div>
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {breadcrumbs.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href ? (
                <Link href={item.href} className="hover:text-primary">
                  {toBusinessTerm(item.label)}
                </Link>
              ) : (
                <span className="text-foreground font-mono">{toBusinessTerm(item.label)}</span>
              )}
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </div>
          ))}
        </div>
      )}
      <h1 className={cn("text-xl font-bold", titleClassName)}>{toBusinessTerm(title)}</h1>
      {description && (
        <p className={cn("text-sm text-muted-foreground mt-1", descriptionClassName)}>
          {typeof description === "string" ? toBusinessTerm(description) : description}
        </p>
      )}
    </div>
  );
}
