/** Pure signal-processing helpers, kept free of Web Audio so they can be unit tested. */

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * Renders one plucked note with the Karplus–Strong algorithm: a burst of noise
 * circulates through a delay line one period long, and an averaging filter in
 * the loop softens it the way a real string loses its high harmonics.
 *
 * @param brightness 0–1. Lower values pre-filter the pluck for a softer, nylon-like attack.
 * @param decaySeconds Time for the note to fall to roughly -60 dB.
 */
export function karplusStrong(
  frequency: number,
  sampleRate: number,
  durationSeconds: number,
  brightness: number,
  decaySeconds: number,
  random: () => number = Math.random,
): Float32Array<ArrayBuffer> {
  const period = Math.max(2, Math.round(sampleRate / frequency));
  const length = Math.max(period, Math.floor(sampleRate * durationSeconds));
  const output = new Float32Array(length);
  const line = new Float32Array(period);

  const smoothing = Math.min(1, Math.max(0.05, brightness));
  let previous = 0;
  for (let i = 0; i < period; i += 1) {
    previous += smoothing * (random() * 2 - 1 - previous);
    line[i] = previous;
  }

  // Loss per trip round the loop so the note reaches 0.001 after decaySeconds.
  const loopGain = 0.001 ** (1 / Math.max(1, decaySeconds * frequency));

  let peak = 0;
  for (let i = 0; i < length; i += 1) {
    const index = i % period;
    const sample = line[index];
    output[i] = sample;
    peak = Math.max(peak, Math.abs(sample));
    line[index] = loopGain * 0.5 * (sample + line[(index + 1) % period]);
  }

  // Normalise, then fade the last 30 ms so the buffer ends without a click.
  const scale = peak > 0 ? 0.9 / peak : 0;
  const fade = Math.min(length, Math.floor(sampleRate * 0.03));
  for (let i = 0; i < length; i += 1) {
    const tail = i >= length - fade ? (length - 1 - i) / fade : 1;
    output[i] *= scale * tail;
  }
  return output;
}

/** A soft-clipping transfer curve for a WaveShaperNode. `drive` 0–1. */
export function distortionCurve(drive: number, points = 2048): Float32Array<ArrayBuffer> {
  const k = Math.max(0, Math.min(1, drive)) * 120;
  const curve = new Float32Array(points);
  for (let i = 0; i < points; i += 1) {
    const x = (i / (points - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}
