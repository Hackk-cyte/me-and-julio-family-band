# Me & Julio | The Family Band

A warm record-player gift for Mom, with her portrait on a slowly spinning vinyl record, licensed audio and a real synchronized mixer.

Public website: https://hackk-cyte.github.io/me-and-julio-family-band/ (production verification is recorded in docs/verification.md).

## Listen

- Press **Play Full Band** to hear the supplied full recording, including singing.
- Choose **Explore the band**, then **Add singing** to bring in the separated Paul Simon vocal on the same source timeline.
- Solo one or several parts, mute, adjust volumes, pause, resume, seek, or bookmark a moment.
- **Original recording** plays the supplied complete mix for maximum available fidelity.
- **The instrumental** plays the separately supplied instrumental. It is not combined with the vocal because its timeline differs.
- Optionally load your own aligned stems. Files stay in browser memory and are never uploaded.

## Audio truth

Josh supplied both recordings and confirmed public hosting and separated versions are allowed. The repository does not grant others redistribution rights to the recordings or portrait. The license assertion and technical provenance are documented in [audio reference](docs/audio-reference.md) and [processing notes](docs/audio-processing.md).

The mixer uses Demucs htdemucs machine-separated groups: acoustic/remaining melody, bass, percussion, and vocal. These are estimates, not original multitracks. Bleed and separation artifacts are possible. Two guitar players and cuica cannot be reliably isolated separately. No MIDI, synthesized replacement performance, or EQ-based pretend isolation is used. No claim of listening verification or perfect fidelity is made.

All four stems decode to 7,357,953 stereo frames at 44.1 kHz (166.847 seconds). Gain is baked into exported stems so any combination or fader value from 0 to 1 remains below clipping. Web Audio schedules all tracks on one clock. Short gain ramps suppress switch clicks. The original mix remains available for comparison.

## Develop and verify

Requires Node.js 22 or newer.

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

Open the printed URL with `/me-and-julio-family-band/`. GitHub Pages base path is configured in Vite. The workflow runs unit tests, a production build, desktop/mobile Chromium browser tests, deployment, and hosted browser tests.

For a deployed target:

```sh
BASE_URL=https://hackk-cyte.github.io/me-and-julio-family-band/ npm run test:e2e
```

## Resource and privacy notes

There is no server, analytics, sign-in requirement, background watcher, scheduled system task, or ongoing hosting fee. Hosted stems are decoded sequentially only when requested. The four-track session needs about 225 MiB decoded audio memory at 44.1 kHz. Imports are limited to 12 tracks, 120 MB compressed and 256 MiB decoded per session. During an atomic replacement, the previous and new session coexist temporarily, so total memory can exceed that limit. Devices that cannot decode a file show an error. Mobile Chromium emulation does not establish real iPhone Safari support.

The optional official YouTube player contacts YouTube only when selected. Google Fonts provides typography; system fallbacks remain usable without it. Respect reduced-motion preference: the record then stays still.

## Project files

`src/audio/engine.ts` owns transport and synchronization. `src/audio/catalog.ts` defines the shipped tracks. `public/audio/*manifest.json` records measurements and hashes. `tests` contains browser acceptance tests. `docs` holds provenance and final verification.



## iPhone-first update

The first Play tap uses the supplied full recording, including vocals, without loading four decoded stems. The instrument mixer remains available under Explore the band. Mom's record appears first on phones; buttons and sliders have at least 44px touch areas. Audio interruptions show Resume and recover from a user tap without creating duplicate sources. On browsers with read-only media volume, the full-recording player directs listeners to hardware volume buttons; instrument faders use Web Audio gain controls.

Run `npx playwright install webkit` then `npx playwright test --config playwright.webkit.config.ts` for WebKit checks. This Windows WebKit port has no AudioContext, so its mixer/interruption checks are explicitly skipped. Chromium covers real Web Audio controls and interruption recovery. These tests do not replace physical iPhone Safari, lock-screen, call-interruption or AirPlay testing.
