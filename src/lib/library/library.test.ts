import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KEY_LAYOUTS, keyMapFor } from "../guitar/data";
import { velocityFromPointerMovement } from "../guitar/interaction";
import {
  EMPTY_LIBRARY,
  chordDurationMs,
  deleteProgression,
  newProgression,
  parseLibrary,
  saveProgression,
  setGuitarVolume,
  updatePreferences,
} from "./model";

describe("library parsing", () => {
  it("falls back to an empty library for missing or broken data", () => {
    assert.deepEqual(parseLibrary(null), EMPTY_LIBRARY);
    assert.deepEqual(parseLibrary("not json"), EMPTY_LIBRARY);
    assert.deepEqual(parseLibrary("[1,2]").progressions, []);
  });

  it("round-trips a library", () => {
    let library = saveProgression(EMPTY_LIBRARY, newProgression("a", 1, "bass"), 5);
    library = setGuitarVolume(library, "bass", 0.4);
    library = updatePreferences(library, { leftHanded: true, keyLayout: "numbers" });
    assert.deepEqual(parseLibrary(JSON.stringify(library)), library);
  });

  it("clamps out-of-range values and drops unusable progressions", () => {
    const library = parseLibrary(
      JSON.stringify({
        progressions: [
          { id: "ok", name: "  Loop  ", guitarId: "banjo", bpm: 999, beatsPerChord: 0, chords: ["C", "X", "Am"] },
          { id: "empty", chords: [] },
          { name: "no id", chords: ["C"] },
        ],
        volumes: { acoustic: 4, banjo: 0.5, bass: "loud" },
        preferences: { keyLayout: "dvorak", strumSensitivity: -20, defaultGuitar: "ukulele" },
      }),
    );
    assert.equal(library.progressions.length, 1);
    assert.deepEqual(library.progressions[0], {
      id: "ok",
      name: "Loop",
      guitarId: "acoustic",
      bpm: 200,
      beatsPerChord: 1,
      chords: ["C", "Am"],
      updatedAt: 0,
    });
    assert.deepEqual(library.volumes, { acoustic: 1 });
    assert.equal(library.preferences.keyLayout, "letters");
    assert.equal(library.preferences.strumSensitivity, 0);
    assert.equal(library.preferences.defaultGuitar, "ukulele");
  });

  it("caps progressions at 16 chords and names blank ones", () => {
    const long = { ...newProgression("x", 0), name: "   ", chords: Array(30).fill("G") };
    const [saved] = saveProgression(EMPTY_LIBRARY, long, 1).progressions;
    assert.equal(saved.chords.length, 16);
    assert.equal(saved.name, "Untitled progression");
  });
});

describe("library changes", () => {
  it("saves newest first and replaces by id", () => {
    let library = saveProgression(EMPTY_LIBRARY, newProgression("a", 0), 1);
    library = saveProgression(library, newProgression("b", 0), 2);
    library = saveProgression(library, { ...library.progressions[1], name: "Renamed" }, 3);
    assert.deepEqual(library.progressions.map((p) => [p.id, p.name, p.updatedAt]), [
      ["a", "Renamed", 3],
      ["b", "New progression", 2],
    ]);
    assert.deepEqual(deleteProgression(library, "a").progressions.map((p) => p.id), ["b"]);
  });

  it("keeps volumes between 0 and 1", () => {
    assert.equal(setGuitarVolume(EMPTY_LIBRARY, "drive", 1.7).volumes.drive, 1);
    assert.equal(setGuitarVolume(EMPTY_LIBRARY, "drive", -1).volumes.drive, 0);
  });

  it("times chords from tempo and beats", () => {
    assert.equal(chordDurationMs({ bpm: 120, beatsPerChord: 4 }), 2000);
  });
});

describe("key layouts", () => {
  it("maps six keys to the six chords in every layout", () => {
    for (const layout of Object.keys(KEY_LAYOUTS) as (keyof typeof KEY_LAYOUTS)[]) {
      assert.deepEqual(Object.values(keyMapFor(layout)), ["C", "Dm", "Em", "F", "G", "Am"], layout);
    }
    assert.equal(keyMapFor("home-row").a, "C");
    assert.equal(keyMapFor("numbers")["6"], "Am");
  });
});

describe("strum sensitivity", () => {
  it("leaves the default unchanged and scales the response", () => {
    assert.equal(velocityFromPointerMovement(8, 16), velocityFromPointerMovement(8, 16, 50));
    assert.ok(velocityFromPointerMovement(8, 16, 0) < velocityFromPointerMovement(8, 16, 50));
    assert.ok(velocityFromPointerMovement(8, 16, 100) > velocityFromPointerMovement(8, 16, 50));
    assert.equal(velocityFromPointerMovement(100, 8, 100), 1);
  });
});

describe("power chord preference", () => {
  it("defaults off and round-trips", () => {
    assert.equal(EMPTY_LIBRARY.preferences.powerChords, false);
    const on = updatePreferences(EMPTY_LIBRARY, { powerChords: true });
    assert.equal(parseLibrary(JSON.stringify(on)).preferences.powerChords, true);
    assert.equal(parseLibrary('{"preferences":{"powerChords":"yes"}}').preferences.powerChords, false);
  });
});
