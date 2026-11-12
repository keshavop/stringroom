"use client";

import { motion } from "motion/react";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";

export interface AnimatedTab<T extends string> {
  id: T;
  label: string;
  disabled?: boolean;
  /** Shown as a tooltip and to screen readers, e.g. "Coming soon". */
  note?: string;
}

/**
 * Pill tabs with a sliding active indicator, adapted from Aceternity UI's
 * Animated Tabs. Uses the WAI-ARIA tablist pattern without panels: selecting
 * a tab changes the instrument shown above it.
 */
export function AnimatedTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
}: {
  tabs: readonly AnimatedTab<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  className?: string;
}) {
  const indicatorId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const enabled = tabs.filter((tab) => !tab.disabled);

  // Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern); Tab
  // leaves the list, since only the selected tab is in the tab order.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const current = enabled.findIndex((tab) => tab.id === value);
    const last = enabled.length - 1;
    const next =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? current >= last ? 0 : current + 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? current <= 0 ? last : current - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null || enabled.length === 0) return;
    event.preventDefault();
    const tab = enabled[next];
    onChange(tab.id);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${tab.id}"]`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn("flex flex-wrap gap-1 rounded-full border border-line bg-panel p-1", className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-id={tab.id}
            tabIndex={active ? 0 : -1}
            aria-selected={active}
            aria-disabled={tab.disabled || undefined}
            title={tab.note}
            onClick={() => {
              if (!tab.disabled) onChange(tab.id);
            }}
            className={cn(
              "relative rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
              active ? "text-ground" : "text-muted hover:text-fg",
              tab.disabled && "cursor-not-allowed text-dim hover:text-dim",
            )}
          >
            {active && (
              <motion.span
                layoutId={indicatorId}
                className="absolute inset-0 rounded-full bg-fg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative">{tab.label}</span>
            {tab.note && <span className="sr-only">, {tab.note}</span>}
          </button>
        );
      })}
    </div>
  );
}
