export type ChordId = "Open" | "C" | "Dm" | "Em" | "F" | "G" | "Am";
export type PlayableChordId = Exclude<ChordId, "Open">;

export type GuitarId = "acoustic" | "twelve" | "classical" | "electric" | "drive" | "bass" | "ukulele";

export type AudioStatus = "idle" | "loading" | "ready" | "error";

/** Frets from the lowest string to the highest. null represents a muted string. */
export type ChordShape = readonly (number | null)[];

export interface GuitarString {
  id: string;
  label: string;
  openMidi: number;
  pan: number;
}

export interface ChordDefinition {
  id: ChordId;
  label: string;
  key: string | null;
}

export interface GuitarSample {
  note: string;
  midi: number;
  file: string;
}

export type GuitarVoice =
  | { kind: "samples"; sampleBasePath: string; samples: readonly GuitarSample[] }
  /** Plucked-string synthesis (Karplus–Strong); `brightness` 0–1, `decaySeconds` to near silence. */
  | { kind: "pluck-synth"; brightness: number; decaySeconds: number };

export type GuitarEffect =
  | { type: "filter"; filter: BiquadFilterType; frequency: number; q?: number; gain?: number }
  /** Soft-clipping overdrive; `drive` 0–1. */
  | { type: "distortion"; drive: number }
  /** Speaker-cabinet response approximated with band-limiting filters. */
  | { type: "cabinet" }
  | { type: "compressor"; threshold: number; ratio: number }
  /** Output trim, e.g. after distortion, which always comes out near full scale. */
  | { type: "gain"; gain: number };

export interface GuitarPreset {
  id: GuitarId;
  name: string;
  /** Lowest string first. Four or six strings. */
  strings: readonly GuitarString[];
  chordShapes: Readonly<Record<PlayableChordId, ChordShape>>;
  voice: GuitarVoice;
  /** Output trim so every guitar sits at a similar loudness. */
  gain: number;
  /** Seconds for a note to fade out. */
  release: number;
  /**
   * Paired strings (12-string guitars): each string also sounds a partner
   * `octaveOffsets[i]` semitones away, detuned slightly for shimmer.
   */
  courses?: { octaveOffsets: readonly number[]; detuneCents: number };
  /** Alternative shapes the player can switch to, e.g. power chords on Drive. */
  powerChordShapes?: Readonly<Record<PlayableChordId, ChordShape>>;
  effects: readonly GuitarEffect[];
}
