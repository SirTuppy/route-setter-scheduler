import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils'

interface VisuallyHiddenProps {
  children: ReactNode;
    className?: string;
}

const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, className }) => {
  return (
    <span
        className={cn(
            "absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [-webkit-clip-path:inset(50%)] clip [clip-path:inset(50%)]",
        className)}
        >
      {children}
    </span>
  );
};

export default VisuallyHidden;