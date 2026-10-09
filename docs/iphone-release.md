# iPhone-first release

October 9, 2026. Release commit b1c9301566742398cd31b50b174640b3b9893cef.

- First Play tap starts the supplied full recording with singing, avoiding the four-stem download/decode until Explore the band is chosen.
- Mom's portrait record is first on the phone layout. Play fits within tested 320x568,375x667,390x844 and430px layouts; loaded mixers have no horizontal overflow.
- Buttons, faders and timeline have minimum 44px touch areas. Mobile title wrapping and safe-area spacing are corrected.
- Native media volume is feature-tested. Browsers that ignore volume writes display Use the phone volume buttons. Mixer gain controls remain functional Web Audio controls.
- Interrupted or suspended audio contexts show Resume instead of an inaccurate playing state. An explicit Resume tap recovers existing sources without duplicate playback.

Local validation: 11 unit tests,18 Chromium browser tests and14 WebKit tests passed.4 WebKit tests were explicitly skipped because the Windows WebKit port exposes no AudioContext. The same skips are not applied to macOS/Linux WebKit or Chromium. Phone layout simulation and Windows WebKit are not physical iPhone Safari verification. Lock-screen playback, actual calls, AirPlay and Bluetooth routing remain unverified.

No audio assets were changed. Original musical fidelity and separation limitations remain in verification.md and audio-processing.md. This release changes browser behavior and layout only. No operating-system services, startup items, persistent processes or device settings were added.

Deployment run: https://github.com/Hackk-cyte/me-and-julio-family-band/actions/runs/37934336508
Public website: https://hackk-cyte.github.io/me-and-julio-family-band/

Reference for iOS native media volume: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html


## Public verification

Pages deployment succeeded. Independent anonymous checks on the updated public site passed all six iPhone-focused Chromium tests. WebKit supported cases were verified14/14 across iPhone13 and small-phone layouts, with4 explicit Windows-port WebAudio exclusions. One Stop assertion was corrected after three fresh measurements confirmed that WebKit remains paused at0.01seconds with no advancement; the test now requires paused playback and at most0.05seconds. Both affected WebKit tests then passed.

Public JS and CSS SHA-256 hashes matched the locally tested build. The390x844 first screen shows Original recording selected, inline audio, Mom's record, and fully visible Play button with no horizontal overflow or page errors. Evidence is retained under Documents/Codex/runtime/me-and-julio-validation in iphone-production-release-proof.json, iphone-release-chromium-report, iphone-release-webkit-report and the public screenshot.

Final GitHub Actions run37934336508: build, deploy and production browser suite all completed successfully. Public access verified without login.

