"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatedTabs, type AnimatedTab } from "@/components/ui/animated-tabs";
import { Spotlight } from "@/components/ui/spotlight";
import { GuitarAudioEngine } from "@/lib/guitar/audio-engine";
import { GUITAR_CATALOG, getCatalogEntry } from "@/lib/guitar/catalog";
import { CHORDS, chordShapeFor, keyMapFor, midiToNoteName, resolveChordNotes } from "@/lib/guitar/data";
import { DEFAULT_VOLUME, getPreset, powerChordName, withPowerChords } from "@/lib/guitar/instruments";
import type { AudioStatus, ChordId, GuitarId } from "@/lib/guitar/types";
import { setGuitarVolume, updatePreferences, type Progression } from "@/lib/library/model";
import { useLibrary } from "@/lib/library/store";
import { cn } from "@/lib/utils";
import { ChordPad } from "./ChordPad";
import { Fretboard } from "./Fretboard";
import { ProgressionBar } from "./ProgressionBar";
import { SoundButton, VolumeControl } from "./SoundControls";
import { TakeRecorder } from "./TakeRecorder";

const GUITAR_TABS: readonly AnimatedTab<GuitarId>[] = GUITAR_CATALOG.map((guitar) => ({
  id: guitar.id,
  label: guitar.name,
}));

export default function GuitarStudio({
  guitarId,
  onGuitarChange,
  progression = null,
  onCloseProgression,
}: {
  guitarId: GuitarId;
  onGuitarChange: (id: GuitarId) => void;
  /** A saved progression to step through, from the library. */
  progression?: Progression | null;
  onCloseProgression?: () => void;
}) {
  const [library, updateLibrary] = useLibrary();
  const { preferences } = library;
  const [loadedGuitar, setLoadedGuitar] = useState<GuitarId | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("idle");
  const [activeChord, setActiveChord] = useState<ChordId>("Open");
  const [latchedChord, setLatchedChord] = useState<ChordId>("Open");
  const volume = library.volumes[guitarId] ?? DEFAULT_VOLUME;
  const setVolume = useCallback(
    (next: number) => updateLibrary((current) => setGuitarVolume(current, guitarId, next)),
    [guitarId, updateLibrary],
  );
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [beat, setBeat] = useState(0);
  const [muted, setMuted] = useState(false);
  const [pulses, setPulses] = useState([0, 0, 0, 0, 0, 0]);
  const [lastPlayed, setLastPlayed] = useState<number | null>(null);

  const engineRef = useRef<GuitarAudioEngine | null>(null);
  const heldChordsRef = useRef<ChordId[]>([]);

  const guitar = getCatalogEntry(guitarId);
  const basePreset = getPreset(guitarId);
  const canUsePowerChords = basePreset.powerChordShapes !== undefined;
  const powerChords = canUsePowerChords && preferences.powerChords;
  const preset = useMemo(() => (powerChords ? withPowerChords(basePreset) : basePreset), [basePreset, powerChords]);
  const chordNotes = useMemo(() => resolveChordNotes(activeChord, preset), [activeChord, preset]);
  const chordFrets = chordShapeFor(activeChord, preset);
  const stringLabels = preset.strings.map((string) => string.label);
  /** Sound is on but the selected guitar's samples are still loading. */
  const switching = audioStatus === "ready" && loadedGuitar !== guitarId;
  const canPlay = audioStatus === "ready" && !switching;
  const soundingNotes = chordNotes.filter((midi): midi is number => midi !== null).map(midiToNoteName);

  const enableSound = useCallback(async () => {
    if (audioStatus === "loading") return;
    if (audioStatus === "ready") {
      await engineRef.current?.resume();
      return;
    }

    setAudioStatus("loading");
    try {
      engineRef.current ??= new GuitarAudioEngine(volume);
      engineRef.current.setVolume(volume);
      engineRef.current.setMuted(muted);
      await engineRef.current.initialize(preset);
      setLoadedGuitar(preset.id);
      setAudioStatus("ready");
    } catch (error) {
      console.error("Audio initialization failed", error);
      setAudioStatus("error");
    }
  }, [audioStatus, muted, preset, volume]);

  const pulseString = useCallback((stringIndex: number) => {
    setPulses((current) => current.map((pulse, index) => (index === stringIndex ? pulse + 1 : pulse)));
    setLastPlayed(stringIndex);
  }, []);

  const pluckString = useCallback(
    (stringIndex: number, velocity = 0.72, delaySeconds = 0) => {
      pulseString(stringIndex);
      const midi = chordNotes[stringIndex];
      if (canPlay && midi !== null) {
        engineRef.current?.play(midi, velocity, delaySeconds, preset.strings[stringIndex].pan, stringIndex);
      }
    },
    [canPlay, chordNotes, preset, pulseString],
  );

  const strum = useCallback(
    (direction: "down" | "up", velocity = 0.76, notes: readonly (number | null)[] = chordNotes) => {
      const down = preset.strings.map((_, index) => index);
      const order = direction === "down" ? down : down.reverse();
      order.forEach((stringIndex, orderIndex) => {
        window.setTimeout(() => pulseString(stringIndex), orderIndex * 34);
        const midi = notes[stringIndex];
        if (canPlay && midi !== null) {
          engineRef.current?.play(
            midi,
            velocity * (1 - orderIndex * 0.025),
            orderIndex * 0.034,
            preset.strings[stringIndex].pan,
            stringIndex,
          );
        }
      });
    },
    [canPlay, chordNotes, preset, pulseString],
  );

  const keyMap = useMemo(() => keyMapFor(preferences.keyLayout), [preferences.keyLayout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Typing in a field never plays the guitar.
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (event.code === "Space") {
        // Space keeps its usual job on links, tabs and other buttons; on the
        // chord keys (and anywhere else on the page) it strums.
        if (target?.closest("a, [role='tab'], button:not([data-strum-key])")) return;
        event.preventDefault();
        if (!event.repeat) strum(event.shiftKey ? "up" : "down");
        return;
      }

      const chord = keyMap[event.key.toLowerCase()];
      if (!chord || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      setLatchedChord("Open");
      heldChordsRef.current = heldChordsRef.current.filter((held) => held !== chord);
      heldChordsRef.current.push(chord);
      setActiveChord(chord);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const chord = keyMap[event.key.toLowerCase()];
      if (!chord) return;
      heldChordsRef.current = heldChordsRef.current.filter((held) => held !== chord);
      setActiveChord(heldChordsRef.current.at(-1) ?? "Open");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [keyMap, strum]);

  useEffect(() => {
    const releaseHeldChords = () => {
      heldChordsRef.current = [];
      setActiveChord(latchedChord);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        releaseHeldChords();
        void engineRef.current?.suspend();
      } else if (audioStatus === "ready") {
        void engineRef.current?.resume();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", releaseHeldChords);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", releaseHeldChords);
    };
  }, [audioStatus, latchedChord]);

  useEffect(() => {
    return () => {
      void engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  // Load the newly selected guitar once sound is on. Notes still ringing on
  // the previous guitar finish naturally on its own effect chain.
  useEffect(() => {
    const engine = engineRef.current;
    if (audioStatus !== "ready" || !engine) return;
    let cancelled = false;
    engine
      .setPreset(getPreset(guitarId))
      .then(() => {
        if (!cancelled) setLoadedGuitar(guitarId);
      })
      .catch((error: unknown) => {
        console.error(`Could not load the ${guitarId} guitar`, error);
        if (!cancelled) setAudioStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [audioStatus, guitarId]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    engineRef.current?.setMuted(muted);
  }, [muted]);

  // Progression playback: hold each chord for its beats and strum down on every beat.
  const strumRef = useRef(strum);
  const presetRef = useRef(preset);
  useEffect(() => {
    strumRef.current = strum;
    presetRef.current = preset;
  });

  useEffect(() => {
    if (!playing || !progression) return;
    const beatMs = 60_000 / progression.bpm;
    let tick = 0;
    const playTick = () => {
      const index = Math.floor(tick / progression.beatsPerChord) % progression.chords.length;
      const chord = progression.chords[index];
      heldChordsRef.current = [];
      setLatchedChord(chord);
      setActiveChord(chord);
      setStep(index);
      setBeat(tick % progression.beatsPerChord);
      strumRef.current("down", 0.7, resolveChordNotes(chord, presetRef.current));
      tick += 1;
    };
    const first = window.setTimeout(playTick, 0);
    const timer = window.setInterval(playTick, beatMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [playing, progression]);

  const togglePlayback = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (audioStatus === "idle" || audioStatus === "error") void enableSound();
    setPlaying(true);
  };

  const closeProgression = () => {
    setPlaying(false);
    onCloseProgression?.();
  };

  const selectChord = (chord: ChordId) => {
    heldChordsRef.current = [];
    const nextChord = latchedChord === chord ? "Open" : chord;
    setLatchedChord(nextChord);
    setActiveChord(nextChord);
  };

  const chordSymbol = activeChord !== "Open" && powerChords ? powerChordName(activeChord) : activeChord;
  const chordName =
    activeChord === "Open"
      ? "Open strings"
      : powerChords
        ? `${chordSymbol} power chord`
        : CHORDS[activeChord].label;
  /** Spoken to screen readers: loading and errors, not every string played. */
  const statusAnnouncement =
    audioStatus === "error"
      ? "Samples could not load. Check your connection and try again."
      : switching || audioStatus === "loading"
        ? `Loading the ${guitar.name.toLowerCase()}`
        : audioStatus === "ready"
          ? `${guitar.name} ready`
          : "";

  const openTap = () => (canPlay && engineRef.current ? engineRef.current.openRecordingTap() : null);

  const statusLine =
    audioStatus === "error"
      ? "Samples could not load. Check your connection and try again."
      : switching
        ? `Loading the ${guitar.name.toLowerCase()}…`
        : audioStatus === "ready"
        ? lastPlayed === null || lastPlayed >= preset.strings.length
          ? "Move across the strings to play"
          : `${midiToNoteName(chordNotes[lastPlayed])} · string ${lastPlayed + 1}`
        : "Enable sound before your first strum";

  return (
    <section id="play" aria-labelledby="now-playing" className="flex scroll-mt-6 flex-col gap-5">
      {/*
        Fixed-height header: the title and the tab row each keep their own line
        for every guitar, so switching guitars never moves the instrument.
      */}
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-[0.14em] text-dim">NOW PLAYING</p>
          <h1
            id="now-playing"
            className="mt-1.5 truncate text-[clamp(1.75rem,3vw,2.125rem)] font-extrabold leading-[1.15] tracking-[-0.01em] font-stretch-semi-expanded"
          >
            {guitar.name} <span className="font-medium text-dim">· {guitar.model}</span>
          </h1>
        </div>
        <AnimatedTabs
          label="Choose a guitar"
          tabs={GUITAR_TABS}
          value={guitarId}
          onChange={onGuitarChange}
          className="self-start"
        />
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {activeChord === "Open" ? "Open strings" : chordName}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </div>

      {progression && (
        <ProgressionBar
          progression={progression}
          playing={playing}
          step={step}
          beat={beat}
          onToggle={togglePlayback}
          onClose={closeProgression}
        />
      )}

      <div className="relative flex flex-wrap gap-7 overflow-hidden rounded-[22px] border border-line bg-panel p-5 sm:p-7">
        <Spotlight />

        <div className="relative flex min-w-0 max-w-56 flex-[1_1_11rem] flex-col justify-between gap-6">
          <div>
            <p className="font-mono text-xs tracking-[0.14em] text-dim">HOLDING</p>
            {/* Long labels ("Open") get a smaller size so they never run into the neck. */}
            <p
              aria-hidden="true"
              className={cn(
                "mt-1 flex h-[clamp(4.5rem,8vw,7rem)] items-end overflow-hidden font-black leading-[0.9] tracking-[-0.04em] font-stretch-expanded",
                chordSymbol.length > 2
                  ? "text-[clamp(2.5rem,4.2vw,3.5rem)]"
                  : "text-[clamp(4.5rem,8vw,7rem)]",
              )}
            >
              {chordSymbol}
            </p>
            <p className="mt-2.5 text-base text-muted">{chordName}</p>
            {/* Always laid out (hidden when the guitar has no power chords) so the neck never moves. */}
            <button
              type="button"
              role="switch"
              aria-checked={powerChords}
              aria-hidden={!canUsePowerChords || undefined}
              tabIndex={canUsePowerChords ? undefined : -1}
              disabled={!canUsePowerChords}
              onClick={() => updateLibrary((current) => updatePreferences(current, { powerChords: !powerChords }))}
              className={cn(
                "mt-5 flex items-center gap-2.5 text-sm font-semibold text-fg-soft transition-colors hover:text-fg",
                !canUsePowerChords && "invisible",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "relative h-6 w-10 shrink-0 rounded-full border transition-colors",
                  powerChords ? "border-accent-edge bg-accent" : "border-edge bg-raised",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-[18px] rounded-full transition-[left]",
                    powerChords ? "left-[18px] bg-accent-ink" : "left-0.5 bg-muted",
                  )}
                />
              </span>
              Power chords
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-xs tracking-[0.14em] text-dim">NOTES</p>
            <p className="font-mono text-sm leading-relaxed text-fg-soft">{soundingNotes.join("  ")}</p>
          </div>
        </div>

        <div className="relative flex min-w-0 flex-[999_1_40rem] flex-col gap-5">
          <Fretboard
            key={guitarId}
            look={guitar.look}
            labels={stringLabels}
            frets={chordFrets}
            pulses={pulses}
            canStrum={canPlay}
            onPluck={pluckString}
            leftHanded={preferences.leftHanded}
            sensitivity={preferences.strumSensitivity}
          />

          <div className="flex flex-wrap items-stretch justify-between gap-5">
            <ChordPad
              className={preferences.leftHanded ? "flex-[999_1_30rem] sm:pr-12" : "flex-[999_1_30rem] sm:pl-12"}
              activeChord={activeChord}
              latchedChord={latchedChord}
              onSelect={selectChord}
              keyLayout={preferences.keyLayout}
            />
            <div className="flex flex-[1_1_17rem] flex-col justify-between gap-3">
              <SoundButton status={switching ? "loading" : audioStatus} onEnable={enableSound} />
              <VolumeControl
                volume={volume}
                muted={muted}
                onVolumeChange={setVolume}
                onToggleMute={() => setMuted((current) => !current)}
              />
            </div>
          </div>
        </div>
      </div>

      <TakeRecorder soundReady={canPlay} openTap={openTap} onEnableSound={() => void enableSound()} />

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-sm text-muted">
        <p className="flex flex-wrap items-center gap-2">
          <Key>Space</Key> strums down
          <span className="ml-3 inline-flex items-center gap-2">
            <Key>Shift</Key> + <Key>Space</Key> strums up
          </span>
        </p>
        <p>{statusLine}</p>
      </div>
    </section>
  );
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="rounded-md border border-b-2 border-edge px-2 py-0.5 font-mono text-xs font-medium text-fg">
      {children}
    </kbd>
  );
}
