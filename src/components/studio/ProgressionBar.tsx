"use client";

import Link from "next/link";
import type { Progression } from "@/lib/library/model";
import { cn } from "@/lib/utils";

/** Shows a saved progression above the neck and steps through it while playing. */
export function ProgressionBar({
  progression,
  playing,
  step,
  beat,
  onToggle,
  onClose,
}: {
  progression: Progression;
  playing: boolean;
  /** Index of the chord being played. */
  step: number;
  /** Beat within the current chord, 0-based. */
  beat: number;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[18px] border border-line bg-panel px-4 py-3">
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? `Stop ${progression.name}` : `Play ${progression.name}`}
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full transition-colors",
          playing ? "bg-fg text-ground" : "bg-accent text-accent-ink hover:bg-[#ff8d3a]",
        )}
      >
        {playing ? (
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" rx="1.5" fill="currentColor" /></svg>
        ) : (
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M3.5 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.4 1.7a.6.6 0 0 0-.9.5Z" fill="currentColor" /></svg>
        )}
      </button>

      <div className="min-w-36">
        <p className="font-semibold">{progression.name}</p>
        <p className="font-mono text-xs text-dim">
          {progression.bpm} BPM · {progression.beatsPerChord} beats each
        </p>
      </div>

      <ol aria-label="Chords" className="flex flex-1 flex-wrap gap-1.5">
        {progression.chords.map((chord, index) => {
          const current = playing && index === step;
          return (
            <li
              key={index}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex min-w-14 flex-col gap-1 rounded-lg border border-b-[3px] px-2.5 py-1.5",
                current ? "border-accent-edge bg-accent text-accent-ink" : "border-edge bg-raised",
              )}
            >
              <span className="text-[15px] font-extrabold font-stretch-semi-expanded">{chord}</span>
              <span aria-hidden="true" className="flex gap-0.5">
                {Array.from({ length: progression.beatsPerChord }, (_, b) => (
                  <span
                    key={b}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      current && b <= beat ? "bg-accent-ink" : current ? "bg-accent-ink/25" : "bg-edge",
                    )}
                  />
                ))}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 text-sm">
        <Link href="/library" className="text-muted transition-colors hover:text-fg">
          Edit
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close progression"
          className="grid size-9 place-items-center rounded-full border border-edge text-muted transition-colors hover:text-fg"
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m2 2 8 8M10 2l-8 8" /></svg>
        </button>
      </div>
    </div>
  );
}
