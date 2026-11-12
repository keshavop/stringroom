"use client";

import { useRef, useState } from "react";
import {
  DOUBLE_INLAY_FRET,
  INLAY_FRETS,
  NECK_END_PERCENT,
  NUT_PERCENT,
  VISIBLE_FRETS,
  fingerPosition,
  fretPosition,
  stringPositions,
} from "@/lib/guitar/fretboard";
import { PLAIN_STRING_COLOR, WOUND_STRING_COLOR, type GuitarLook } from "@/lib/guitar/catalog";
import { getCrossedStringIndexes, velocityFromPointerMovement } from "@/lib/guitar/interaction";
import { cn } from "@/lib/utils";

const VIEWBOX_HEIGHT = 362;
const VIEWBOX_WIDTH = 1000;

const FRET_WIRES = Array.from({ length: VISIBLE_FRETS }, (_, index) => fretPosition(index + 1));

interface PointerPosition {
  x: number;
  y: number;
}

/** Rounded so server and client render identical style strings. */
function pct(value: number) {
  return `${value.toFixed(3)}%`;
}

function yPercent(stringY: number) {
  return pct((stringY / VIEWBOX_HEIGHT) * 100);
}

export function Fretboard({
  look,
  labels,
  frets,
  pulses,
  canStrum,
  onPluck,
  leftHanded = false,
  sensitivity = 50,
}: {
  look: GuitarLook;
  /** Open-string letter for each string, low string first. */
  labels: readonly string[];
  /** Fret per string for the held chord; null = muted, 0 = open. */
  frets: readonly (number | null)[];
  /** Increments each time a string is played, to restart its vibration. */
  pulses: readonly number[];
  canStrum: boolean;
  onPluck: (stringIndex: number, velocity: number, delaySeconds: number) => void;
  /** Mirror the neck so the headstock sits on the right. */
  leftHanded?: boolean;
  /** 0–100 strum response to sweep speed. */
  sensitivity?: number;
}) {
  const [pointer, setPointer] = useState<PointerPosition | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const activeTouchRef = useRef(false);
  const lastPointerRef = useRef<{ y: number; time: number } | null>(null);
  const lastTriggerRef = useRef([0, 0, 0, 0, 0, 0]);
  const positions = stringPositions(labels.length);
  /** Horizontal position in the player's orientation. */
  const across = (percent: number) => pct(leftHanded ? 100 - percent : percent);

  const updatePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * VIEWBOX_WIDTH;
    const y = ((event.clientY - bounds.top) / bounds.height) * VIEWBOX_HEIGHT;
    // Pointer event time stamps share the performance.now() clock.
    const now = event.timeStamp;
    const previous = lastPointerRef.current;
    setPointer({ x, y });

    const strumming = event.pointerType === "mouse" || activeTouchRef.current;
    if (strumming && previous && canStrum) {
      const velocity = velocityFromPointerMovement(y - previous.y, now - previous.time, sensitivity);
      const crossed = getCrossedStringIndexes(previous.y, y, positions, lastTriggerRef.current, now);
      crossed.forEach((index, orderIndex) => {
        lastTriggerRef.current[index] = now;
        onPluck(index, velocity, orderIndex * 0.008);
      });
    }

    lastPointerRef.current = { y, time: now };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") {
      activeTouchRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    lastPointerRef.current = null;
    updatePointer(event);
  };

  const handlePointerEnd = () => {
    activeTouchRef.current = false;
    lastPointerRef.current = null;
    setPointer(null);
  };

  return (
    <div className={cn("relative h-72 sm:h-[19rem]", leftHanded ? "pr-12" : "pl-12")}>
      {labels.map((label, index) => {
        const fret = frets[index];
        return (
          <div
            key={index}
            aria-hidden="true"
            className={cn("absolute flex -translate-y-1/2 items-center gap-1.5", leftHanded ? "right-0 flex-row-reverse" : "left-0")}
            style={{ top: yPercent(positions[index]) }}
          >
            <span className="grid size-6 place-items-center rounded-full border border-edge bg-raised font-mono text-xs font-semibold">
              {label}
            </span>
            <span className={cn("w-3 font-mono text-[13px] font-semibold", fret === null ? "text-dim" : "text-led")}>
              {fret === null ? "×" : fret === 0 ? "○" : ""}
            </span>
          </div>
        );
      })}

      <div
        ref={surfaceRef}
        role="group"
        aria-roledescription="guitar neck"
        aria-label={`${labels.length === 6 ? "Six" : "Four"} strings. Move the pointer or a finger across them to strum, or press Space.`}
        className="@container-size relative h-full cursor-ns-resize touch-none select-none overflow-hidden rounded-[10px]"
        style={{ background: look.body }}
        onPointerDown={handlePointerDown}
        onPointerMove={updatePointer}
        onPointerLeave={() => {
          if (!activeTouchRef.current) handlePointerEnd();
        }}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {/* Wood, frets and hardware hold no text, so mirroring them is enough for left-handed play. */}
        <div aria-hidden="true" className={cn("absolute inset-0", leftHanded && "-scale-x-100")}>
          <div
            className="absolute inset-y-[6%] left-0 shadow-[0_0_0_1px_rgba(0,0,0,0.25)]"
            style={{ width: pct(NECK_END_PERCENT), background: look.board }}
          />
          <div className="absolute inset-y-[6%] w-[7px] -translate-x-full bg-[#ede6d6]" style={{ left: pct(NUT_PERCENT) }} />
          {FRET_WIRES.map((left, index) => (
            <div key={index} className="absolute inset-y-[6%] w-[3px] bg-[#b9b2a3]/85" style={{ left: pct(left) }} />
          ))}
          {INLAY_FRETS.map((fret) => (
            <div
              key={fret}
              className="absolute top-1/2 size-3 -translate-1/2 rounded-full bg-[#e9e2d2]/55"
              style={{ left: pct(fingerPosition(fret)) }}
            />
          ))}
          {["32%", "68%"].map((top) => (
            <div
              key={top}
              className="absolute size-3 -translate-1/2 rounded-full bg-[#e9e2d2]/55"
              style={{ left: pct(fingerPosition(DOUBLE_INLAY_FRET)), top }}
            />
          ))}

          {look.kind === "soundhole" && (
            <div
              className="absolute left-[85%] top-1/2 size-[min(24cqw,56cqh)] -translate-1/2 rounded-full bg-[#0d0b09]"
              style={{ boxShadow: `0 0 0 8px ${look.rosette}, 0 0 0 11px #2b1a10` }}
            />
          )}
          {look.kind === "single-coil" && (
            <div className="absolute inset-y-[12%] left-[74%] right-[6%] flex justify-between">
              {[0, 1, 2].map((pickup) => (
                <div key={pickup} className="w-[22px] rounded-full bg-[#eee7d8]" />
              ))}
            </div>
          )}
          {look.kind === "humbucker" && (
            <div className="absolute inset-y-[10%] left-[75%] right-[7%] flex justify-between">
              {[0, 1].map((pickup) => (
                <div key={pickup} className="w-[46px] rounded-md border-2 border-[#4a4842] bg-[#2e2d2a]" />
              ))}
            </div>
          )}
          {look.kind === "bass-pickup" && (
            <div className="absolute inset-y-[12%] left-[82%] w-[54px] rounded-lg border-2 border-edge bg-panel" />
          )}
        </div>

        <svg
          aria-hidden="true"
          className="absolute inset-0 z-10 size-full overflow-visible"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
        >
          {labels.map((_, index) => {
            const stringY = positions[index];
            const distance = pointer ? Math.abs(pointer.y - stringY) : 999;
            const pull = pointer && distance < 38 ? (pointer.y - stringY) * (1 - distance / 38) : 0;
            const path = pointer
              ? `M 0 ${stringY} Q ${pointer.x} ${stringY + pull * 1.8} ${VIEWBOX_WIDTH} ${stringY}`
              : `M 0 ${stringY} L ${VIEWBOX_WIDTH} ${stringY}`;
            return (
              <path
                key={`${index}-${pulses[index]}`}
                className={cn(
                  "guitar-string",
                  pulses[index] > 0 && "is-vibrating",
                  frets[index] === null && "is-muted",
                )}
                d={path}
                style={{
                  strokeWidth: look.gauges[index],
                  stroke: index < look.wound ? WOUND_STRING_COLOR : PLAIN_STRING_COLOR,
                }}
              />
            );
          })}
        </svg>

        {frets.map((fret, index) =>
          fret !== null && fret > 0 ? (
            <span
              key={index}
              aria-hidden="true"
              className="absolute z-20 grid size-[26px] -translate-1/2 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-accent-ink shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
              style={{ left: across(fingerPosition(fret)), top: yPercent(positions[index]) }}
            >
              {fret}
            </span>
          ) : null,
        )}

        {pointer && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute z-30 h-[1.3rem] w-4 -translate-1/2 rotate-12 rounded-[55%_55%_70%_70%] bg-accent shadow-[0_4px_12px_rgba(38,13,3,0.38),0_0_0_1px_rgba(255,242,217,0.34)]"
            style={{ left: `${(pointer.x / VIEWBOX_WIDTH) * 100}%`, top: `${(pointer.y / VIEWBOX_HEIGHT) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
