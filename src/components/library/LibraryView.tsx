"use client";

import Link from "next/link";
import { useState } from "react";
import { GUITAR_CATALOG, getCatalogEntry } from "@/lib/guitar/catalog";
import { KEY_LAYOUTS, PLAYABLE_CHORDS, type KeyLayout } from "@/lib/guitar/data";
import { DEFAULT_VOLUME } from "@/lib/guitar/instruments";
import type { GuitarId, PlayableChordId } from "@/lib/guitar/types";
import {
  EMPTY_LIBRARY,
  LIMITS,
  deleteProgression,
  newProgression,
  saveProgression,
  setGuitarVolume,
  updatePreferences,
  type Progression,
} from "@/lib/library/model";
import { newId, useLibrary } from "@/lib/library/store";
import { cn } from "@/lib/utils";

const field =
  "h-11 rounded-[10px] border border-edge bg-ground px-3 text-[15px] text-fg transition-colors hover:border-edge-strong";
const label = "text-sm font-semibold";
const eyebrow = "font-mono text-xs tracking-[0.14em] text-dim";

function studioHref(progression: Progression) {
  return `/?guitar=${progression.guitarId}&progression=${progression.id}#play`;
}

function ProgressionEditor({
  progression,
  onChange,
  onDelete,
}: {
  progression: Progression;
  onChange: (patch: Partial<Progression>) => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // Text fields keep a draft while typing and save when the field is left,
  // so half-typed values (a trailing space, "1" on the way to "120") survive.
  const [name, setName] = useState(progression.name);
  const [bpm, setBpm] = useState(String(progression.bpm));
  const commitName = () => {
    onChange({ name });
    setName(name.trim() || progression.name);
  };
  const commitBpm = () => {
    const value = Math.round(Number(bpm));
    const next = Number.isFinite(value) && bpm.trim() !== ""
      ? Math.min(LIMITS.bpm.max, Math.max(LIMITS.bpm.min, value))
      : progression.bpm;
    setBpm(String(next));
    if (next !== progression.bpm) onChange({ bpm: next });
  };
  const commitOnEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
  };
  const full = progression.chords.length >= LIMITS.chords.max;

  return (
    <div className="flex flex-col gap-5 rounded-[22px] border border-line bg-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-56 flex-[2_1_16rem] flex-col gap-1.5">
          <label htmlFor="progression-name" className={eyebrow}>
            NAME
          </label>
          <input
            id="progression-name"
            type="text"
            maxLength={LIMITS.name.max}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={commitName}
            onKeyDown={commitOnEnter}
            className="border-b border-edge bg-transparent py-1 text-2xl font-extrabold font-stretch-semi-expanded focus:border-accent"
          />
        </div>
        <div className="flex flex-[1_1_9rem] flex-col gap-1.5">
          <label htmlFor="progression-guitar" className={label}>
            Guitar
          </label>
          <select
            id="progression-guitar"
            value={progression.guitarId}
            onChange={(event) => onChange({ guitarId: event.target.value as GuitarId })}
            className={field}
          >
            {GUITAR_CATALOG.map((guitar) => (
              <option key={guitar.id} value={guitar.id}>
                {guitar.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-28 flex-col gap-1.5">
          <label htmlFor="progression-bpm" className={label}>
            Tempo (BPM)
          </label>
          <input
            id="progression-bpm"
            type="number"
            inputMode="numeric"
            min={LIMITS.bpm.min}
            max={LIMITS.bpm.max}
            value={bpm}
            onChange={(event) => setBpm(event.target.value)}
            onBlur={commitBpm}
            onKeyDown={commitOnEnter}
            className={field}
          />
        </div>
        <div className="flex w-32 flex-col gap-1.5">
          <label htmlFor="progression-beats" className={label}>
            Beats per chord
          </label>
          <select
            id="progression-beats"
            value={progression.beatsPerChord}
            onChange={(event) => onChange({ beatsPerChord: Number(event.target.value) })}
            className={field}
          >
            {Array.from({ length: LIMITS.beatsPerChord.max }, (_, index) => index + 1).map((beats) => (
              <option key={beats} value={beats}>
                {beats}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className={eyebrow} id="sequence-label">
          CHORDS IN ORDER
        </p>
        <ol aria-labelledby="sequence-label" className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
          {progression.chords.map((chord, index) => (
            <li
              key={index}
              className="flex h-24 flex-col justify-between rounded-[14px] border border-b-4 border-edge bg-raised p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-dim">{index + 1}</span>
                <button
                  type="button"
                  aria-label={`Remove chord ${index + 1}, ${chord}`}
                  disabled={progression.chords.length === 1}
                  onClick={() => onChange({ chords: progression.chords.filter((_, i) => i !== index) })}
                  className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-edge hover:text-fg disabled:invisible"
                >
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m2 2 8 8M10 2l-8 8" /></svg>
                </button>
              </div>
              <span className="text-3xl font-black font-stretch-expanded">{chord}</span>
            </li>
          ))}
        </ol>
        <div role="group" aria-label="Add a chord" className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm text-muted">Add</span>
          {PLAYABLE_CHORDS.map((chord) => (
            <button
              key={chord}
              type="button"
              disabled={full}
              aria-label={`Add ${chord}`}
              onClick={() => onChange({ chords: [...progression.chords, chord as PlayableChordId] })}
              className="min-w-12 rounded-[10px] border border-b-[3px] border-edge px-3 py-2 text-sm font-bold transition-colors hover:border-accent disabled:opacity-40"
            >
              + {chord}
            </button>
          ))}
          {full && <span className="text-sm text-dim">Up to {LIMITS.chords.max} chords</span>}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          href={studioHref(progression)}
          className="rounded-full bg-fg px-5 py-3 text-sm font-bold text-ground transition-opacity hover:opacity-90"
        >
          Play in studio
        </Link>
        {confirmingDelete ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Delete “{progression.name}”?</span>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-[#7a3424] px-4 py-2 font-semibold text-[#f2a08a] hover:bg-[#7a3424]/30"
            >
              Delete
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)} className="px-3 py-2 text-muted hover:text-fg">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="px-3 py-2 text-sm text-muted transition-colors hover:text-[#f2a08a]"
          >
            Delete progression
          </button>
        )}
      </div>
    </div>
  );
}

export function LibraryView() {
  const [library, update] = useLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const { progressions, preferences } = library;
  const selected = progressions.find((p) => p.id === selectedId) ?? progressions[0] ?? null;

  const create = () => {
    const progression = newProgression(newId(), Date.now(), preferences.defaultGuitar);
    update((current) => saveProgression(current, progression, Date.now()));
    setSelectedId(progression.id);
  };

  return (
    <div className="flex flex-col gap-14">
      <section id="progressions" aria-labelledby="progressions-heading" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id="progressions-heading"
              className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-[-0.02em] font-stretch-expanded"
            >
              Progressions
            </h2>
            <p className="mt-1.5 text-[15px] text-muted">Loops of chords the studio plays for you, strumming on every beat.</p>
          </div>
          <button
            type="button"
            onClick={create}
            className="h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-ink transition-colors hover:bg-[#ff8d3a]"
          >
            New progression
          </button>
        </div>

        {selected ? (
          <>
            <ProgressionEditor
              key={selected.id}
              progression={selected}
              onChange={(patch) => update((current) => saveProgression(current, { ...selected, ...patch }, Date.now()))}
              onDelete={() => {
                update((current) => deleteProgression(current, selected.id));
                setSelectedId(null);
              }}
            />
            <ul aria-label="Saved progressions" className="border-t border-line">
              {progressions.map((progression) => {
                const active = progression.id === selected.id;
                return (
                  <li key={progression.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line py-3">
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedId(progression.id)}
                      className={cn(
                        "flex-[1_1_12rem] text-left text-base font-semibold transition-colors hover:text-accent",
                        active && "text-accent",
                      )}
                    >
                      {progression.name}
                    </button>
                    <span className="flex-[1_1_12rem] font-mono text-sm text-fg-soft">{progression.chords.join("  ")}</span>
                    <span className="w-24 text-[13px] text-muted">{getCatalogEntry(progression.guitarId).name}</span>
                    <Link href={studioHref(progression)} className="text-sm text-accent hover:underline">
                      Play<span className="sr-only"> {progression.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <div className="rounded-[22px] border border-dashed border-edge-strong px-6 py-10 text-center">
            <p className="text-lg font-semibold">No progressions yet</p>
            <p className="mx-auto mt-1.5 max-w-md text-[15px] text-muted">
              Start one and it opens with C → G → Am → F. Change the chords, tempo and guitar, then play it in the studio.
            </p>
          </div>
        )}
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-6">
        <section id="guitars" aria-labelledby="guitars-heading" className="flex flex-col gap-4 rounded-[22px] border border-line p-5 sm:p-6">
          <h2 id="guitars-heading" className="text-[22px] font-extrabold font-stretch-semi-expanded">
            My guitars
          </h2>
          <fieldset className="flex flex-col">
            <legend className="mb-2 text-sm text-muted">Opens by default, and its volume</legend>
            {GUITAR_CATALOG.map((guitar) => {
              const volume = Math.round((library.volumes[guitar.id] ?? DEFAULT_VOLUME) * 100);
              return (
                <div key={guitar.id} className="flex items-center gap-3 border-t border-line py-2.5">
                  <label className="flex flex-[1_1_8rem] cursor-pointer items-center gap-3">
                    <input
                      type="radio"
                      name="default-guitar"
                      checked={preferences.defaultGuitar === guitar.id}
                      onChange={() => update((current) => updatePreferences(current, { defaultGuitar: guitar.id }))}
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    <span
                      aria-hidden="true"
                      className="relative h-7 w-9 shrink-0 overflow-hidden rounded-md"
                      style={{ background: guitar.look.body }}
                    >
                      <span className="absolute inset-y-0 left-0 w-[60%]" style={{ background: guitar.look.board }} />
                    </span>
                    <span className="font-semibold">{guitar.name}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    aria-label={`${guitar.name} volume`}
                    onChange={(event) =>
                      update((current) => setGuitarVolume(current, guitar.id, Number(event.target.value) / 100))
                    }
                    className="w-28 cursor-pointer"
                  />
                  <span className="w-8 text-right font-mono text-[13px] text-muted">{volume}</span>
                </div>
              );
            })}
          </fieldset>
        </section>

        <section id="preferences" aria-labelledby="preferences-heading" className="flex flex-col gap-5 rounded-[22px] border border-line p-5 sm:p-6">
          <h2 id="preferences-heading" className="text-[22px] font-extrabold font-stretch-semi-expanded">
            Preferences
          </h2>
          <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-line pt-4">
            <span>
              <span className="block font-semibold">Left-handed neck</span>
              <span className="text-[13px] text-muted">Mirror the neck so the headstock is on the right</span>
            </span>
            <input
              type="checkbox"
              checked={preferences.leftHanded}
              onChange={(event) => update((current) => updatePreferences(current, { leftHanded: event.target.checked }))}
              className="size-5 shrink-0 accent-[var(--color-accent)]"
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="key-layout" className={label}>
              Chord key layout
            </label>
            <select
              id="key-layout"
              value={preferences.keyLayout}
              onChange={(event) =>
                update((current) => updatePreferences(current, { keyLayout: event.target.value as KeyLayout }))
              }
              className={field}
            >
              {(Object.keys(KEY_LAYOUTS) as KeyLayout[]).map((layout) => (
                <option key={layout} value={layout}>
                  {KEY_LAYOUTS[layout].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="sensitivity" className={label}>
                Strum sensitivity
              </label>
              <span className="font-mono text-[13px] text-muted">{preferences.strumSensitivity}</span>
            </div>
            <input
              id="sensitivity"
              type="range"
              min="0"
              max="100"
              value={preferences.strumSensitivity}
              onChange={(event) =>
                update((current) => updatePreferences(current, { strumSensitivity: Number(event.target.value) }))
              }
              className="cursor-pointer"
            />
            <span className="text-[13px] text-muted">Higher plays louder for the same sweep speed</span>
          </div>
        </section>
      </div>

      <section aria-labelledby="storage-heading" className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <div className="max-w-xl">
          <h2 id="storage-heading" className="font-semibold">
            Saved in this browser
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Your library stays on this device and isn’t sent anywhere. Clearing your browser’s site data removes it.
          </p>
        </div>
        {confirmingClear ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Remove every progression and setting?</span>
            <button
              type="button"
              onClick={() => {
                update(() => EMPTY_LIBRARY);
                setSelectedId(null);
                setConfirmingClear(false);
              }}
              className="rounded-full border border-[#7a3424] px-4 py-2 font-semibold text-[#f2a08a] hover:bg-[#7a3424]/30"
            >
              Clear library
            </button>
            <button type="button" onClick={() => setConfirmingClear(false)} className="px-3 py-2 text-muted hover:text-fg">
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingClear(true)}
            className="rounded-[10px] border border-edge px-4 py-2.5 text-sm text-muted transition-colors hover:text-[#f2a08a]"
          >
            Clear library
          </button>
        )}
      </section>
    </div>
  );
}
