import { test, expect } from '@playwright/test';

test('official-player error survives play and buffering, then clears only on confirmed playing', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).YT = { Player: class {
      private state = -1;
      private attempts = 0;
      private events: any;
      constructor(_id: string, options: any) {
        this.events = options.events;
        queueMicrotask(() => { this.events.onReady(); this.events.onError({ data: 153 }); });
      }
      playVideo() {
        this.attempts++;
        // First attempt is buffering, not success. Second confirms actual PLAYING.
        this.state = this.attempts === 1 ? 3 : 1;
        this.events.onStateChange();
      }
      pauseVideo() { this.state = 2; this.events.onStateChange(); }
      stopVideo() { this.state = 0; this.events.onStateChange(); }
      getPlayerState() { return this.state; }
      getCurrentTime() { return this.state === 1 ? 1 : 0; }
      getDuration() { return 166.8; }
      setVolume() {}
      seekTo() {}
      destroy() {}
    } };
  });
  await page.goto('./');
  await page.getByText('About the music & privacy', { exact: true }).click();
  await page.getByRole('button', { name: 'Open official YouTube player', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('YouTube 153');
  await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('YouTube 153');
  await expect(page.getByTestId('vinyl')).not.toHaveClass(/spinning/);
  await page.getByRole('button', { name: 'PLAY FULL BAND', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('vinyl')).toHaveClass(/spinning/);
});
