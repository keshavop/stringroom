"use client";

import Link from "next/link";
import { FocusCards } from "@/components/ui/focus-cards";
import {
  GUITAR_CATALOG,
  PLAIN_STRING_COLOR,
  WOUND_STRING_COLOR,
  type GuitarCatalogEntry,
} from "@/lib/guitar/catalog";

function StringSwatch({ guitar }: { guitar: GuitarCatalogEntry }) {
  const { look } = guitar;
  const count = look.gauges.length;
  return (
    <div aria-hidden="true" className="relative h-32" style={{ background: look.body }}>
      <div className="absolute inset-y-[14%] left-0 w-[58%]" style={{ background: look.board }} />
      {look.gauges.map((gauge, index) => (
        <div
          key={index}
          className="absolute inset-x-0"
          style={{
            top: `${(22 + index * (56 / (count - 1))).toFixed(3)}%`,
            height: Math.max(1, gauge * 0.7),
            background: index < look.wound ? WOUND_STRING_COLOR : PLAIN_STRING_COLOR,
          }}
        />
      ))}
    </div>
  );
}

function GuitarCard({ guitar }: { guitar: GuitarCatalogEntry }) {
  return (
    <Link
      href={guitar.id === "acoustic" ? "/#play" : `/?guitar=${guitar.id}#play`}
      className="block h-full overflow-hidden rounded-[18px] border border-line bg-panel transition-colors hover:border-accent"
    >
      <StringSwatch guitar={guitar} />
      <div className="flex flex-col gap-1.5 px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[19px] font-bold">{guitar.name}</h3>
          <span className="rounded-full border border-edge px-2 py-1 font-mono text-[11px] tracking-[0.08em] text-muted">
            {guitar.look.gauges.length} STRINGS
          </span>
        </div>
        <p className="text-sm text-muted">{guitar.description}</p>
      </div>
    </Link>
  );
}

export function GuitarPicker() {
  return (
    <section id="guitars" aria-labelledby="guitars-heading" className="scroll-mt-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h2
          id="guitars-heading"
          className="text-[clamp(2rem,4vw,2.75rem)] font-extrabold leading-none tracking-[-0.02em] font-stretch-expanded"
        >
          Pick a guitar
        </h2>
        <Link href="/guitars" className="text-sm text-muted transition-colors hover:text-fg">
          Tunings and sound details →
        </Link>
      </div>
      <FocusCards items={GUITAR_CATALOG} renderCard={(guitar) => <GuitarCard guitar={guitar} />} />
    </section>
  );
}
