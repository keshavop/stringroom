import type { ChordShape, GuitarId, GuitarPreset, GuitarSample, GuitarString, PlayableChordId } from "./types";

const SIX_STRINGS: readonly GuitarString[] = [
  { id: "low-e", label: "E", openMidi: 40, pan: -0.2 },
  { id: "a", label: "A", openMidi: 45, pan: -0.12 },
  { id: "d", label: "D", openMidi: 50, pan: -0.04 },
  { id: "g", label: "G", openMidi: 55, pan: 0.04 },
  { id: "b", label: "B", openMidi: 59, pan: 0.12 },
  { id: "high-e", label: "E", openMidi: 64, pan: 0.2 },
];

const BASS_STRINGS: readonly GuitarString[] = [
  { id: "e", label: "E", openMidi: 28, pan: -0.06 },
  { id: "a", label: "A", openMidi: 33, pan: -0.02 },
  { id: "d", label: "D", openMidi: 38, pan: 0.02 },
  { id: "g", label: "G", openMidi: 43, pan: 0.06 },
];

/** Re-entrant tuning: the G string is tuned above C. */
const UKULELE_STRINGS: readonly GuitarString[] = [
  { id: "g", label: "G", openMidi: 67, pan: -0.15 },
  { id: "c", label: "C", openMidi: 60, pan: -0.05 },
  { id: "e", label: "E", openMidi: 64, pan: 0.05 },
  { id: "a", label: "A", openMidi: 69, pan: 0.15 },
];

/** Open-position guitar chords. */
const SIX_STRING_SHAPES: Readonly<Record<PlayableChordId, ChordShape>> = {
  C: [null, 3, 2, 0, 1, 0],
  Dm: [null, null, 0, 2, 3, 1],
  Em: [0, 2, 2, 0, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  Am: [null, 0, 2, 2, 1, 0],
};

/** Root and fifth on two adjacent strings, rooted as low as the neck allows. */
const BASS_SHAPES: Readonly<Record<PlayableChordId, ChordShape>> = {
  C: [null, 3, 5, null],
  Dm: [null, 5, 7, null],
  Em: [0, 2, null, null],
  F: [1, 3, null, null],
  G: [3, 5, null, null],
  Am: [null, 0, 2, null],
};

const UKULELE_SHAPES: Readonly<Record<PlayableChordId, ChordShape>> = {
  C: [0, 0, 0, 3],
  Dm: [2, 2, 1, 0],
  Em: [0, 4, 3, 2],
  F: [2, 0, 1, 0],
  G: [0, 2, 3, 2],
  Am: [2, 0, 0, 0],
};

/**
 * Two- and three-string power chords (root, fifth, octave). Minor chords
 * become their root's power chord, since power chords have no third.
 */
const POWER_CHORD_SHAPES: Readonly<Record<PlayableChordId, ChordShape>> = {
  C: [null, 3, 5, 5, null, null],
  Dm: [null, 5, 7, 7, null, null],
  Em: [0, 2, 2, null, null, null],
  F: [1, 3, 3, null, null, null],
  G: [3, 5, 5, null, null, null],
  Am: [null, 0, 2, 2, null, null],
};

const NOTE_OFFSETS: Record<string, number> = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };

/** Builds sample entries from tonejs-instruments file names such as "As1" or "Ds3". */
export function samplesFromNotes(notes: readonly string[]): GuitarSample[] {
  return notes.map((note) => {
    const match = /^([A-G]s?)(\d)$/.exec(note);
    if (!match) throw new Error(`Unrecognised sample note: ${note}`);
    const midi = 12 * (Number(match[2]) + 1) + NOTE_OFFSETS[match[1]];
    return { note, midi, file: `${note}.mp3` };
  });
}

export const ACOUSTIC_PRESET: GuitarPreset = {
  id: "acoustic",
  name: "Acoustic",
  strings: SIX_STRINGS,
  chordShapes: SIX_STRING_SHAPES,
  voice: {
    kind: "samples",
    sampleBasePath: "/audio/acoustic",
    samples: samplesFromNotes(["E2", "A2", "D3", "G3", "A3", "C4", "E4", "A4"]),
  },
  gain: 1,
  release: 3.6,
  effects: [],
};

export const INSTRUMENTS: Readonly<Record<GuitarId, GuitarPreset>> = {
  acoustic: ACOUSTIC_PRESET,
  twelve: {
    ...ACOUSTIC_PRESET,
    id: "twelve",
    name: "12-string",
    gain: 0.78,
    release: 4,
    // Low four courses pair with a string an octave up; B and high E are unisons.
    courses: { octaveOffsets: [12, 12, 12, 12, 0, 0], detuneCents: 7 },
    effects: [{ type: "filter", filter: "highshelf", frequency: 3500, gain: 2 }],
  },
  classical: {
    id: "classical",
    name: "Classical",
    strings: SIX_STRINGS,
    chordShapes: SIX_STRING_SHAPES,
    voice: {
      kind: "samples",
      sampleBasePath: "/audio/classical",
      samples: samplesFromNotes(["E2", "A2", "D3", "G3", "B3", "E4", "A4"]),
    },
    gain: 1.05,
    release: 3.2,
    effects: [{ type: "filter", filter: "lowpass", frequency: 4200, q: 0.5 }],
  },
  electric: {
    id: "electric",
    name: "Electric",
    strings: SIX_STRINGS,
    chordShapes: SIX_STRING_SHAPES,
    voice: {
      kind: "samples",
      sampleBasePath: "/audio/electric",
      samples: samplesFromNotes(["E2", "A2", "C3", "Ds3", "Fs3", "A3", "C4", "Ds4", "Fs4", "A4"]),
    },
    gain: 0.95,
    release: 2.6,
    effects: [{ type: "filter", filter: "peaking", frequency: 2400, q: 0.8, gain: 3 }, { type: "cabinet" }],
  },
  drive: {
    id: "drive",
    name: "Drive",
    strings: SIX_STRINGS,
    chordShapes: SIX_STRING_SHAPES,
    voice: {
      kind: "samples",
      sampleBasePath: "/audio/electric",
      samples: samplesFromNotes(["E2", "A2", "C3", "Ds3", "Fs3", "A3", "C4", "Ds4", "Fs4", "A4"]),
    },
    gain: 0.42,
    release: 3,
    powerChordShapes: POWER_CHORD_SHAPES,
    effects: [
      { type: "filter", filter: "highpass", frequency: 110, q: 0.7 },
      { type: "distortion", drive: 0.65 },
      { type: "cabinet" },
      { type: "filter", filter: "lowpass", frequency: 5200, q: 0.6 },
      { type: "gain", gain: 0.28 },
    ],
  },
  bass: {
    id: "bass",
    name: "Bass",
    strings: BASS_STRINGS,
    chordShapes: BASS_SHAPES,
    voice: {
      kind: "samples",
      sampleBasePath: "/audio/bass",
      samples: samplesFromNotes(["E1", "G1", "As1", "Cs2", "E2", "G2", "As2"]),
    },
    gain: 1.1,
    release: 2.8,
    effects: [
      { type: "filter", filter: "lowshelf", frequency: 120, gain: 3 },
      { type: "compressor", threshold: -18, ratio: 4 },
    ],
  },
  ukulele: {
    id: "ukulele",
    name: "Ukulele",
    strings: UKULELE_STRINGS,
    chordShapes: UKULELE_SHAPES,
    voice: { kind: "pluck-synth", brightness: 0.55, decaySeconds: 1.8 },
    gain: 0.8,
    release: 1.8,
    effects: [{ type: "filter", filter: "highpass", frequency: 180, q: 0.7 }],
  },
};

export function getPreset(id: GuitarId): GuitarPreset {
  return INSTRUMENTS[id];
}

export const DEFAULT_VOLUME = 0.72;

/** `preset` playing power chords instead of its usual shapes, when it has them. */
export function withPowerChords(preset: GuitarPreset): GuitarPreset {
  return preset.powerChordShapes ? { ...preset, chordShapes: preset.powerChordShapes } : preset;
}

/** Chord symbol shown while playing power chords: Dm → D5. */
export function powerChordName(chord: PlayableChordId): string {
  return `${chord.replace("m", "")}5`;
}
