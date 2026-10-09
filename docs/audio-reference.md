# Audio reference and provenance

Research date: October 9, 2026. Initial research identified an official embedded-player route. The user subsequently supplied audio and explicitly confirmed hosting and separated-version permission. Only user-supplied files were processed; no streaming source was ripped or downloaded. Source-separation outputs are estimates, not original stems.

## Original studio recording

- The artist's [album page](https://www.paulsimon.com/music/paul-simon/) identifies the self-titled 1972 album and distinguishes the album track from its 1971 demo.
- [Official Audio](https://www.youtube.com/watch?v=JVdlpZ4M-Hw), video ID `JVdlpZ4M-Hw`, is the recommended original-recording source. The search result identifies Paul Simon's Official Artist Channel. A live YouTube oEmbed request returned the exact Official Audio title, author `PaulSimonVEVO`, and an iframe URL for this video.
- A separate [label-delivered album upload](https://www.youtube.com/watch?v=1cs6U097kNQ) credits Legacy Recordings and states the 1972 Sony Music copyright. This is an alternate reference, not a separately licensed file.
- Do not substitute [Official Video](https://www.youtube.com/watch?v=Z6VrKro8djw) or a concert recording without clearly identifying the version.
- [Qobuz album metadata](https://www.qobuz.com/us-en/album/paul-simon-paul-simon/0884977674514) lists the album track at 2:44. Do not hard-code this as a measured endpoint; obtain actual duration from the selected player.

## Verified performance credits

[Apple Music's track credits](https://music.apple.com/us/song/703069453) identify:

| Performance | Performer | Evidence limit |
|---|---|---|
| Vocal and acoustic guitar | Paul Simon | Does not disclose separate stem count |
| Acoustic guitar | David Spinozza | Does not establish channel assignment |
| Bass | Russell George | Exact note-by-note line not verified |
| Percussion | Airto Moreira | Does not specify every percussion overdub |

Flora Purim, speaking in an [interview with Airto Moreira](https://farofafa.com.br/2019/02/21/gaiolas-abertas/), explicitly identifies Airto's cuica on this song. [Rolling Stone's album discussion](https://au.rollingstone.com/music/music-features/paul-simon-1972-solo-album-rob-sheffield-36481/) also identifies cuica and Simon's whistle solo. A whistle layer is thus a relevant additional part; piano, electric lead guitar, drum kit, brass, or backing singers must not be invented from generic band assumptions.

## Musical map and remaining evidence gaps

The [official song page](https://www.paulsimon.com/en-ca/track/me-and-julio-down-by-the-schoolyard-10/) supports this broad lyric-section order: opening narrative, short law refrain, second narrative, main refrain, later arrest/release narrative, returning main refrain. It does not timestamp instrumental passages. The whistle feature requires an instrumental passage in a faithful arrangement, but its precise placement and boundaries remain unverified by audition in this research.

[Musicnotes' published arrangement metadata](https://www.musicnotes.com/sheetmusic/paul-simon/me-and-julio-down-by-the-schoolyard/MN0108908_D6) identifies A major as the original published key and its arrangement marking as quarter note = 106 in 4/4. These are score metadata, not measured studio tempo or a tempo-variation map. Do not present a rigid 106 BPM grid as a verified master transcription.

Simon describes composing from a percussion figure originating with Victor Montanez in [Don Heckman's 1972 interview](https://irom.wordpress.com/2009/05/12/q-a-from-the-archives-paul-simon-1972/). This is compositional history, not proof of a final-master Montanez stem or an instruction to generate a repeating placeholder loop.

Still requiring a legitimate listening-capable reference session: exact section timestamps, all chord changes and voicings, bass movement, the two guitar patterns, measured tempo drift, percussion entrances and accents, whistle boundaries, transitions, and the precise ending. No exact timestamp/chord transcription is asserted here. No listening audition was performed by this researcher.

## Embed implementation requirements

- Use the [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference) for real play, pause, seek, stop, volume, state, and duration.
- Keep the embedded player visible and usable. Do not turn it into a hidden audio source or obscure YouTube controls and branding.
- [YouTube embedding help](https://support.google.com/youtube/answer/171780?hl=en) documents privacy-enhanced `youtube-nocookie.com` embeds and requires a HTTP Referer. Use `strict-origin-when-cross-origin`, pass the real application origin, and do not use `no-referrer`. Missing identification can cause error 153.
- oEmbed success establishes that YouTube offers embed markup. It does not prove playback in the final browser, region, device, or account state. Production must observe player PLAYING state and advancing time after a normal click. Handle restrictions and autoplay blocking explicitly.
- The external player exposes one finished mix. It does not expose individual guitar, bass, percussion, or vocal stems. Never simulate isolation with EQ or fake controls.

## Rights-cleared multitrack status

### Final unified singing session

The user later supplied `Licenced Audio 10-09-2026.mp3` as the licensed original vocal-and-music recording and requested an Add singing control in this public application. The earlier explicit confirmation covered hosting and separated versions of the supplied instrumental; the later request to add singing from the newly supplied licensed full mix authorizes its use and vocal separation for this same public project by implication. No separate license text was supplied for either file, and no broader redistribution license is granted by this repository. Its MP3 stream is stereo at 48 kHz, 166.847 seconds. Independent RMS-envelope comparison against the earlier instrumental found a consistent approximately 0.70-second offset in three 30-second windows. This is screening evidence, not sample-perfect musical alignment.

The application therefore uses four groups derived from that one full mix for the unified singing session: estimated guitars/remaining accompaniment, estimated bass, estimated percussion, and estimated singing. Every group shares the same decoded source sample timeline. The guitar remainder equals source minus all three named estimates so all content, including model residuals, is preserved. Add singing changes the gain of the already synchronized vocal group; it does not overlay the separate instrumental file. Source attribution as the original is based on the user's identification, not independently established by listening or a rights-holder fingerprint. No singer or instrument is generated.

### User-supplied instrumental, later evidence

The user subsequently supplied `C:\Users\Unknown\Downloads\Licenced Instrumental 10-09-2026.mp4`, described it as licensed, and explicitly confirmed permission for public hosting and separated versions. The parent agent reports AAC stereo, 44.1 kHz, approximately 165.14 seconds. Independent directory inspection confirms the named file exists and is 3,977,014 bytes. Publication relies on the user's explicit rights confirmation; no separate written license or rights-holder document was supplied. This file is a stereo instrumental mix, not verified original studio stems. Attribution, performer identity, correspondence to the original recording, and musical fidelity require further evidence.

Following that confirmation, Demucs 4.0.1 and PyTorch 2.5.1 were installed in an isolated non-Dropbox runtime. The first finite processing job created three instrumental groups: estimated bass, estimated percussion, and guitars plus remaining melody. These earlier outputs are retained only in `old/instrumental-separation/`, outside the deployed public assets; the final singing session uses the four groups described above from a second finite job. Both sessions use the official `htdemucs` model. These are estimated separated parts, not original stems or newly recorded performances. Bleed and artifacts are expected. The two guitar performers and cuica alone are not individually isolated.

No freely public-distributable original or cover stem package was identified by targeted searches for this title plus stems, multitrack, and licensing. Search results included MIDI products and paid cover-licensing offers; neither grants this project public distribution permission. This is a bounded search result, not a claim that no licensable stems exist anywhere.

The active public audio paths are the separately supplied instrumental, the supplied vocal-and-music mix, its four model-separated groups, and the optional official embedded player subject to its playback permissions and platform terms. The instrumental file is not independently authenticated as a particular performance or master. A separate local-only import feature supports additional user-supplied authorized tracks without uploading them.

## Repeatable verification plan

1. Verify official source title and artist and obtain live duration.
2. Test the public embed without login: normal click, PLAYING state, advancing time, pause, resume, seek, stop, end.
3. If authorized stems become available, log asset provenance and permission scope before publication; verify all tracks share timeline origin, sample rate handling, and expected duration.
4. With a listening-capable tool, annotate section boundaries against the official player and record the method and uncertainty. Never infer fidelity from passing code tests.
5. Test individual and combined stem signals, sample-aligned seek/resume, gain ramps, peak levels, and meaningful audio content. Assess instrument realism through an actual audition. Missing stems or missing audition remain explicit limitations.
