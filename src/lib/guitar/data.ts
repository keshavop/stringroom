import type { ChordDefinition, ChordId, GuitarPreset, PlayableChordId } from "./types";
import { ACOUSTIC_PRESET } from "./instruments";

export const CHORDS: Record<ChordId, ChordDefinition> = {
  Open: { id: "Open", label: "Open strings", key: null },
  C: { id: "C", label: "C major", key: "C" },
  Dm: { id: "Dm", label: "D minor", key: "D" },
  Em: { id: "Em", label: "E minor", key: "E" },
  F: { id: "F", label: "F major", key: "F" },
  G: { id: "G", label: "G major", key: "G" },
  Am: { id: "Am", label: "A minor", key: "A" },
};

export const PLAYABLE_CHORDS: readonly PlayableChordId[] = ["C", "Dm", "Em", "F", "G", "Am"];

export type KeyLayout = "letters" | "home-row" | "numbers";

/** Keyboard key for each chord, in PLAYABLE_CHORDS order, per layout. */
export const KEY_LAYOUTS: Readonly<Record<KeyLayout, { label: string; keys: readonly string[] }>> = {
  letters: { label: "Letters · C D E F G A", keys: ["c", "d", "e", "f", "g", "a"] },
  "home-row": { label: "Home row · A S D F G H", keys: ["a", "s", "d", "f", "g", "h"] },
  numbers: { label: "Numbers · 1 2 3 4 5 6", keys: ["1", "2", "3", "4", "5", "6"] },
};

/** Maps a pressed key (lower case) to its chord for `layout`. */
export function keyMapFor(layout: KeyLayout): Readonly<Record<string, ChordId>> {
  return Object.fromEntries(KEY_LAYOUTS[layout].keys.map((key, index) => [key, PLAYABLE_CHORDS[index]]));
}

/** The default letters layout, where each key names its chord's root. */
export const KEY_TO_CHORD: Readonly<Record<string, ChordId>> = keyMapFor("letters");

/** Frets for `chordId` on `preset`, lowest string first. Open = every string open. */
export function chordShapeFor(chordId: ChordId, preset: GuitarPreset = ACOUSTIC_PRESET): readonly (number | null)[] {
  return chordId === "Open" ? preset.strings.map(() => 0) : preset.chordShapes[chordId];
}

/** MIDI note per string for `chordId` on `preset`; null for muted strings. */
export function resolveChordNotes(chordId: ChordId, preset: GuitarPreset = ACOUSTIC_PRESET): readonly (number | null)[] {
  return chordShapeFor(chordId, preset).map((fret, index) =>
    fret === null ? null : preset.strings[index].openMidi + fret,
  );
}

const PITCH_CLASSES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

export function midiToNoteName(midi: number | null): string {
  if (midi === null) return "Muted";
  const octave = Math.floor(midi / 12) - 1;
  return `${PITCH_CLASSES[midi % 12]}${octave}`;
}

export { ACOUSTIC_PRESET };
