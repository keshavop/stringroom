"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { isGuitarId } from "@/lib/guitar/catalog";
import type { GuitarId } from "@/lib/guitar/types";
import { useLibrary } from "@/lib/library/store";
import GuitarStudio from "./GuitarStudio";

/**
 * Keeps the selected guitar and progression in the URL
 * (`/?guitar=bass&progression=<id>`) so they can be linked to directly.
 * Without `?guitar`, a progression's own guitar wins, then the player's default.
 */
export function GuitarStudioFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [library] = useLibrary();

  const progressionId = searchParams.get("progression");
  const progression = progressionId ? (library.progressions.find((p) => p.id === progressionId) ?? null) : null;
  const requested = searchParams.get("guitar");
  const guitarId: GuitarId = isGuitarId(requested)
    ? requested
    : (progression?.guitarId ?? library.preferences.defaultGuitar);

  const replaceParams = useCallback(
    (change: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      change(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const selectGuitar = useCallback(
    (id: GuitarId) => replaceParams((params) => params.set("guitar", id)),
    [replaceParams],
  );
  const closeProgression = useCallback(
    () => replaceParams((params) => params.delete("progression")),
    [replaceParams],
  );

  return (
    <GuitarStudio
      guitarId={guitarId}
      onGuitarChange={selectGuitar}
      progression={progression}
      onCloseProgression={closeProgression}
    />
  );
}

/** Shown while search params are read on the client; matches the default guitar. */
export function GuitarStudioFallback() {
  return <GuitarStudio guitarId="acoustic" onGuitarChange={() => {}} />;
}
