import { distortionCurve, karplusStrong, midiToFrequency } from "./dsp";
import type { GuitarEffect, GuitarId, GuitarPreset } from "./types";

interface LoadedSample {
  midi: number;
  buffer: AudioBuffer;
}

interface PresetRuntime {
  preset: GuitarPreset;
  /** Notes connect here; the preset's effect chain runs from here to the master bus. */
  input: GainNode;
  samples: LoadedSample[];
}

/**
 * One AudioContext shared by every guitar. Each preset gets its own effect
 * chain into a common master gain, so switching guitars never cuts off notes
 * that are still ringing on the previous one.
 */
export class GuitarAudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Catches peaks after the master volume so loud strums never clip. */
  private limiter: DynamicsCompressorNode | null = null;
  private runtimes = new Map<GuitarId, PresetRuntime>();
  private loading = new Map<GuitarId, Promise<PresetRuntime>>();
  private bufferCache = new Map<string, Promise<AudioBuffer>>();
  private synthCache = new Map<string, AudioBuffer>();
  private sources = new Set<AudioBufferSourceNode>();
  private active: PresetRuntime | null = null;
  private requested: GuitarId | null = null;
  private volume: number;
  private muted = false;

  constructor(volume: number) {
    this.volume = volume;
  }

  /** Creates the AudioContext (call from a user gesture) and loads `preset`. */
  async initialize(preset: GuitarPreset): Promise<void> {
    if (!this.context) {
      this.context = new window.AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.limiter = this.context.createDynamicsCompressor();
      this.limiter.threshold.value = -6;
      this.limiter.knee.value = 0;
      this.limiter.ratio.value = 20;
      this.limiter.attack.value = 0.002;
      this.limiter.release.value = 0.2;
      this.master.connect(this.limiter).connect(this.context.destination);
    }
    await this.context.resume();
    await this.setPreset(preset);
  }

  get activePresetId(): GuitarId | null {
    return this.active?.preset.id ?? null;
  }

  /**
   * Loads `preset` if needed and routes new notes to it. If another preset is
   * requested while this one loads, the later request wins.
   */
  async setPreset(preset: GuitarPreset): Promise<void> {
    this.requested = preset.id;
    const runtime = await this.load(preset);
    if (this.requested === preset.id) this.active = runtime;
  }

  private load(preset: GuitarPreset): Promise<PresetRuntime> {
    const ready = this.runtimes.get(preset.id);
    if (ready) return Promise.resolve(ready);
    const pending = this.loading.get(preset.id);
    if (pending) return pending;

    const promise = (async () => {
      const context = this.requireContext();
      const voice = preset.voice;
      const samples =
        voice.kind === "samples"
          ? await Promise.all(
              voice.samples.map(async (sample) => ({
                midi: sample.midi,
                buffer: await this.fetchBuffer(`${voice.sampleBasePath}/${sample.file}`),
              })),
            )
          : [];
      const input = context.createGain();
      input.gain.value = preset.gain;
      this.connectChain(input, preset.effects);
      const runtime: PresetRuntime = { preset, input, samples: samples.sort((a, b) => a.midi - b.midi) };
      this.runtimes.set(preset.id, runtime);
      return runtime;
    })();

    this.loading.set(preset.id, promise);
    promise.finally(() => this.loading.delete(preset.id)).catch(() => {});
    return promise;
  }

  private fetchBuffer(url: string): Promise<AudioBuffer> {
    const cached = this.bufferCache.get(url);
    if (cached) return cached;
    const promise = (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${url}`);
      return this.requireContext().decodeAudioData(await response.arrayBuffer());
    })();
    this.bufferCache.set(url, promise);
    promise.catch(() => this.bufferCache.delete(url));
    return promise;
  }

  private connectChain(input: AudioNode, effects: readonly GuitarEffect[]): void {
    const context = this.requireContext();
    let tail: AudioNode = input;
    const append = (node: AudioNode) => {
      tail.connect(node);
      tail = node;
    };

    for (const effect of effects) {
      switch (effect.type) {
        case "filter": {
          const filter = context.createBiquadFilter();
          filter.type = effect.filter;
          filter.frequency.value = effect.frequency;
          if (effect.q !== undefined) filter.Q.value = effect.q;
          if (effect.gain !== undefined) filter.gain.value = effect.gain;
          append(filter);
          break;
        }
        case "distortion": {
          const shaper = context.createWaveShaper();
          shaper.curve = distortionCurve(effect.drive);
          shaper.oversample = "4x";
          append(shaper);
          break;
        }
        case "cabinet": {
          // A guitar speaker barely reproduces below ~80 Hz or above ~5 kHz,
          // with a presence bump in between.
          const low = context.createBiquadFilter();
          low.type = "highpass";
          low.frequency.value = 80;
          const presence = context.createBiquadFilter();
          presence.type = "peaking";
          presence.frequency.value = 1600;
          presence.Q.value = 0.9;
          presence.gain.value = 2.5;
          const high = context.createBiquadFilter();
          high.type = "lowpass";
          high.frequency.value = 4800;
          high.Q.value = 0.7;
          append(low);
          append(presence);
          append(high);
          break;
        }
        case "gain": {
          const trim = context.createGain();
          trim.gain.value = effect.gain;
          append(trim);
          break;
        }
        case "compressor": {
          const compressor = context.createDynamicsCompressor();
          compressor.threshold.value = effect.threshold;
          compressor.ratio.value = effect.ratio;
          append(compressor);
          break;
        }
      }
    }
    tail.connect(this.master!);
  }

  private synthBuffer(runtime: PresetRuntime, midi: number): AudioBuffer {
    const key = `${runtime.preset.id}:${midi}`;
    const cached = this.synthCache.get(key);
    if (cached) return cached;
    const voice = runtime.preset.voice;
    if (voice.kind !== "pluck-synth") throw new Error("Preset does not synthesize notes");
    const context = this.requireContext();
    const data = karplusStrong(midiToFrequency(midi), context.sampleRate, voice.decaySeconds + 0.2, voice.brightness, voice.decaySeconds);
    const buffer = context.createBuffer(1, data.length, context.sampleRate);
    buffer.copyToChannel(data, 0);
    this.synthCache.set(key, buffer);
    return buffer;
  }

  async resume(): Promise<void> {
    if (this.context?.state === "suspended") await this.context.resume();
  }

  async suspend(): Promise<void> {
    if (this.context?.state === "running") await this.context.suspend();
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.updateMasterGain();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateMasterGain();
  }

  /**
   * Plays one string. On a 12-string, `stringIndex` picks the partner string
   * of that course, which sounds a few milliseconds later and slightly detuned.
   */
  play(midi: number, velocity: number, delaySeconds = 0, pan = 0, stringIndex?: number): void {
    const runtime = this.active;
    if (!this.context || !runtime || this.muted) return;
    const when = this.context.currentTime + Math.max(0, delaySeconds);
    this.voice(runtime, midi, velocity, when, pan, 0);

    const courses = runtime.preset.courses;
    if (courses && stringIndex !== undefined && courses.octaveOffsets[stringIndex] !== undefined) {
      this.voice(
        runtime,
        midi + courses.octaveOffsets[stringIndex],
        velocity * 0.8,
        when + 0.012,
        pan * -0.6,
        courses.detuneCents,
      );
    }
  }

  private voice(runtime: PresetRuntime, midi: number, velocity: number, when: number, pan: number, detuneCents: number) {
    const context = this.requireContext();
    let buffer: AudioBuffer;
    let rate = 1;
    if (runtime.preset.voice.kind === "samples") {
      if (runtime.samples.length === 0) return;
      const nearest = runtime.samples.reduce((best, sample) =>
        Math.abs(sample.midi - midi) < Math.abs(best.midi - midi) ? sample : best,
      );
      buffer = nearest.buffer;
      rate = 2 ** ((midi - nearest.midi) / 12);
    } else {
      buffer = this.synthBuffer(runtime, midi);
    }

    const release = runtime.preset.release;
    const source = context.createBufferSource();
    const noteGain = context.createGain();
    const panner = context.createStereoPanner();

    source.buffer = buffer;
    source.playbackRate.value = rate;
    source.detune.value = detuneCents;
    noteGain.gain.setValueAtTime(Math.max(0.08, Math.min(1, velocity)), when);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, when + release);
    panner.pan.value = Math.max(-1, Math.min(1, pan));

    source.connect(noteGain).connect(panner).connect(runtime.input);
    this.sources.add(source);
    source.addEventListener("ended", () => this.sources.delete(source), { once: true });
    source.start(when);
    source.stop(when + Math.min(release + 0.5, buffer.duration / rate));
  }

  /**
   * A live stream of everything the guitar plays, tapped off the master bus
   * for recording. Call `release` when done so the tap is disconnected.
   */
  openRecordingTap(): { stream: MediaStream; release: () => void } {
    const context = this.requireContext();
    const output = this.limiter!;
    const destination = context.createMediaStreamDestination();
    output.connect(destination);
    return {
      stream: destination.stream,
      release: () => {
        try {
          output.disconnect(destination);
        } catch {
          // Already disconnected (e.g. the engine was destroyed).
        }
        for (const track of destination.stream.getTracks()) track.stop();
      },
    };
  }

  async destroy(): Promise<void> {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        // The source may have already finished between iteration and cleanup.
      }
    }
    this.sources.clear();
    await this.context?.close();
    this.context = null;
    this.master = null;
    this.limiter = null;
    this.runtimes.clear();
    this.loading.clear();
    this.bufferCache.clear();
    this.synthCache.clear();
    this.active = null;
  }

  private requireContext(): AudioContext {
    if (!this.context) throw new Error("Audio engine is not initialized");
    return this.context;
  }

  private updateMasterGain(): void {
    if (!this.context || !this.master) return;
    const target = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(target, this.context.currentTime, 0.02);
  }
}
