"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A pill button whose border carries a travelling highlight, adapted from
 * Aceternity UI's Moving Border. Set `animated={false}` once the button no
 * longer needs attention and it settles into a plain outline.
 */
export function MovingBorderButton({
  children,
  animated = true,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; animated?: boolean }) {
  const reduceMotion = useReducedMotion();
  const moving = animated && !reduceMotion;

  return (
    <button
      type="button"
      {...props}
      className={cn(
        "relative isolate inline-flex h-11 items-center justify-center overflow-hidden rounded-full p-px text-sm font-semibold text-fg transition-opacity disabled:cursor-wait disabled:opacity-70",
        animated ? "bg-accent/40" : "bg-edge",
        className,
      )}
    >
      {moving && (
        <motion.span
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 -z-10 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--color-accent)_70deg,transparent_140deg)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        />
      )}
      <span className="flex h-full w-full items-center justify-center gap-2.5 rounded-full bg-ground px-5">
        {children}
      </span>
    </button>
  );
}
