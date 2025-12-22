// components/ext-transfer/transfer-token-skeleton.tsx: Skeleton grid for token loading state.
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type TokenSkeletonProps = {
  count?: number;
};

export default function TransferTokenSkeleton({ count = 12 }: TokenSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={`token-skeleton-${index}`}
          className="group overflow-hidden rounded-3xl border-zinc-200/70 bg-white"
        >
          <CardContent className="flex flex-col gap-3 p-3">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
