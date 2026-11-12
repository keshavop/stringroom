export function getCrossedStringIndexes(
  previousY: number,
  currentY: number,
  stringPositions: readonly number[],
  lastTriggeredAt: readonly number[],
  now: number,
  debounceMs = 52,
): number[] {
  const crossed = stringPositions
    .map((stringY, index) => ({ stringY, index }))
    .filter(
      ({ stringY, index }) =>
        ((previousY < stringY && currentY >= stringY) ||
          (previousY > stringY && currentY <= stringY)) &&
        now - lastTriggeredAt[index] > debounceMs,
    )
    .map(({ index }) => index);

  return currentY < previousY ? crossed.reverse() : crossed;
}

/**
 * Louder for faster sweeps. `sensitivity` 0–100 scales the response:
 * 50 is the default, 0 halves it, 100 makes it 1.5× as strong.
 */
export function velocityFromPointerMovement(deltaY: number, elapsedMs: number, sensitivity = 50): number {
  const speed = Math.abs(deltaY) / Math.max(8, elapsedMs);
  const factor = 0.5 + Math.min(100, Math.max(0, sensitivity)) / 100;
  return Math.min(1, 0.4 + speed * 0.2 * factor);
}
