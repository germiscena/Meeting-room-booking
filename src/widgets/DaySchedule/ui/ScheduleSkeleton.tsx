import React from 'react';
import { Skeleton } from '@/shared/ui';

export const ScheduleSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-8 w-28" />
      </div>

      {/* Timeline skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>

      {/* List items skeleton */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
};
