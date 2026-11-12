import type { Metadata } from "next";
import { LibraryView } from "@/components/library/LibraryView";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Library — Stringroom",
  description: "Your chord progressions, guitar volumes and playing preferences, saved in this browser.",
};

export default function LibraryPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-[85rem] px-4 pb-16 pt-12 sm:px-10">
        <h1 className="mb-10 text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold leading-none tracking-[-0.025em] font-stretch-expanded">
          Library
        </h1>
        <LibraryView />
      </main>
      <SiteFooter />
    </>
  );
}
