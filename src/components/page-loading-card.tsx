import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingCardProps {
  rows?: number;
}

export function PageLoadingCard({
  rows = 3,
}: PageLoadingCardProps) {
  return (
    <Card>
      <CardContent className="py-6 space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton
            key={index}
            className={index === 0 ? "h-4 w-3/4" : index === 1 ? "h-4 w-1/2" : "h-4 w-2/3"}
          />
        ))}
      </CardContent>
    </Card>
  );
}
