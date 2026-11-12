"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A grid where hovering one card softly blurs the others, adapted from
 * Aceternity UI's Focus Cards. Each card's content is supplied by the caller.
 */
export function FocusCards<T extends { id: string }>({
  items,
  renderCard,
  className,
}: {
  items: readonly T[];
  renderCard: (item: T) => ReactNode;
  className?: string;
}) {
  const [focused, setFocused] = useState<string | null>(null);

  return (
    <ul
      className={cn("grid grid-cols-[repeat(auto-fit,minmax(17.5rem,1fr))] gap-4", className)}
      onMouseLeave={() => setFocused(null)}
    >
      {items.map((item) => (
        <li
          key={item.id}
          onMouseEnter={() => setFocused(item.id)}
          className={cn(
            "transition-[filter,opacity,transform] duration-300 ease-out",
            focused !== null && focused !== item.id && "scale-[0.985] opacity-70 blur-[2px]",
          )}
        >
          {renderCard(item)}
        </li>
      ))}
    </ul>
  );
}
