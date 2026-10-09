export interface TrackInput { id: string; file: File }
export interface TrackState { id: string; mute: boolean; solo: boolean; volume: number; active: boolean }
export interface EngineSnapshot { duration: number; position: number; playing: boolean; tracks: TrackState[] }
interface Track extends Omit<TrackState, 'active'> { buffer: AudioBuffer; source?: AudioBufferSourceNode; gain?: GainNode }

const MAX_DECODED_BYTES = 256 * 1024 * 1024;
const MAX_FILE_BYTES = 80 * 1024 * 1024;
const START_LEAD = 0.025;
const RAMP = 0.015;

/** Browser-local audio only. All sources share one AudioContext clock and start time. */
export class MultitrackEngine {
  private context?: AudioContext;
  private tracks: Track[] = [];
  private duration = 0;
  private position = 0;
  private startedAt = 0;
  private playing = false;
  private generation = 0;
  private playRequest = 0;
  private loadRequest = 0;
  private disposed = false;
  private preNormalized = false;

  constructor(context?: AudioContext) { this.context = context; }

  private getContext(): AudioContext {
    if (this.disposed) throw new Error('The audio player has been closed.');
    if (!this.context) {
      try { this.context = new AudioContext({ sampleRate: 44100 }); }
      catch { throw new Error('This browser could not initialize 44.1 kHz audio. Please try a current browser.'); }
    }
    return this.context;
  }

  /** Invoke directly from the user's click, before asynchronous network loading. */
  async unlock(): Promise<void> {
    const context = this.getContext();
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio could not start. Tap Play again to allow browser audio.');
  }

  async load(inputs: TrackInput[], preNormalized = false): Promise<void> {
    const request = ++this.loadRequest;
    if (!inputs.length || inputs.length > 12) throw new Error('Choose between 1 and 12 aligned audio tracks.');
    if (new Set(inputs.map(t => t.id)).size !== inputs.length || inputs.some(t => !t.id.trim())) {
      throw new Error('Each audio track must have a unique, nonempty name.');
    }
    if (inputs.some(t => !t.file.size || t.file.size > MAX_FILE_BYTES) || inputs.reduce((sum, t) => sum + t.file.size, 0) > 120 * 1024 * 1024) {
      throw new Error('Audio files must be nonempty, at most 80 MB each and 120 MB combined.');
    }
    const context = this.getContext();
    const next: Track[] = [];
    let memory = 0;
    // Sequential decode prevents a burst of concurrent decoder allocations on phones.
    for (const input of inputs) {
      let buffer: AudioBuffer;
      try { buffer = await context.decodeAudioData(await input.file.arrayBuffer()); }
      catch { throw new Error(`Could not decode “${input.id}”. Use a browser-supported audio file.`); }
      if (request !== this.loadRequest || this.disposed) throw new Error('Audio loading was superseded.');
      memory += buffer.length * buffer.numberOfChannels * 4;
      if (memory > MAX_DECODED_BYTES) throw new Error('These decoded tracks exceed the 256 MB audio limit. Use shorter or mono files.');
      if (!Number.isFinite(buffer.duration) || buffer.duration <= 0) throw new Error(`“${input.id}” contains no playable audio.`);
      if (next.length && Math.abs(buffer.duration - next[0].buffer.duration) > 0.075) {
        throw new Error('Tracks must share the same start and length (within 75 ms). Export aligned stems with silence preserved.');
      }
      next.push({ id: input.id, buffer, mute: false, solo: false, volume: preNormalized ? 1 : 0.8 });
    }
    // Commit only after every file passes validation. Failed imports preserve the current mix.
    this.stop();
    this.tracks = next;
    this.preNormalized = preNormalized;
    this.duration = Math.min(...next.map(t => t.buffer.duration));
  }

  async play(): Promise<void> {
    if (!this.tracks.length) throw new Error('Load aligned audio tracks before playing.');
    if (this.playing) return;
    const request = ++this.playRequest;
    const context = this.getContext();
    await context.resume();
    if (request !== this.playRequest || this.disposed) return;
    if (context.state !== 'running') throw new Error('Audio could not start. Tap Play again to allow browser audio.');
    if (this.position >= this.duration) this.position = 0;
    this.startSources();
  }

  private startSources(): void {
    const context = this.getContext();
    const start = context.currentTime + START_LEAD;
    const generation = ++this.generation;
    this.startedAt = start;
    this.playing = true;
    for (const track of this.tracks) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = track.buffer;
      source.connect(gain);
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(this.targetGain(track), start + RAMP);
      source.onended = () => {
        if (generation !== this.generation || !this.playing) return;
        this.position = this.duration;
        this.playing = false;
        this.releaseSources(false);
      };
      track.source = source;
      track.gain = gain;
      source.start(start, this.position, this.duration - this.position);
    }
  }

  private currentPosition(): number {
    return this.playing && this.context
      ? Math.min(this.duration, this.position + Math.max(0, this.context.currentTime - this.startedAt))
      : this.position;
  }

  private releaseSources(fade = true): void {
    ++this.generation;
    const now = this.context?.currentTime ?? 0;
    for (const track of this.tracks) {
      const source = track.source;
      const gain = track.gain;
      if (source) {
        source.onended = () => { source.disconnect(); gain?.disconnect(); };
        if (fade && gain) {
          gain.gain.cancelAndHoldAtTime(now);
          gain.gain.linearRampToValueAtTime(0, now + RAMP);
        }
        try { source.stop(now + (fade ? RAMP : 0)); } catch { /* Already ended. */ }
        if (!fade) { source.disconnect(); gain?.disconnect(); }
      }
      track.source = undefined;
      track.gain = undefined;
    }
  }

  pause(): void {
    ++this.playRequest;
    this.position = this.currentPosition();
    this.playing = false;
    this.releaseSources();
  }

  stop(): void { this.pause(); this.position = 0; }

  seek(seconds: number): void {
    if (!Number.isFinite(seconds)) throw new Error('Seek position must be a finite number.');
    const wasPlaying = this.playing;
    this.pause();
    this.position = Math.max(0, Math.min(this.duration, seconds));
    if (wasPlaying && this.position < this.duration) this.startSources();
  }

  private track(id: string): Track {
    const track = this.tracks.find(t => t.id === id);
    if (!track) throw new Error(`Unknown audio track: ${id}`);
    return track;
  }

  private audible(track: Track): boolean {
    return !track.mute && (!this.tracks.some(t => t.solo) || track.solo) && track.volume > 0;
  }

  private targetGain(track: Track): number {
    // Hosted stems may use unity only after external sum/solo peak validation.
    // Arbitrary local imports retain conservative summed-peak headroom.
    return this.audible(track) ? track.volume * (this.preNormalized ? 1 : 0.9 / Math.max(1, this.tracks.length)) : 0;
  }

  private updateGains(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    for (const track of this.tracks) {
      if (!track.gain) continue;
      track.gain.gain.cancelAndHoldAtTime(now);
      track.gain.gain.linearRampToValueAtTime(this.targetGain(track), now + RAMP);
    }
  }

  setMute(id: string, value: boolean): void { this.track(id).mute = value; this.updateGains(); }
  setSolo(id: string, value: boolean): void { this.track(id).solo = value; this.updateGains(); }
  setVolume(id: string, value: number): void {
    if (!Number.isFinite(value)) throw new Error('Volume must be a finite number.');
    this.track(id).volume = Math.max(0, Math.min(1, value));
    this.updateGains();
  }

  fullBand(): void {
    for (const track of this.tracks) { track.mute = false; track.solo = false; track.volume = this.preNormalized ? 1 : 0.8; }
    this.updateGains();
  }

  getSnapshot(): EngineSnapshot {
    return {
      duration: this.duration, position: this.currentPosition(), playing: this.playing,
      tracks: this.tracks.map(t => ({ id: t.id, mute: t.mute, solo: t.solo, volume: t.volume, active: this.playing && this.audible(t) })),
    };
  }

  dispose(): void {
    this.stop();
    this.releaseSources(false);
    ++this.loadRequest;
    this.tracks = [];
    this.duration = 0;
    this.disposed = true;
    void this.context?.close().catch(() => undefined);
  }
}
