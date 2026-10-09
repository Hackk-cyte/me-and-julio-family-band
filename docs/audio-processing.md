# Audio processing and operating impact

The user explicitly authorized public hosting of the supplied instrumental and separated versions. They then supplied the licensed vocal-and-music file and requested adding its singing to this public application, which implies authorization to use and separate that file for the same project. Publication relies on these instructions, not an independently reviewed license document. No streaming audio was downloaded or separated.

## Unified singing session

The later user-supplied `Licenced Audio 10-09-2026.mp3` is retained as `public/audio/original-mix.mp3`. Its four derived groups are `original-acoustic.mp3`, `original-bass.mp3`, `original-percussion.mp3`, and `vocal.mp3`. All share the same full-mix source timeline, avoiding the approximately 0.70-second offset measured between this file and the separately supplied instrumental. The Add singing control must operate on these groups, not combine the vocal with the earlier instrumental. `original-manifest.json` records this session's measured duration, peak levels, shared attenuation and hashes. Earlier instrumental assets remain a distinct source, documented below.

Measured delivery results: all four MP3s decode to exactly 7,357,953 stereo frames at 44.1 kHz, 166.8470068 seconds. Their common attenuation of 0.7150765755 is already baked into the assets. Peak across all 15 nonempty mute/solo combinations is 0.794013; the conservative arbitrary-fader bound is 0.879794 for gains from zero to one. Individual decoded RMS values are 0.05204 (accompaniment), 0.05704 (bass), 0.02767 (percussion), and 0.05613 (singing). Uncompressed groups reconstruct the source with maximum absolute floating-point error 1.1921e-7. This proves signal, alignment and headroom, not clean isolation or perceptual fidelity. The direct full mix should receive gain 0.7150765755 for matched level; the untouched source has decoded sample peak 1.01624. No direct-source clipping repair or re-encoding was performed.

## Earlier instrumental processing job (retained evidence)

- Source: the user-supplied `Licenced Instrumental 10-09-2026.mp4`.
- Separate instrumental mode: `public/audio/instrumental.m4a`, direct AAC remux with no re-encoding. The default interactive session uses the later four-group vocal-and-music source above.
- Processing tool: [Meta Demucs 4.0.1](https://github.com/facebookresearch/demucs), MIT-licensed software; PyTorch 2.5.1, `htdemucs` checkpoint `955717e8-8726e21a.th`, downloaded from the tool's official Meta model endpoint. Tool licensing does not grant rights to any input music.
- Separation: CPU inference, four Torch threads, one interop thread, four-second model segments, 25% overlap, one deterministic seeded shift pass. No GPU inference, service, scheduled task, startup registration, or persistent process.
- Outputs: estimated bass, estimated drum/percussion group, and guitars plus remaining melody. The remainder equals source minus estimated bass minus estimated percussion. It retains model residual content so the uncompressed groups reconstruct the source within floating-point tolerance.
- Encoding: MP3, 256 kbps, shared 44.1 kHz stereo timeline, gapless metadata. All groups receive one shared attenuation factor; no independent normalization changes the intended balance.
- Safety: shared attenuation bounds the sum of absolute sample contributions to 0.88 before encoding. Every nonempty mute/solo combination and the arbitrary-fader sample bound were remeasured after decoding the MP3s. See `old/instrumental-separation/manifest.json` for earlier-session measurements and file hashes. The three earlier MP3 groups and manifest remain in that holding folder with matching hashes; they are excluded from deployment. Active-session measurements are in `public/audio/original-manifest.json`.

## Resource assessment and reversibility

Before processing: 63.46 GB installed RAM, approximately 9.58 GB free, CPU load approximately 62%, more than 5 TB disk free. The NVIDIA RTX 5090 Laptop GPU was left unused for inference. The only model process was assigned BelowNormal priority. The short-segment CPU job avoids competing persistent helpers and terminates when the finite file is processed.

Environment, model cache, uncompressed intermediates, processing scripts and installation cache are isolated at `C:\Users\Unknown\Documents\Codex\runtime\me-and-julio-audio`. These are retained local files, not startup components. No background behavior persists after the job. No source files, credentials, drivers, services or system settings were changed. The generated public audio and this documentation are task deliverables in the project. Reversal means selecting the unchanged direct instrumental instead of estimated groups; removal of retained runtime files is an optional user-authorized cleanup, not required for normal operation.

## Honest limitations

These are model estimates from user-supplied stereo mixes, not isolated original studio multitracks. They may contain bleed or separation artifacts. The guitar group is not two isolated guitar performers; percussion is not a separately isolated cuica. The singing estimate is extracted only from the vocal-and-music source, never fabricated. Numerical analysis proves content, timeline length, reconstruction and peak properties only. No listening-capable audition was performed, and faithful reproduction of the original studio performance is not established.
