/**
 * The player's library: saved progressions, per-guitar volume and preferences.
 * Pure functions only — storage lives in `store.ts`, so this file can be
 * unit tested and later reused to sync the same shape to an account.
 */
import type { KeyLayout } from "@/lib/guitar/data";
import type { GuitarId, PlayableChordId } from "@/lib/guitar/types";

export type { KeyLayout };

export interface Progression {
  id: string;
  name: string;
  guitarId: GuitarId;
  bpm: number;
  beatsPerChord: number;
  chords: PlayableChordId[];
  updatedAt: number;
}

export interface Preferences {
  /** Mirror the neck so the headstock sits on the right. */
  leftHanded: boolean;
  keyLayout: KeyLayout;
  /** 0–100; 50 is the default response to sweep speed. */
  strumSensitivity: number;
  /** Guitar the studio opens with when the URL names none. */
  defaultGuitar: GuitarId;
  /** Drive plays root–fifth power chords instead of full chords. */
  powerChords: boolean;
}

export interface Library {
  version: 1;
  progressions: Progression[];
  volumes: Partial<Record<GuitarId, number>>;
  preferences: Preferences;
}

export const LIMITS = {
  bpm: { min: 40, max: 200 },
  beatsPerChord: { min: 1, max: 8 },
  chords: { max: 16 },
  name: { max: 60 },
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  leftHanded: false,
  keyLayout: "letters",
  strumSensitivity: 50,
  defaultGuitar: "acoustic",
  powerChords: false,
};

export const EMPTY_LIBRARY: Library = {
  version: 1,
  progressions: [],
  volumes: {},
  preferences: DEFAULT_PREFERENCES,
};

const GUITAR_IDS: readonly GuitarId[] = ["acoustic", "twelve", "classical", "electric", "drive", "bass", "ukulele"];
const CHORD_IDS: readonly PlayableChordId[] = ["C", "Dm", "Em", "F", "G", "Am"];
const KEY_LAYOUTS: readonly KeyLayout[] = ["letters", "home-row", "numbers"];

const isGuitar = (value: unknown): value is GuitarId => GUITAR_IDS.includes(value as GuitarId);
const isChord = (value: unknown): value is PlayableChordId => CHORD_IDS.includes(value as PlayableChordId);

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim().slice(0, LIMITS.name.max) : "";
  return name || "Untitled progression";
}

/** Normalises a progression so every field is in range. Returns null if it is unusable. */
export function sanitizeProgression(value: unknown): Progression | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || raw.id.length === 0) return null;
  const chords = Array.isArray(raw.chords) ? raw.chords.filter(isChord).slice(0, LIMITS.chords.max) : [];
  if (chords.length === 0) return null;
  return {
    id: raw.id,
    name: cleanName(raw.name),
    guitarId: isGuitar(raw.guitarId) ? raw.guitarId : "acoustic",
    bpm: clampInt(raw.bpm, LIMITS.bpm.min, LIMITS.bpm.max, 96),
    beatsPerChord: clampInt(raw.beatsPerChord, LIMITS.beatsPerChord.min, LIMITS.beatsPerChord.max, 4),
    chords,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}

/** Reads stored JSON tolerantly: anything malformed falls back to defaults rather than throwing. */
export function parseLibrary(json: string | null): Library {
  if (!json) return EMPTY_LIBRARY;
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return EMPTY_LIBRARY;
  }
  if (!raw || typeof raw !== "object") return EMPTY_LIBRARY;
  const data = raw as Record<string, unknown>;

  const progressions = Array.isArray(data.progressions)
    ? data.progressions.map(sanitizeProgression).filter((p): p is Progression => p !== null)
    : [];

  const volumes: Library["volumes"] = {};
  if (data.volumes && typeof data.volumes === "object") {
    for (const [id, volume] of Object.entries(data.volumes)) {
      if (isGuitar(id) && typeof volume === "number" && Number.isFinite(volume)) {
        volumes[id] = Math.min(1, Math.max(0, volume));
      }
    }
  }

  const prefs = (data.preferences && typeof data.preferences === "object" ? data.preferences : {}) as Record<string, unknown>;
  const preferences: Preferences = {
    leftHanded: prefs.leftHanded === true,
    keyLayout: KEY_LAYOUTS.includes(prefs.keyLayout as KeyLayout) ? (prefs.keyLayout as KeyLayout) : "letters",
    strumSensitivity: clampInt(prefs.strumSensitivity, 0, 100, 50),
    defaultGuitar: isGuitar(prefs.defaultGuitar) ? prefs.defaultGuitar : "acoustic",
    powerChords: prefs.powerChords === true,
  };

  return { version: 1, progressions, volumes, preferences };
}

export function newProgression(id: string, now: number, guitarId: GuitarId = "acoustic"): Progression {
  return { id, name: "New progression", guitarId, bpm: 96, beatsPerChord: 4, chords: ["C", "G", "Am", "F"], updatedAt: now };
}

/** Inserts or replaces a progression (newest first). Invalid progressions are ignored. */
export function saveProgression(library: Library, progression: Progression, now: number): Library {
  const clean = sanitizeProgression({ ...progression, updatedAt: now });
  if (!clean) return library;
  const others = library.progressions.filter((p) => p.id !== clean.id);
  return { ...library, progressions: [clean, ...others] };
}

export function deleteProgression(library: Library, id: string): Library {
  return { ...library, progressions: library.progressions.filter((p) => p.id !== id) };
}

export function setGuitarVolume(library: Library, guitarId: GuitarId, volume: number): Library {
  return { ...library, volumes: { ...library.volumes, [guitarId]: Math.min(1, Math.max(0, volume)) } };
}

export function updatePreferences(library: Library, patch: Partial<Preferences>): Library {
  return parseLibrary(JSON.stringify({ ...library, preferences: { ...library.preferences, ...patch } }));
}

/** How long one chord lasts, in milliseconds. */
export function chordDurationMs(progression: Pick<Progression, "bpm" | "beatsPerChord">): number {
  return (60_000 / progression.bpm) * progression.beatsPerChord;
}
