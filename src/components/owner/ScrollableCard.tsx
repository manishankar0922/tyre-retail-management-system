import React from "react";

interface ScrollableCardProps {
  title: string;
  subtitle?: string;
  heightClass?: string; // Default: h-[300px]
  icon?: React.ComponentType<any>;
  iconColor?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export default function ScrollableCard({
  title,
  subtitle,
  heightClass = "h-[300px]",
  icon: Icon,
  iconColor = "text-zinc-400",
  headerAction,
  children
}: ScrollableCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col overflow-hidden h-full">
      {/* Header section */}
      <div className="p-5 border-b border-zinc-150 dark:border-zinc-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />}
          <div className="min-w-0">
            <h3 className="font-extrabold text-sm text-zinc-850 dark:text-zinc-100 truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {headerAction}
      </div>

      {/* Scrollable list content */}
      <div className={`p-5 overflow-y-auto custom-scrollbar flex-1 ${heightClass}`}>
        {children}
      </div>
    </div>
  );
}
