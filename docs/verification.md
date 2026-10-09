# Verification

October 9, 2026. Local verification before publication:
- Production build passed (TypeScript and Vite).
- 10 unit tests passed.
- 10 headless Chromium browser tests passed across desktop and mobile viewport/touch emulation.
- Browser tests use actual delivered audio, shared start timestamps/offsets, post-gain signal measurements, controls, singing toggle, seek/resume/end, loading errors and local imports.
- All four delivered tracks have equal decoded length; worst arbitrary-fader bound is 0.879794. See original-manifest.json.
- No listening-capable audition, real iPhone Safari test, or exact reference transcription has been completed.
- GitHub deployment and hosted tests are pending. The workflow performs them and exposes their results under Actions. A successful push alone is not production proof.
