import type { ReactNode } from "react";

export const SkeletonBlock = ({ className = "" }: { className?: string }) => (
  <div className={`rounded skeleton-shimmer ${className}`} aria-hidden="true" />
);

export const SkeletonCircle = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-full skeleton-shimmer-circle ${className}`} aria-hidden="true" />
);

export const SkeletonText = ({ width = "w-32" }: { width?: string }) => (
  <SkeletonBlock className={`h-[0.875rem] ${width}`} />
);

export const SkeletonLabel = ({ width = "w-20" }: { width?: string }) => (
  <SkeletonBlock className={`h-3 ${width}`} />
);

export const SkeletonInput = () => (
  <SkeletonBlock className="h-10 w-full" />
);

export const SkeletonFieldPair = () => (
  <div className="flex flex-col gap-2">
    <SkeletonLabel />
    <SkeletonInput />
  </div>
);

export const SkeletonFieldRow = ({ cols = 2 }: { cols?: 1 | 2 | 3 }) => {
  const colClass =
    cols === 3
      ? "grid-cols-1 md:grid-cols-3"
      : cols === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1";
  return (
    <div className={`grid gap-4 ${colClass}`}>
      {Array.from({ length: cols }, (_, i) => (
        <SkeletonFieldPair key={i} />
      ))}
    </div>
  );
};

export const PageSkeleton = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={`ui-card ${className}`}
    aria-busy="true"
    aria-label="Laddar innehåll"
  >
    {children}
  </div>
);
