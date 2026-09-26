import React from 'react';

interface StepHeaderProps {
  n: number;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function StepHeader({ n, title, description, action }: StepHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] text-sm font-semibold flex items-center justify-center tabular-nums">
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[#0F172A] leading-7">{title}</h2>
          {description && <p className="text-xs text-[#64748B] leading-snug">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export default React.memo(StepHeader);
