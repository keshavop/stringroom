"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GUITAR_CATALOG,
  PLAIN_STRING_COLOR,
  WOUND_STRING_COLOR,
  type GuitarCatalogEntry,
} from "@/lib/guitar/catalog";
import { midiToNoteName } from "@/lib/guitar/data";
import { NECK_END_PERCENT, VISIBLE_FRETS, fretPosition } from "@/lib/guitar/fretboard";
import { getPreset } from "@/lib/guitar/instruments";
import type { GuitarId } from "@/lib/guitar/types";
import { cn } from "@/lib/utils";

const FRET_WIRES = Array.from({ length: VISIBLE_FRETS }, (_, index) => fretPosition(index + 1).toFixed(3));

function GuitarPreview({ guitar }: { guitar: GuitarCatalogEntry }) {
  const { look } = guitar;
  const count = look.gauges.length;
  return (
    <div aria-hidden="true" className="relative h-60 overflow-hidden" style={{ background: look.body }}>
      <div className="absolute inset-y-[10%] left-0" style={{ width: `${NECK_END_PERCENT}%`, background: look.board }} />
      <div className="absolute inset-y-[10%] left-[4%] w-1.5 -translate-x-full bg-[#ede6d6]" />
      {FRET_WIRES.map((left) => (
        <div key={left} className="absolute inset-y-[10%] w-[3px] bg-[#b9b2a3]/85" style={{ left: `${left}%` }} />
      ))}
      {look.kind === "soundhole" && (
        <div
          className="absolute left-[85%] top-1/2 size-36 -translate-1/2 rounded-full bg-[#0d0b09]"
          style={{ boxShadow: `0 0 0 7px ${look.rosette}, 0 0 0 10px #2b1a10` }}
        />
      )}
      {look.kind === "single-coil" && (
        <div className="absolute inset-y-[14%] left-[75%] right-[6%] flex justify-between">
          {[0, 1, 2].map((pickup) => (
            <div key={pickup} className="w-5 rounded-full bg-[#eee7d8]" />
          ))}
        </div>
      )}
      {look.kind === "humbucker" && (
        <div className="absolute inset-y-[12%] left-[76%] right-[7%] flex justify-between">
          {[0, 1].map((pickup) => (
            <div key={pickup} className="w-11 rounded-md border-2 border-[#4a4842] bg-[#2e2d2a]" />
          ))}
        </div>
      )}
      {look.kind === "bass-pickup" && (
        <div className="absolute inset-y-[14%] left-[82%] w-12 rounded-lg border-2 border-edge bg-panel" />
      )}
      {look.gauges.map((gauge, index) => (
        <div
          key={index}
          className="absolute inset-x-0 -translate-y-1/2 shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
          style={{
            top: `${(20 + index * (60 / (count - 1))).toFixed(3)}%`,
            height: gauge,
            background: index < look.wound ? WOUND_STRING_COLOR : PLAIN_STRING_COLOR,
          }}
        />
      ))}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-3.5">
      <dt className="font-mono text-xs tracking-[0.14em] text-dim">{label}</dt>
      <dd className="mt-1.5 text-[15px] leading-normal">{children}</dd>
    </div>
  );
}

export function GuitarLibrary() {
  const [selectedId, setSelectedId] = useState<GuitarId>("acoustic");
  const guitar = GUITAR_CATALOG.find((entry) => entry.id === selectedId) ?? GUITAR_CATALOG[0];
  const preset = getPreset(guitar.id);
  const tuning = preset.strings.map((string) => midiToNoteName(string.openMidi));

  return (
    <div className="flex flex-wrap items-start gap-6">
      <ul aria-label="Guitars" className="flex max-w-[26rem] flex-[1_1_20rem] flex-col gap-2">
        {GUITAR_CATALOG.map((entry) => {
          const active = entry.id === guitar.id;
          return (
            <li key={entry.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(entry.id)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-[14px] border p-3 text-left transition-colors",
                  active ? "border-accent bg-panel" : "border-line hover:border-edge-strong",
                )}
              >
                <span
                  aria-hidden="true"
                  className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg"
                  style={{ background: entry.look.body }}
                >
                  <span className="absolute inset-y-0 left-0 w-[60%]" style={{ background: entry.look.board }} />
                </span>
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-base font-bold">{entry.name}</span>
                  <span className="text-[13px] text-muted">{entry.model}</span>
                </span>
                <span className="font-mono text-[11px] tracking-[0.08em] text-muted">
                  {entry.look.gauges.length} STR
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <section
        aria-labelledby="guitar-detail"
        aria-live="polite"
        className="min-w-0 flex-[999_1_35rem] overflow-hidden rounded-[22px] border border-line bg-panel"
      >
        <GuitarPreview guitar={guitar} />
        <div className="flex flex-col gap-6 p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2
                id="guitar-detail"
                className="text-4xl font-extrabold tracking-[-0.02em] font-stretch-expanded"
              >
                {guitar.name}
              </h2>
              <p className="mt-1.5 text-base text-muted">
                {guitar.model} · {guitar.description.toLowerCase()}
              </p>
            </div>
            <Link
              href={guitar.id === "acoustic" ? "/#play" : `/?guitar=${guitar.id}#play`}
              className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-ink transition-colors hover:bg-[#ff8d3a]"
            >
              Play {guitar.name}
            </Link>
          </div>

          <div>
            <p className="mb-2.5 font-mono text-xs tracking-[0.14em] text-dim">TUNING</p>
            <ol aria-label="Tuning, lowest string first" className="flex flex-wrap gap-2">
              {tuning.map((note, index) => (
                <li
                  key={index}
                  className="min-w-12 rounded-[10px] border border-b-[3px] border-edge bg-raised px-2.5 py-2 text-center font-mono text-sm font-semibold"
                >
                  {note}
                </li>
              ))}
            </ol>
          </div>

          <dl className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-x-6">
            <Detail label="SOUND SOURCE">{guitar.soundSource}</Detail>
            <Detail label="SIGNAL CHAIN">{guitar.signalChain}</Detail>
            <Detail label="CHORD SHAPES">{guitar.chordShapes}</Detail>
            <Detail label="STRINGS">{preset.strings.length}</Detail>
          </dl>
        </div>
      </section>
    </div>
  );
}
