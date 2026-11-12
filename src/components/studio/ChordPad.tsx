import { CHORDS, KEY_LAYOUTS, PLAYABLE_CHORDS, type KeyLayout } from "@/lib/guitar/data";
import type { ChordId } from "@/lib/guitar/types";
import { cn } from "@/lib/utils";

/** The six chord keys, drawn as keycaps because they map to real keys. */
export function ChordPad({
  activeChord,
  latchedChord,
  onSelect,
  keyLayout = "letters",
  className,
}: {
  activeChord: ChordId;
  latchedChord: ChordId;
  onSelect: (chord: ChordId) => void;
  keyLayout?: KeyLayout;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Chord keys" className={cn("grid grid-cols-3 gap-2 sm:grid-cols-6", className)}>
      {PLAYABLE_CHORDS.map((chord, index) => {
        const active = activeChord === chord;
        const key = KEY_LAYOUTS[keyLayout].keys[index].toUpperCase();
        return (
          <button
            key={chord}
            type="button"
            data-strum-key
            aria-pressed={latchedChord === chord}
            aria-label={`${CHORDS[chord].label} chord, keyboard key ${key}`}
            onClick={() => onSelect(chord)}
            className={cn(
              "flex h-[4.75rem] flex-col items-start justify-between rounded-xl border border-b-4 px-3 py-2.5 transition-[transform,background-color,border-color] duration-150 hover:-translate-y-px",
              active
                ? "border-accent-edge bg-accent text-accent-ink"
                : "border-edge bg-raised text-fg hover:border-edge-strong",
            )}
          >
            <kbd className="font-mono text-xs font-semibold opacity-75">{key}</kbd>
            <span className="text-[22px] font-extrabold font-stretch-semi-expanded">{chord}</span>
          </button>
        );
      })}
    </div>
  );
}
