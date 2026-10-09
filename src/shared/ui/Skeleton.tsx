import React, { type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export const Skeleton: React.FC<HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200/80', className)}
      {...props}
    />
  );
};
