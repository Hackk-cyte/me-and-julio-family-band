# Verification

Verified October 9, 2026.

Public website: https://hackk-cyte.github.io/me-and-julio-family-band/
Repository: https://github.com/Hackk-cyte/me-and-julio-family-band

## Software and production evidence

- TypeScript/Vite production build and 10/10 engine unit tests passed.
- 10/10 real-audio Playwright checks passed locally and independently against the public site in fresh anonymous desktop/mobile Chromium contexts.
- Initial Actions run 37932161627 passed build, Pages deployment and 10 hosted browser tests. Final optional-player correction run 37933101474 also passed build, deployment and all ten hosted tests.
- Main tests cover normal click, actual decoded audio and post-gain signals, solo/multi-solo, mute, faders, singing toggle, full-band restore, pause/resume/seek, ending, errors, imports and responsive layout.
- Uninterrupted public playback completed the entire 166.8470068-second arrangement, with singing enabled. All four sources started at one identical Web Audio timestamp and offset zero. No seeks, pauses, restarts or browser errors occurred. At the natural ending the vinyl stopped and all four output signals were zero.
- The observed maximum displayed-position lag was 0.137 seconds, reflecting the UI refresh interval, not inter-track drift. Audio sources share one clock.
- Anonymous HTTP requests returned 200 for all six audio files and Mom's image. All seven SHA-256 hashes matched the tested local files.
- Optional YouTube error retry was corrected and passed a separate 2/2 desktop/mobile mocked-player regression locally and on the public site. The served fixed JavaScript bundle matched the local build SHA-256. This tests error handling, not YouTube's music availability.

## Audio evidence and limits

- User-supplied recordings are used under the user's asserted permission for this public project and separation. No license document was independently reviewed.
- Four actual Demucs htdemucs estimates: acoustic/remaining melody, bass, percussion and lead vocal. No MIDI or EQ-based pretend isolation.
- Every group has meaningful measured audio and exactly 7,357,953 stereo frames at 44.1 kHz. Worst arbitrary-fader summing bound: 0.879794, below clipping.
- Direct Original recording mode serves the supplied full MP3 byte-for-byte. The separate supplied instrumental is offered in its own mode because its timeline differs.
- Fresh decoded four-part reconstruction versus the source at the documented common gain: stereo correlations 0.999563/0.999485, signal-to-error 30.22 dB, RMS error -49.87 dBFS. No fitted timing or gain correction was used. This measures combined reconstruction accuracy, not individual separation quality.
- These are machine-separated estimates, not original session multitracks. Bleed/artifacts remain possible. The two guitars and cuica cannot be reliably isolated as separate controls.
- No listening-capable audition, real iPhone Safari test, or exact chord/bar/tempo-map transcription was completed. Detailed musical fidelity is not certified.
- Optional public YouTube embed played preroll advertisements during bounded checks. Actual song playback through that external embed remains unverified. The hosted licensed recording and interactive mixer do not depend on YouTube.

## Reproduce

Run npm ci, npm test, npm run build, npx playwright install chromium, then npm run test:e2e. Set BASE_URL to the public website to run the browser suite against production. The repository includes the optional-player error regression as well as the ten core browser checks.

Actions: https://github.com/Hackk-cyte/me-and-julio-family-band/actions
Local evidence retained outside Dropbox under Documents/Codex/runtime/me-and-julio-validation: production-whole-song-soak.json, production-asset-hashes.json, production-playwright-report, production-test-results and the optional-player regression reports. Measurement details are also retained in docs/fidelity-measurement.json in the local project.
