import { describe, expect, it, vi } from 'vitest';
import { MultitrackEngine } from './engine';

function setup(durations = [180, 180]) {
  const sources: any[] = [];
  const gains: any[] = [];
  const context = {
    currentTime: 5, state: 'running', destination: {},
    resume: vi.fn(async (): Promise<void> => undefined), close: vi.fn(async (): Promise<void> => undefined),
    decodeAudioData: vi.fn(async () => ({ duration: durations.shift() ?? 180, length: 180 * 48000, numberOfChannels: 1 })),
    createBufferSource: vi.fn(() => {
      const source = { buffer: null, onended: null, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      sources.push(source); return source;
    }),
    createGain: vi.fn(() => {
      const gain = { gain: { setValueAtTime: vi.fn(), cancelAndHoldAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
      gains.push(gain); return gain;
    }),
  };
  const file = { size: 4, arrayBuffer: async () => new ArrayBuffer(4) } as File;
  const inputs = [{ id: 'Guitar', file }, { id: 'Bass', file }];
  return { engine: new MultitrackEngine(context as unknown as AudioContext), context, sources, gains, inputs };
}

describe('MultitrackEngine', () => {
  it('unlocks browser audio before any files have loaded', async () => {
    const { engine, context } = setup();
    await engine.unlock();
    expect(context.resume).toHaveBeenCalledOnce();
    expect(engine.getSnapshot().playing).toBe(false);
  });
  it('uses unity gain only for explicitly pre-normalized stems', async () => {
    const { engine, inputs, gains } = setup();
    await engine.load(inputs, true); await engine.play();
    expect(engine.getSnapshot().tracks.every(t => t.volume === 1)).toBe(true);
    expect(gains[0].gain.linearRampToValueAtTime.mock.calls[0][0]).toBe(1);
    engine.setVolume('Guitar', 0.4); engine.fullBand();
    expect(engine.getSnapshot().tracks[0].volume).toBe(1);
  });
  it('starts every source on one shared audio clock and offset', async () => {
    const { engine, inputs, sources } = setup();
    await engine.load(inputs); await engine.play();
    expect(sources).toHaveLength(2);
    expect(sources[0].start).toHaveBeenCalledWith(5.025, 0, 180);
    expect(sources[1].start.mock.calls).toEqual(sources[0].start.mock.calls);
    expect(engine.getSnapshot().tracks.every(t => t.active)).toBe(true);
  });

  it('ramps mute, multi-solo, volume, and full-band restoration without restarting sources', async () => {
    const { engine, inputs, sources, gains } = setup();
    await engine.load(inputs); await engine.play();
    engine.setSolo('Bass', true);
    expect(engine.getSnapshot().tracks.map(t => t.active)).toEqual([false, true]);
    expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 5.015);
    engine.setSolo('Guitar', true);
    expect(engine.getSnapshot().tracks.every(t => t.active)).toBe(true);
    engine.setMute('Bass', true);
    expect(engine.getSnapshot().tracks[1].active).toBe(false);
    engine.setVolume('Guitar', 0);
    expect(engine.getSnapshot().tracks.every(t => !t.active)).toBe(true);
    engine.fullBand();
    expect(engine.getSnapshot().tracks.every(t => t.active && t.volume === 0.8 && !t.solo && !t.mute)).toBe(true);
    expect(sources).toHaveLength(2);
  });

  it('preserves a shared timeline across pause, resume, seeking, and stop', async () => {
    const { engine, inputs, context, sources } = setup();
    await engine.load(inputs); await engine.play();
    context.currentTime = 15.025;
    engine.pause();
    expect(engine.getSnapshot().position).toBeCloseTo(10);
    await engine.play();
    expect(sources[2].start.mock.calls[0][1]).toBeCloseTo(10);
    engine.seek(90);
    expect(sources[4].start.mock.calls).toEqual(sources[5].start.mock.calls);
    expect(sources[4].start.mock.calls[0][1]).toBe(90);
    expect(engine.getSnapshot().position).toBe(90);
    engine.stop();
    expect(engine.getSnapshot()).toMatchObject({ playing: false, position: 0 });
  });

  it('ignores stale ended callbacks and ends exactly at the arrangement duration', async () => {
    const { engine, inputs, sources } = setup();
    await engine.load(inputs); await engine.play();
    const stale = sources[0].onended;
    engine.seek(80); stale();
    expect(engine.getSnapshot().playing).toBe(true);
    sources[2].onended();
    expect(engine.getSnapshot()).toMatchObject({ playing: false, position: 180 });
    await engine.play();
    expect(sources[4].start.mock.calls[0][1]).toBe(0);
  });

  it('retains a working mix after failed or misaligned imports', async () => {
    const { engine, inputs, context } = setup([180, 180, 180, 160]);
    await engine.load(inputs);
    await expect(engine.load(inputs)).rejects.toThrow('same start and length');
    expect(engine.getSnapshot().tracks).toHaveLength(2);
    context.decodeAudioData.mockRejectedValueOnce(new Error('bad codec'));
    await expect(engine.load(inputs)).rejects.toThrow('Could not decode');
    expect(engine.getSnapshot().duration).toBe(180);
  });

  it('validates limits and malformed controls', async () => {
    const { engine, inputs, context } = setup();
    await expect(engine.play()).rejects.toThrow('Load aligned');
    await expect(engine.load([])).rejects.toThrow('between 1 and 12');
    await expect(engine.load([inputs[0], inputs[0]])).rejects.toThrow('unique');
    await expect(engine.load([{ id: 'Huge', file: { size: 90 * 1024 * 1024 } as File }])).rejects.toThrow('80 MB');
    context.decodeAudioData.mockResolvedValueOnce({ duration: 180, length: 100000000, numberOfChannels: 2 });
    await expect(engine.load(inputs)).rejects.toThrow('256 MB');
    expect(() => engine.seek(NaN)).toThrow('finite');
    expect(() => engine.setVolume('Guitar', NaN)).toThrow('finite');
    expect(() => engine.setMute('missing', true)).toThrow('Unknown');
  });

  it('cancels pending play when stopped during browser initialization', async () => {
    const { engine, inputs, context, sources } = setup();
    await engine.load(inputs);
    let resolve!: () => void;
    context.resume.mockImplementationOnce(() => new Promise<void>(r => { resolve = r; }));
    const pending = engine.play(); engine.stop(); resolve(); await pending;
    expect(sources).toHaveLength(0);
  });

  it('reports audio-context start failure and releases the context on disposal', async () => {
    const { engine, inputs, context } = setup();
    await engine.load(inputs); context.state = 'suspended';
    await expect(engine.play()).rejects.toThrow('Tap Play again');
    engine.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    expect(engine.getSnapshot().tracks).toEqual([]);
  });
});
