import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PageFeedbackCardProps {
  title: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  size?: "default" | "compact";
  icon?: ReactNode;
  children?: ReactNode;
}

export function PageFeedbackCard({
  title,
  description,
  variant = "default",
  size = "default",
  icon,
  children,
}: PageFeedbackCardProps) {
  const variantClassName = {
    default: "",
    destructive: "border-destructive bg-destructive/5",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
  }[variant];

  const titleClassName = {
    default: "text-muted-foreground",
    destructive: "text-destructive font-medium",
    success: "text-green-700 font-medium",
    warning: "text-yellow-700 font-medium",
  }[variant];

  const contentClassName =
    size === "compact"
      ? "py-4"
      : "py-12 text-center text-muted-foreground";

  return (
    <Card className={variantClassName}>
      <CardContent className={contentClassName}>
        <div className={size === "compact" ? "flex items-center gap-2 mb-2" : ""}>
          {icon}
          <p className={titleClassName}>{title}</p>
        </div>
        {description && <p className="text-sm mt-2">{description}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
