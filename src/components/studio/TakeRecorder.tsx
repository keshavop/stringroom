"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const MAX_SECONDS = 600;
const FORMATS = [
  { mime: "audio/webm;codecs=opus", extension: "webm" },
  { mime: "audio/webm", extension: "webm" },
  { mime: "audio/mp4", extension: "m4a" },
  { mime: "audio/ogg;codecs=opus", extension: "ogg" },
] as const;

type Tap = { stream: MediaStream; release: () => void };
type Take = { url: string; extension: string; seconds: number };

function formatTime(seconds: number) {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Records what the guitar plays (not the microphone) and offers it back as a
 * file to listen to and download. Nothing leaves the browser.
 */
export function TakeRecorder({
  soundReady,
  openTap,
  onEnableSound,
}: {
  soundReady: boolean;
  /** Returns a stream of the guitar's output, or null if sound is off. */
  openTap: () => Tap | null;
  onEnableSound: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [take, setTake] = useState<Take | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const tapRef = useRef<Tap | null>(null);
  const takeUrlRef = useRef<string | null>(null);

  const discard = () => {
    if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    takeUrlRef.current = null;
    setTake(null);
  };

  const stop = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const start = () => {
    setError(null);
    if (!soundReady) {
      onEnableSound();
      setError("Sound is starting. Press Record again once it says Sound on.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("This browser can't record audio.");
      return;
    }
    const tap = openTap();
    if (!tap) return;
    const format = FORMATS.find((f) => MediaRecorder.isTypeSupported(f.mime));
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(tap.stream, format ? { mimeType: format.mime } : undefined);
    } catch {
      tap.release();
      setError("This browser can't record audio.");
      return;
    }

    discard();
    const chunks: Blob[] = [];
    const startedAt = performance.now();
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      tap.release();
      tapRef.current = null;
      recorderRef.current = null;
      setRecording(false);
      if (chunks.length === 0) return;
      const blob = new Blob(chunks, { type: recorder.mimeType || format?.mime || "audio/webm" });
      const url = URL.createObjectURL(blob);
      takeUrlRef.current = url;
      setTake({ url, extension: format?.extension ?? "webm", seconds: (performance.now() - startedAt) / 1000 });
    };

    tapRef.current = tap;
    recorderRef.current = recorder;
    recorder.start(1000);
    setElapsed(0);
    setRecording(true);
  };

  useEffect(() => {
    if (!recording) return;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const seconds = (performance.now() - startedAt) / 1000;
      setElapsed(seconds);
      if (seconds >= MAX_SECONDS && recorderRef.current?.state === "recording") recorderRef.current.stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      tapRef.current?.release();
      if (takeUrlRef.current) URL.revokeObjectURL(takeUrlRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[18px] border border-line px-4 py-3">
      <button
        type="button"
        onClick={recording ? stop : start}
        aria-pressed={recording}
        className={cn(
          "inline-flex h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold transition-colors",
          recording ? "border-[#e5484d] bg-[#e5484d]/15 text-fg" : "border-edge hover:border-edge-strong",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("size-2.5 rounded-full bg-[#e5484d]", recording && "animate-pulse")}
        />
        {recording ? (
          <>
            Stop recording <span className="font-mono text-xs text-muted">{formatTime(elapsed)}</span>
          </>
        ) : take ? (
          "Record again"
        ) : (
          "Record a take"
        )}
      </button>

      {take && !recording ? (
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <audio controls src={take.url} className="h-10 min-w-0 max-w-full flex-1 basis-60" aria-label="Recorded take" />
          <a
            href={take.url}
            download={`stringroom-take.${take.extension}`}
            className="rounded-full bg-fg px-4 py-2.5 text-sm font-bold text-ground transition-opacity hover:opacity-90"
          >
            Download {formatTime(take.seconds)}
          </a>
          <button type="button" onClick={discard} className="px-2 py-2.5 text-sm text-muted transition-colors hover:text-fg">
            Discard
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted" role={error ? "alert" : undefined}>
          {error ?? (recording ? "Recording the guitar only, not your microphone." : "Captures what you play, up to 10 minutes. Stays on this device.")}
        </p>
      )}
    </div>
  );
}
