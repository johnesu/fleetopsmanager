interface SkeletonTableProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 5 }: SkeletonTableProps) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 skeleton flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-4 skeleton w-1/3 mb-4" />
      <div className="h-3 skeleton w-full mb-2" />
      <div className="h-3 skeleton w-2/3 mb-2" />
      <div className="h-3 skeleton w-1/2" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div>
      <div className="flex gap-2 mb-6">
        <div className="h-9 skeleton w-48 rounded-lg" />
        <div className="h-9 skeleton w-28 rounded-lg ml-auto" />
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50">
          <div className="h-3 skeleton flex-1" />
          <div className="h-3 skeleton flex-1" />
          <div className="h-3 skeleton flex-1" />
        </div>
        <SkeletonTable rows={6} cols={6} />
      </div>
    </div>
  );
}