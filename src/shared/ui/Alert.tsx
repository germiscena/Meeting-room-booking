import React, { type HTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  children,
  ...props
}) => {
  const variants = {
    info: 'bg-blue-50 text-blue-900 border-blue-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    error: 'bg-rose-50 text-rose-900 border-rose-200',
    success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  };

  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-xl border flex flex-col gap-1 text-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {title && <h4 className="font-semibold text-sm leading-tight">{title}</h4>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
};
