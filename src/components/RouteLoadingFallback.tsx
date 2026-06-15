import { PageContainer } from "./ui/PageContainer";
import {
  PageSkeleton,
  SkeletonBlock,
  SkeletonText,
} from "./PageSkeleton";

export function RouteLoadingFallback() {
  return (
    <PageContainer size="lg" className="ui-page py-8">
      <p className="sr-only" aria-live="polite">
        Laddar innehåll
      </p>
      <PageSkeleton className="space-y-6 p-6">
        <SkeletonText width="w-48" />
        <SkeletonBlock className="h-4 w-full max-w-xl" />
        <SkeletonBlock className="h-4 w-full max-w-lg" />
        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </PageSkeleton>
    </PageContainer>
  );
}

export default RouteLoadingFallback;
