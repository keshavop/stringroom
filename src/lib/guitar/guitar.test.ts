import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KEY_TO_CHORD, chordShapeFor, resolveChordNotes } from "./data";
import { distortionCurve, karplusStrong, midiToFrequency } from "./dsp";
import { INSTRUMENTS, powerChordName, samplesFromNotes, withPowerChords } from "./instruments";
import { getCrossedStringIndexes, velocityFromPointerMovement } from "./interaction";
import { NECK_END_PERCENT, NUT_PERCENT, fingerPosition, fretPosition, stringPositions } from "./fretboard";
import { GUITAR_CATALOG } from "./catalog";
import type { ChordId, GuitarId } from "./types";

describe("guitar chord voicings", () => {
  const voicings: readonly [ChordId, readonly (number | null)[]][] = [
    ["Open", [40, 45, 50, 55, 59, 64]],
    ["C", [null, 48, 52, 55, 60, 64]],
    ["Dm", [null, null, 50, 57, 62, 65]],
    ["Em", [40, 47, 52, 55, 59, 64]],
    ["F", [41, 48, 53, 57, 60, 65]],
    ["G", [43, 47, 50, 55, 59, 67]],
    ["Am", [null, 45, 52, 57, 60, 64]],
  ];

  for (const [chord, expected] of voicings) {
    it(`resolves ${chord}`, () => {
      assert.deepEqual(resolveChordNotes(chord), expected);
    });
  }

  it("maps beginner chord keys", () => {
    assert.deepEqual(KEY_TO_CHORD, { c: "C", d: "Dm", e: "Em", f: "F", g: "G", a: "Am" });
  });
});

describe("pointer strumming", () => {
  const strings = [46, 100, 154, 208, 262, 316];

  it("returns strings in downward crossing order", () => {
    assert.deepEqual(getCrossedStringIndexes(20, 180, strings, [0, 0, 0, 0, 0, 0], 100), [0, 1, 2]);
  });

  it("returns strings in upward crossing order", () => {
    assert.deepEqual(getCrossedStringIndexes(290, 80, strings, [0, 0, 0, 0, 0, 0], 100), [4, 3, 2, 1]);
  });

  it("debounces a recently triggered string", () => {
    assert.deepEqual(getCrossedStringIndexes(30, 120, strings, [75, 0, 0, 0, 0, 0], 100), [1]);
  });

  it("scales velocity and caps it at one", () => {
    assert.equal(velocityFromPointerMovement(8, 16), 0.5);
    assert.equal(velocityFromPointerMovement(100, 8), 1);
  });
});

describe("fretboard geometry", () => {
  it("places the nut and 12th fret at the neck edges", () => {
    assert.equal(fretPosition(0), NUT_PERCENT);
    assert.ok(Math.abs(fretPosition(12) - NECK_END_PERCENT) < 1e-9);
  });

  it("shrinks fret spacing toward the body", () => {
    // Equal temperament: fret 1 is 2^(10/12) ≈ 1.78× wider than fret 11.
    const first = fretPosition(1) - fretPosition(0);
    const eleventh = fretPosition(11) - fretPosition(10);
    assert.ok(first > eleventh * 1.7);
  });

  it("centres fingers between fret wires", () => {
    assert.equal(fingerPosition(1), (fretPosition(0) + fretPosition(1)) / 2);
    assert.throws(() => fingerPosition(0), RangeError);
  });
});

describe("guitar catalog", () => {
  it("gives every guitar one gauge per string of its preset", () => {
    for (const guitar of GUITAR_CATALOG) {
      assert.equal(guitar.look.gauges.length, INSTRUMENTS[guitar.id].strings.length, guitar.id);
      assert.ok(guitar.look.wound <= guitar.look.gauges.length, guitar.id);
    }
  });

  it("has a preset for every catalog entry", () => {
    assert.deepEqual(
      GUITAR_CATALOG.map((guitar) => guitar.id).sort(),
      Object.keys(INSTRUMENTS).sort(),
    );
  });
});

describe("instrument registry", () => {
  const chords: ChordId[] = ["C", "Dm", "Em", "F", "G", "Am"];

  it("gives every chord one fret per string on every guitar", () => {
    for (const preset of Object.values(INSTRUMENTS)) {
      for (const chord of chords) {
        assert.equal(chordShapeFor(chord, preset).length, preset.strings.length, `${preset.id} ${chord}`);
      }
      assert.ok(chordShapeFor("Open", preset).every((fret) => fret === 0));
    }
  });

  // Every sounding note must belong to the chord.
  const pitchClasses: Record<Exclude<ChordId, "Open">, number[]> = {
    C: [0, 4, 7],
    Dm: [2, 5, 9],
    Em: [4, 7, 11],
    F: [5, 9, 0],
    G: [7, 11, 2],
    Am: [9, 0, 4],
  };
  for (const id of Object.keys(INSTRUMENTS) as GuitarId[]) {
    it(`plays only chord tones on ${id}`, () => {
      for (const chord of chords) {
        const notes = resolveChordNotes(chord, INSTRUMENTS[id]).filter((midi): midi is number => midi !== null);
        assert.ok(notes.length >= 2, `${id} ${chord} sounds at least two strings`);
        for (const midi of notes) {
          assert.ok(pitchClasses[chord as Exclude<ChordId, "Open">].includes(midi % 12), `${id} ${chord} ${midi}`);
        }
      }
    });
  }

  it("roots every bass chord on its lowest sounding note", () => {
    const roots: Record<string, number> = { C: 0, Dm: 2, Em: 4, F: 5, G: 7, Am: 9 };
    for (const chord of chords) {
      const lowest = resolveChordNotes(chord, INSTRUMENTS.bass).find((midi) => midi !== null);
      assert.equal(lowest! % 12, roots[chord], chord);
    }
  });

  it("keeps muted strings silent", () => {
    assert.deepEqual(resolveChordNotes("C", INSTRUMENTS.bass), [null, 36, 43, null]);
    assert.equal(resolveChordNotes("Dm", INSTRUMENTS.classical)[0], null);
  });

  it("maps tonejs-instruments file names to MIDI", () => {
    assert.deepEqual(
      samplesFromNotes(["E1", "As1", "Ds3", "A4"]).map((sample) => [sample.midi, sample.file]),
      [[28, "E1.mp3"], [34, "As1.mp3"], [51, "Ds3.mp3"], [69, "A4.mp3"]],
    );
    assert.throws(() => samplesFromNotes(["H2"]));
  });

  it("keeps every sampled note within a fourth of a recorded sample", () => {
    for (const preset of Object.values(INSTRUMENTS)) {
      if (preset.voice.kind !== "samples") continue;
      const recorded = preset.voice.samples.map((sample) => sample.midi);
      for (const chord of ["Open", ...chords] as ChordId[]) {
        for (const midi of resolveChordNotes(chord, preset)) {
          if (midi === null) continue;
          const distance = Math.min(...recorded.map((sample) => Math.abs(sample - midi)));
          assert.ok(distance <= 5, `${preset.id} ${chord} ${midi} is ${distance} semitones from a sample`);
        }
      }
    }
  });

  it("spaces four and six strings across the neck", () => {
    assert.deepEqual(stringPositions(6), [46, 100, 154, 208, 262, 316]);
    assert.deepEqual(stringPositions(4), [46, 136, 226, 316]);
  });
});

describe("signal processing", () => {
  it("converts MIDI to frequency", () => {
    assert.equal(midiToFrequency(69), 440);
    assert.ok(Math.abs(midiToFrequency(60) - 261.6256) < 1e-3);
  });

  it("renders a plucked note that decays", () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const sampleRate = 8000;
    const note = karplusStrong(440, sampleRate, 1, 0.6, 0.8, random);
    assert.equal(note.length, sampleRate);
    const energy = (from: number, to: number) => note.slice(from, to).reduce((sum, x) => sum + x * x, 0);
    assert.ok(energy(0, 800) > energy(4000, 4800) * 20);
    assert.ok(Math.max(...note.map(Math.abs)) <= 0.9 + 1e-6);
    assert.equal(Math.abs(note[note.length - 1]), 0);
  });

  it("builds an odd, bounded distortion curve", () => {
    const curve = distortionCurve(0.65, 257);
    assert.ok(Math.abs(curve[128]) < 1e-9);
    assert.ok(Math.abs(curve[0] + curve[256]) < 1e-9);
    assert.ok(curve.every((y) => Math.abs(y) <= 1 + 1e-9));
  });
});

describe("12-string and power chords", () => {
  it("pairs every 12-string course with an octave or unison partner", () => {
    const courses = INSTRUMENTS.twelve.courses!;
    assert.equal(courses.octaveOffsets.length, INSTRUMENTS.twelve.strings.length);
    assert.ok(courses.octaveOffsets.every((offset) => offset === 0 || offset === 12));
  });

  it("keeps 12-string partner notes close to a recorded sample", () => {
    const preset = INSTRUMENTS.twelve;
    if (preset.voice.kind !== "samples") throw new Error("12-string should use samples");
    const recorded = preset.voice.samples.map((sample) => sample.midi);
    for (const chord of ["Open", "C", "Dm", "Em", "F", "G", "Am"] as ChordId[]) {
      resolveChordNotes(chord, preset).forEach((midi, index) => {
        if (midi === null) return;
        const partner = midi + preset.courses!.octaveOffsets[index];
        assert.ok(Math.min(...recorded.map((s) => Math.abs(s - partner))) <= 5, `${chord} string ${index} → ${partner}`);
      });
    }
  });

  it("builds power chords from root and fifth only, root lowest", () => {
    const power = withPowerChords(INSTRUMENTS.drive);
    const roots: Record<string, number> = { C: 0, Dm: 2, Em: 4, F: 5, G: 7, Am: 9 };
    for (const chord of ["C", "Dm", "Em", "F", "G", "Am"] as const) {
      const notes = resolveChordNotes(chord, power).filter((midi): midi is number => midi !== null);
      assert.ok(notes.length >= 2, chord);
      assert.equal(notes[0] % 12, roots[chord], `${chord} root`);
      for (const midi of notes) {
        assert.ok([0, 7].includes((midi - notes[0] + 120) % 12), `${chord} ${midi} is a root or fifth`);
      }
    }
    assert.equal(withPowerChords(INSTRUMENTS.acoustic), INSTRUMENTS.acoustic);
  });

  it("names power chords", () => {
    assert.equal(powerChordName("Dm"), "D5");
    assert.equal(powerChordName("C"), "C5");
    assert.equal(powerChordName("Am"), "A5");
  });
});
