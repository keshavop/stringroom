import { Suspense } from "react";
import { GuitarPicker } from "@/components/site/GuitarPicker";
import { HowToPlay } from "@/components/site/HowToPlay";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { GuitarStudioFallback, GuitarStudioFromUrl } from "@/components/studio/GuitarStudioFromUrl";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto flex w-full max-w-[85rem] flex-col gap-24 px-4 pb-8 pt-8 sm:gap-28 sm:px-10">
        <Suspense fallback={<GuitarStudioFallback />}>
          <GuitarStudioFromUrl />
        </Suspense>
        <GuitarPicker />
        <HowToPlay />
      </main>
      <SiteFooter />
    </>
  );
}
