"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY_LIBRARY, parseLibrary, type Library } from "./model";

/**
 * The library lives in this browser's localStorage. It is shared across tabs
 * (via the `storage` event) and falls back to an in-memory copy when storage
 * is blocked, so the studio always works.
 */
const STORAGE_KEY = "stringroom.library.v1";

let cache: Library | null = null;
const listeners = new Set<() => void>();

function read(): Library {
  if (cache) return cache;
  let json: string | null = null;
  try {
    json = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: keep an in-memory library.
  }
  cache = parseLibrary(json);
  return cache;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateLibrary(change: (library: Library) => Library) {
  const next = change(read());
  if (next === cache) return;
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the change still applies for this session.
  }
  notify();
}

const getServerSnapshot = () => EMPTY_LIBRARY;

/** The current library. Renders defaults on the server and before hydration. */
export function useLibrary(): [Library, (change: (library: Library) => Library) => void] {
  const library = useSyncExternalStore(subscribe, read, getServerSnapshot);
  const update = useCallback((change: (library: Library) => Library) => updateLibrary(change), []);
  return [library, update];
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
