"use client";

import { HelpCircle } from "lucide-react";

interface FieldTooltipProps {
  content: string;
}

export function FieldTooltip({ content }: FieldTooltipProps) {
  return (
    <span className="relative inline-flex group ml-1 align-middle">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-popover text-popover-foreground text-xs rounded-md shadow-md border border-border invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 pointer-events-none leading-relaxed">
        {content}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
      </span>
    </span>
  );
}
