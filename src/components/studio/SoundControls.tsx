"use client";

import { MovingBorderButton } from "@/components/ui/moving-border";
import type { AudioStatus } from "@/lib/guitar/types";
import { cn } from "@/lib/utils";

const SOUND_LABEL: Record<AudioStatus, string> = {
  idle: "Enable sound",
  loading: "Loading guitar…",
  ready: "Sound on",
  error: "Try sound again",
};

export function SoundButton({ status, onEnable }: { status: AudioStatus; onEnable: () => void }) {
  const needsAttention = status === "idle" || status === "error";
  return (
    <MovingBorderButton
      animated={needsAttention}
      onClick={onEnable}
      disabled={status === "loading"}
      aria-live="polite"
      className="w-full"
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          status === "ready" ? "bg-led shadow-[0_0_10px_var(--color-led)]" : "bg-accent shadow-[0_0_10px_var(--color-accent)]",
          status === "loading" && "animate-pulse",
        )}
      />
      {SOUND_LABEL[status]}
    </MovingBorderButton>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {muted ? (
        <path d="m17 9 4 6m0-6-4 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path
          d="M16 9.2c1.3 1.55 1.3 4.05 0 5.6M18.7 7c2.45 2.75 2.45 7.25 0 10"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function VolumeControl({
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
}: {
  volume: number;
  muted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}) {
  const percent = Math.round(volume * 100);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={muted ? "Unmute guitar" : "Mute guitar"}
        aria-pressed={muted}
        onClick={onToggleMute}
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-full border transition-colors",
          muted ? "border-accent text-accent" : "border-edge text-fg-soft hover:border-edge-strong",
        )}
      >
        <SpeakerIcon muted={muted} />
      </button>
      <label htmlFor="volume" className="font-mono text-xs tracking-[0.12em] text-dim">
        VOL
      </label>
      <input
        id="volume"
        type="range"
        min="0"
        max="100"
        value={percent}
        onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
        className="min-w-0 flex-1 cursor-pointer"
      />
      <span className="w-9 text-right font-mono text-[13px] text-muted">{percent}</span>
    </div>
  );
}
