# auto-video-ai: « It Actually Happened » Shorts studio

Toolkit used by Claude to make vertical (1080x1920, 30 fps) animated history Shorts in **English** for the channel
« It Actually Happened » (YouTube + Instagram @faitsfouss + TikTok). Flat 2D cartoon characters (bean heads, ink
outlines) on painted 2D backgrounds, a free TTS voice-over, synthesized music/SFX, and word-by-word captions.

## Owner's rules (always)
- **Maximum quality every time**, even if it takes longer.
- Everything must stay **free**: no paid voices, no paid video generators.
- **Every sentence must have an image that shows what is said** (numbers, dates and places on screen when spoken; one
  clear picture per key word such as "Knights" → a knight, "Archers" → archers). Check with a per-sentence sheet before delivering.
- Topics: trending, true, verified with a web search, **not already overdone** (no English Short above ~100k views,
  not posted by several channels in the last month). Prefer the true version of a story over the viral myth.
- Original characters and shots only. Never copy another creator's video.
- Voice: calm female storyteller, Kokoro `af_heart`, speed ~0.94. Claude cannot hear audio: tell the owner to check names' pronunciation.
- Music and SFX at 50 % (−6 dB) of the voice's gated RMS; final loudness ~−14 LUFS.

## Quality bar (built in war-of-the-bucket v3 — reuse these helpers from its main.js)
- ~32 shots for 53 s: a new picture every 1–2 s, sub-cuts on key words; `SHOTS = [[start, fn], ...]`.
- Face close-ups with `face()`; talking/shouting mouths with `talk(T, "shout", "stern")`;
  extra faces in toon.js: shout, shout2, yell, gulp, talk, deadpan.
- Effects: `sweat`, `angry` vein, `sparkle`, `speedLines`, camera `shakeAmt`, `stamp()` labels (NOVEMBER 1325, THE LEGEND, SOUVENIR…),
  `bigNum` counters, `tag` labels; decor: `sun`, `birds`, `tufts` (grass+flowers), dusk light for evening lines.
- SFX on every cut (whoosh) and every action (stomp, fanfare, gulp pop, gate thunk, boo, slide whistle, ting, rip, cheer).
- Never leave a shot static: QA flags freezes ≥0.4 s — add a slow push-in or idle motion.
## Engine additions (dragon-bones, 2026-11-23)
- toon.js arm poses via `opts.pose`: `"point"` (+`pointUp`), `"hold"` (+`held: (g, x, y, u) => draw object`), `"chin"`, `"cheek"`;
  hats `douli` (conical straw) and `guapi` (skullcap, `knot` colour). `dress` gives long robes.
- paint.js: `glyph` (oracle-style sun/moon/rain/person/tree/mountain/king/?), `bone` (scapula, glyphs, crack, glow), `shell`,
  `crackMark`, `hall` (Chinese gate tower), `drawers` (apothecary wall), `mortar`, `lantern`, `turtle`, `ox`, `hotRod`, `flame`.
- Story-level ideas worth reusing: `seal()` label (red name-seal), red-X "cross out the legend" transition, KEY-word caption accent colour,
  CJK text via `"Noto Serif CJK SC"` (installed). Each story must change palette/structure/caption accent (anti-template rule).
## Engine additions (rhino-vote, 2026-11-24)
- toon.js: pose `"give"` (arm straight out at chest height, `held` drawn in the open hand: handing a ballot/stamp/megaphone to
  someone; place the receiver facing back with `pose: "give"` too), pose `"cheer"` (both arms up), hat `"fedora"` (`cap` colour,
  `band`), suits via `o.tie` (+ optional `o.shirt`: white shirt V + necktie, no buttons).
- paint.js: `rhino` (cartoon star animal: walk `phase`, expr neutral/happy/proud/wink/shock, `sash` rosette, `mouthOpen`, `dir`),
  `ballotBox`, `ballot` (name + animated X), `newspaper`, `skyline50s`, `bonde` (tram), `pothole`, `palm`, `maple`, `fleur`.
- main.js ideas: `T_(word, nth)` is now an EXACT word match (accents stripped) and throws if missing — "top"/"took" no longer match
  "to"; `placard()` campaign-sign label; VHS "◀◀ REWIND" transition (scene replayed backwards + scanlines + tape-stop in audio.py);
  scoreboard race bars; split-screen comparison; `starts.json` (shot starts) feeds the whoosh cues in audio.py.
- Rising-from-behind trick: draw the character first, clipped above the occluder's top edge, then the occluder.
## Still to improve
Side-view walking with held props, two characters actually exchanging an object mid-air (animate held object between the two hands),
real free music/SFX files if the owner uploads them.

## Layout
- `engine/` shared code: `toon.js` (character drawing `Pen` + `bodyFront`; adapted from
  github.com/mromidev/claude-animated-shorts `templates/bridge/toon.ts`, MIT; adds a medieval `kettle` helmet + `plume`),
  `paint.js` (sky, hills, cypress, towers, city, wall+gate, banner, bucket, well, horse, puff, burst…),
  `index.html` (loads `data.js` then `main.js`), caption font.
- `tools/`: `setup.sh` (one-time install), `tts.py` (Kokoro voice from `script.txt`, writes `voice.wav` + `segments.json`),
  `render.mjs` (Playwright headless Chromium → JPEG frames), `sheet.py` (contact sheet).
- `stories/<slug>/`: per-video files (`main.js` = the shots, `script.txt`, `segments.json`, `data.js`, `audio.py`, check sheet).
  `war-of-the-bucket` is the worked example (v2, the version the owner approved after fixes).

## How to make a new Short
1. `bash tools/setup.sh`
2. Pick + verify the topic; write `script.txt` (one sentence per line, `text|pause_seconds`), ~150 words ≈ 50–55 s.
   Hook first line, escalate, twist in the last lines.
3. `mkdir -p work/<slug>/voice work/<slug>/web && cp script.txt work/<slug>/voice/ && cd work/<slug>/voice && python3 ../../../tools/tts.py af_heart 0.94`
4. `cp ../../engine/* work/<slug>/web/`; write `web/data.js` (`window.SEGS=<segments.json>;window.DUR=<seconds>;`)
   and `web/main.js` from the example: one shot per sentence (sub-cuts on key words with `T_("word", nth)`
   — nth counts earlier occurrences of the same word in the whole script!).
5. From `work/<slug>`: `node ../../tools/render.mjs stills/a "f1,f2,..."` + `python3 ../../tools/sheet.py stills/a sheet.jpg` →
   look at it, fix, then build the per-sentence check sheet (2 frames per sentence) and verify image ↔ words.
6. `node ../../tools/render.mjs frames all` (2D canvas: ~2 min for 1600 frames).
7. Adapt `audio.py` cues to the new timings, run it (writes `mix.wav`), then
   `ffmpeg -framerate 30 -i frames/f%04d.jpg -i mix.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -af loudnorm=I=-14:TP=-1:linear=true -c:a aac -shortest out.mp4`
8. QA: `freezedetect` / `blackdetect` with ffmpeg; send the MP4 to the owner.

Chromium path used: `/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`
(edit `tools/render.mjs` if the environment differs).
