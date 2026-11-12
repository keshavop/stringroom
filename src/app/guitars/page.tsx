import type { Metadata } from "next";
import { GuitarLibrary } from "@/components/site/GuitarLibrary";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Guitars — Stringroom",
  description: "Seven guitars that share the same chord keys: acoustic, 12-string, classical, electric, drive, bass and ukulele.",
};

export default function GuitarsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-[85rem] px-4 pb-16 pt-12 sm:px-10">
        <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold leading-none tracking-[-0.025em] font-stretch-expanded">
          Guitars
        </h1>
        <p className="mb-9 mt-3 max-w-xl text-base leading-relaxed text-muted">
          Every guitar uses the same chord keys. Bass and ukulele switch to their own four-string shapes automatically.
        </p>
        <GuitarLibrary />
      </main>
      <SiteFooter />
    </>
  );
}
