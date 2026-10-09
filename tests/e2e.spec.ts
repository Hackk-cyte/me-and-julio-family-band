import { test, expect, type Page } from '@playwright/test';

async function setRange(page: Page, name: string, value: number) {
  await page.getByRole('slider', { name, exact: true }).evaluate((element, next) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, String(next));
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Test-only instrumentation: real browser nodes and clock, no simulated audio.
    const probe = { sources: [] as any[], gains: [] as any[] };
    (window as any).__audioProbe = probe;
    const sourceFactory = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = sourceFactory.call(this);
      const record = { node: source, context: this, starts: [] as number[][] };
      probe.sources.push(record);
      const start = source.start.bind(source);
      source.start = (when = 0, offset = 0, duration?: number) => {
        record.starts.push([when, offset, duration ?? -1]);
        if (duration === undefined) start(when, offset); else start(when, offset, duration);
      };
      return source;
    };
    const gainFactory = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const gain = gainFactory.call(this);
      const analyser = this.createAnalyser();
      analyser.fftSize = 2048;
      gain.connect(analyser);
      probe.gains.push({ node: gain, analyser });
      return gain;
    };
  });
});

test('the family record plays, pauses, seeks, ends, and spins only while playing', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const broken: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && /\.(m4a|mp3|png|js|css)(\?|$)/.test(response.url())) broken.push(`${response.status()} ${response.url()}`); });
  await page.goto('./');
  await expect(page.locator('h1')).toContainText('Me & Julio');
  await page.getByRole('button', { name: 'The instrumental', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.duration)).toBeGreaterThan(100);
  await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(0.25);
  await expect(page.getByTestId('vinyl')).toHaveClass(/spinning/);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime);
  await page.waitForTimeout(350);
  expect(await page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBeCloseTo(paused, 2);
  await expect(page.getByTestId('vinyl')).not.toHaveClass(/spinning/);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(paused + 0.2);
  await setRange(page, 'Song position', 65);
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThanOrEqual(65);
  await setRange(page, 'Master volume', 0.3);
  expect(await page.locator('audio').evaluate((a: HTMLAudioElement) => a.volume)).toBeCloseTo(0.3 * 0.760339);
  const duration = await page.locator('audio').evaluate((a: HTMLAudioElement) => a.duration);
  await setRange(page, 'Song position', Math.floor((duration - 0.7) * 10) / 10);
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.ended)).toBe(true);
  await expect(page.getByTestId('vinyl')).not.toHaveClass(/spinning/);
  await page.getByRole('button', { name: 'Stop and restart' }).click();
  expect(await page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBe(0);
  expect(errors).toEqual([]);
  expect(broken).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('gift-player.png'), fullPage: true });
});

test('real stems load, share a clock, contain signal, and respond to the mixer', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await page.getByRole('button', { name: 'Explore the band', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
  const tracks = page.locator('article.track');
  await expect(tracks).toHaveCount(4, { timeout: 90_000 });
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mute Lead vocal', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Add singing/ }).click();
  await expect(page.getByRole('button', { name: 'Mute Lead vocal', exact: true })).toHaveAttribute('aria-pressed', 'false');
  const labels = await tracks.locator('h3').allTextContents();
  const starts = await page.evaluate(() => (window as any).__audioProbe.sources.map((s: any) => s.starts[0]));
  expect(starts).toHaveLength(4);
  starts.forEach((start: number[]) => expect(start).toEqual(starts[0]));
  const content = await page.evaluate(() => (window as any).__audioProbe.sources.map((s: any) => {
    const buffer = s.node.buffer as AudioBuffer;
    let peak = 0; let energy = 0; let count = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i += 97) { peak = Math.max(peak, Math.abs(data[i])); energy += data[i] ** 2; count++; }
    }
    return { duration: buffer.duration, peak, rms: Math.sqrt(energy / count) };
  }));
  for (const track of content) { expect(track.duration).toBeGreaterThan(100); expect(track.peak).toBeGreaterThan(0.001); expect(track.rms).toBeGreaterThan(0.00001); }
  await testInfo.attach('decoded-audio-measurements.json', { body: JSON.stringify({ labels, starts, content }, null, 2), contentType: 'application/json' });
  await setRange(page, 'Song position', 45);
  await expect.poll(async () => Number(await page.getByRole('slider', { name: 'Song position', exact: true }).inputValue())).toBeGreaterThanOrEqual(45);
  const gainValues = () => page.evaluate(() => (window as any).__audioProbe.gains.slice(-4).map((g: any) => g.node.gain.value));
  await page.getByRole('button', { name: `Solo ${labels[0]}`, exact: true }).click();
  await expect.poll(async () => (await gainValues()).filter((g: number) => g > 0.0001).length).toBe(1);
  await page.getByRole('button', { name: `Solo ${labels[1]}`, exact: true }).click();
  await expect.poll(async () => (await gainValues()).filter((g: number) => g > 0.0001).length).toBe(2);
  await page.getByRole('button', { name: `Mute ${labels[0]}`, exact: true }).click();
  await expect.poll(async () => (await gainValues())[0]).toBe(0);
  await setRange(page, `${labels[1]} volume`, 0);
  await expect.poll(async () => (await gainValues()).every((g: number) => g === 0)).toBe(true);
  await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
  await expect.poll(async () => (await gainValues()).filter((g: number) => g > 0).length).toBe(4);
  for (let i = 0; i < labels.length; i++) {
    await expect(page.getByRole('button', { name: `Solo ${labels[i]}`, exact: true })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: `Solo ${labels[i]}`, exact: true }).click();
    await expect(page.getByRole('button', { name: `Solo ${labels[i]}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await gainValues()).filter((g: number) => g > 0).length).toBe(1);
    expect((await gainValues())[i]).toBeGreaterThan(0);
    await setRange(page, `${labels[i]} volume`, 0.4);
    await expect.poll(async () => (await gainValues())[i]).toBeCloseTo(0.4, 3);
    await setRange(page, `${labels[i]} volume`, 1);
    await expect.poll(async () => (await gainValues())[i]).toBeCloseTo(1, 3);
    await page.getByRole('button', { name: `Mute ${labels[i]}`, exact: true }).click();
    await expect.poll(async () => (await gainValues()).every((g: number) => g === 0)).toBe(true);
    await expect(page.getByRole('button', { name: `Mute ${labels[i]}`, exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: `Mute ${labels[i]}`, exact: true }).click();
    await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
    await expect.poll(async () => (await gainValues()).filter((g: number) => g > 0).length).toBe(4);
  }
  // Measure real post-gain browser audio, not just nonzero files or changing UI.
  await expect.poll(() => page.evaluate(() => (window as any).__audioProbe.gains.slice(-4).map((g: any) => {
    const data = new Float32Array(2048); g.analyser.getFloatTimeDomainData(data);
    return Math.sqrt(data.reduce((sum, x) => sum + x * x, 0) / data.length);
  }).filter((rms: number) => rms > 0.000001).length), { timeout: 10_000 }).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  const paused = Number(await page.getByRole('slider', { name: 'Song position', exact: true }).inputValue());
  await page.waitForTimeout(350);
  expect(Number(await page.getByRole('slider', { name: 'Song position', exact: true }).inputValue())).toBeCloseTo(paused, 1);
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect.poll(async () => Number(await page.getByRole('slider', { name: 'Song position', exact: true }).inputValue())).toBeGreaterThan(paused + 0.2);
  const resumedStarts = await page.evaluate(() => (window as any).__audioProbe.sources.slice(-4).map((s: any) => s.starts[0]));
  resumedStarts.forEach((start: number[]) => expect(start).toEqual(resumedStarts[0]));
  const duration = Number(await page.getByRole('slider', { name: 'Song position', exact: true }).getAttribute('max'));
  await setRange(page, 'Song position', Math.floor((duration - 0.7) * 10) / 10);
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await expect(page.getByTestId('vinyl')).not.toHaveClass(/spinning/);
  await page.getByRole('button', { name: 'Stop and restart' }).click();
  await expect(page.getByRole('slider', { name: 'Song position', exact: true })).toHaveValue('0');
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('studio-mixer.png'), fullPage: true });
});

test('the full recording is hosted and plays without an external account', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Original recording', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.duration)).toBeGreaterThan(100);
  expect(await page.locator('audio').getAttribute('src')).toContain('original-mix.mp3');
  await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(0.3);
  await expect(page.getByTestId('vinyl')).toHaveClass(/spinning/);
  await page.getByRole('button', { name: 'Stop and restart' }).click();
});

test('bad local audio produces a clear error without uploading the file', async ({ page }) => {
  const uploads: string[] = [];
  page.on('request', request => { if (['POST', 'PUT', 'PATCH'].includes(request.method())) uploads.push(request.url()); });
  await page.goto('./');
  await page.getByRole('button', { name: 'Explore the band', exact: true }).click();
  await page.getByLabel('Import aligned audio tracks').setInputFiles({ name: 'invalid.wav', mimeType: 'audio/wav', buffer: Buffer.from('not audio') });
  await expect(page.getByRole('alert')).toContainText('Could not decode');
  expect(uploads).toEqual([]);
});

test('layout fits the viewport and missing stem requests show a recoverable error', async ({ page }) => {
  await page.route('**/audio/*.mp3', route => route.fulfill({ status: 503, body: 'Test asset unavailable' }));
  await page.goto('./');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.getByRole('img', { name: 'Mom smiling, on her very own record label' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore the band', exact: true }).click();
  await page.getByRole('button', { name: 'Load the instrument parts', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not load');
  await expect(page.getByRole('button', { name: 'PLAY FULL BAND', exact: true })).toBeEnabled();
});
