/**
 * How each guitar looks and is described. How it sounds lives in
 * `instruments.ts`; both are keyed by the same GuitarId.
 */
import type { GuitarId } from "./types";

export type { GuitarId };
export type BodyKind = "soundhole" | "single-coil" | "humbucker" | "bass-pickup";

export interface GuitarLook {
  /** Body / top colour behind the strings. */
  body: string;
  /** Fretboard wood. */
  board: string;
  /** Sound-hole rosette colour, when the body has one. */
  rosette: string;
  kind: BodyKind;
  /** String thickness in px, low string first. */
  gauges: readonly number[];
  /** How many of the low strings are wound (drawn in a bronze tone). */
  wound: number;
}

export interface GuitarCatalogEntry {
  id: GuitarId;
  name: string;
  model: string;
  description: string;
  /** Where the sound comes from, for the guitar library. */
  soundSource: string;
  signalChain: string;
  chordShapes: string;
  look: GuitarLook;
}

export const GUITAR_CATALOG: readonly GuitarCatalogEntry[] = [
  {
    id: "acoustic",
    name: "Acoustic",
    model: "Steel-string dreadnought",
    description: "Bright steel strings, full strums",
    soundSource: "Recorded samples · University of Iowa, via tonejs-instruments",
    signalChain: "Dry",
    chordShapes: "Six-string open chords",
    look: { body: "#d3a96e", board: "#3a2417", rosette: "#7a4a22", kind: "soundhole", gauges: [3.2, 2.8, 2.3, 1.9, 1.4, 1.1], wound: 4 },
  },
  {
    id: "twelve",
    name: "12-string",
    model: "Doubled-course acoustic",
    description: "Shimmering, wide, ringing strums",
    soundSource: "The Acoustic samples, each string paired with its octave or unison partner",
    signalChain: "High-shelf sparkle",
    chordShapes: "Six-string open chords",
    look: { body: "#e0be86", board: "#3a2417", rosette: "#1f1f1d", kind: "soundhole", gauges: [3.2, 2.8, 2.3, 1.9, 1.4, 1.1], wound: 4 },
  },
  {
    id: "classical",
    name: "Classical",
    model: "Nylon-string",
    description: "Nylon strings, warm and round",
    soundSource: "Recorded samples · Freesound (quartertone), via tonejs-instruments",
    signalChain: "Low-pass filter to soften the top end",
    chordShapes: "Six-string open chords",
    look: { body: "#c08650", board: "#2c1c14", rosette: "#2f6b52", kind: "soundhole", gauges: [2.8, 2.5, 2.2, 2, 1.7, 1.4], wound: 3 },
  },
  {
    id: "electric",
    name: "Electric",
    model: "Single-coil, clean amp",
    description: "Glassy, clean, quick decay",
    soundSource: "Recorded samples · Karoryfer, via tonejs-instruments",
    signalChain: "Presence boost → speaker cabinet",
    chordShapes: "Six-string open chords",
    look: { body: "#24394a", board: "#c9a46e", rosette: "#000000", kind: "single-coil", gauges: [2.6, 2.3, 1.9, 1.6, 1.2, 1], wound: 3 },
  },
  {
    id: "drive",
    name: "Drive",
    model: "Humbuckers into an overdriven amp",
    description: "Thick, saturated chords",
    soundSource: "The Electric samples, pushed through an amp model",
    signalChain: "High-pass → overdrive → speaker cabinet → low-pass",
    chordShapes: "Six-string open chords, or power chords",
    look: { body: "#161615", board: "#2a1b13", rosette: "#000000", kind: "humbucker", gauges: [2.8, 2.4, 2, 1.6, 1.2, 1], wound: 3 },
  },
  {
    id: "bass",
    name: "Bass",
    model: "Four-string electric",
    description: "Root and fifth under every chord",
    soundSource: "Recorded samples · Karoryfer, via tonejs-instruments",
    signalChain: "Low-shelf boost → compressor",
    chordShapes: "Root and fifth on two strings",
    look: { body: "#6e2a1b", board: "#2e1d14", rosette: "#000000", kind: "bass-pickup", gauges: [4.4, 3.8, 3.2, 2.6], wound: 4 },
  },
  {
    id: "ukulele",
    name: "Ukulele",
    model: "Soprano, re-entrant GCEA",
    description: "Light, bright, four nylon strings",
    soundSource: "Synthesized in your browser (Karplus–Strong plucked string)",
    signalChain: "High-pass filter",
    chordShapes: "Ukulele open chords",
    look: { body: "#a8683a", board: "#2e1d14", rosette: "#4a2a16", kind: "soundhole", gauges: [1.9, 2.3, 2.1, 1.7], wound: 0 },
  },
];

export const WOUND_STRING_COLOR = "#c9b07f";
export const PLAIN_STRING_COLOR = "#eee8dc";

export function getCatalogEntry(id: GuitarId): GuitarCatalogEntry {
  const entry = GUITAR_CATALOG.find((guitar) => guitar.id === id);
  if (!entry) throw new Error(`Unknown guitar: ${id}`);
  return entry;
}

export function isGuitarId(value: string | null | undefined): value is GuitarId {
  return GUITAR_CATALOG.some((guitar) => guitar.id === value);
}
