"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A single soft light that drifts slowly over its container.
 * Adapted from Aceternity UI's Spotlight; kept to one light and low opacity
 * so it reads as stage lighting rather than a gradient wash.
 */
export function Spotlight({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -top-56 left-[18%] h-[26rem] w-[40rem] rounded-full bg-accent opacity-[0.07] blur-[90px]",
        className,
      )}
      animate={reduceMotion ? undefined : { x: [0, 60, 0], opacity: [0.06, 0.09, 0.06] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
