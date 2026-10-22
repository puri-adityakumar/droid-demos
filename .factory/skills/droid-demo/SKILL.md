---
name: droid-demo
description: Record and render demo and comparison videos for droid-demos projects. Uses sharp 90-degree edges (no rounded corners, rx="0") on all framed templates (#fafaf8 off-white frame for standard demos/comparisons), and a dedicated 1:1 square pure-white (#ffffff) mode with no text and no token/stats overlays for chibi-oktaku (chibi-jelly-painting).
---

# /droid-demo

Record deterministic 30 fps demo captures and render showcase or comparison videos for projects in `droid-demos`.

**Skill root:** the directory containing this file (`$SKILL`).
**Output root:** `/home/factory-user/droid-demo-videos/<slug>/` (keep generated heavy MP4s outside the git repo unless explicitly asked to place a clip inside a project's `screenshots/` folder).

---

## Core Design Rules

1. **Sharp Edges Only (No Rounded Corners):**
   - Every framed cutout and video pane MUST have **sharp 90° corners (`rx="0"`, `border-radius: 0`)**. Never use rounded corners on video frames or masks.
2. **Two Distinct Visual Modes:**
   - **Chibi-Oktaku Mode (`chibi-jelly-painting` / `chibi-oktaku`) — `--format chibi` (`1080×1080`, 1:1 Square):**
     - **Pure white (`#ffffff`) background.**
     - **No text, no model headers, no token counts, no stats bars.**
     - **1:1 square aspect ratio (`1080×1080`)**, sharp edges, fading in (`0.4s`) and out (`0.5s`) to pure `#ffffff`.
   - **Standard Framed Mode (all other `droid-demos` builds such as `kobo-roast-lab`, `lindqvist-cmm-04`, etc.):**
     - Uses the `#fafaf8` off-white sheet with `#111111` primary ink, `#6b6b6b` secondary labels, `Geist` + `Geist Mono` typography, and **sharp `rx="0"` rectangular cutouts**:
       - `single-landscape` (`1440×1080` 4:3 solo build showcase — tight `80px` side margins around a `1280×800` 16:10 or `1280×720` 16:9 sharp-edge cutout)
       - `single-vertical` (`1080×1350` 4:5 single build showcase)
       - `landscape` (`1920×1080` 16:9 side-by-side comparison)
       - `vertical` (`1080×1350` 4:5 stacked comparison)

---

## Workflow

### 1. Choose Mode & Orientation

- If the target project is **`chibi-oktaku` / `chibi-jelly-painting`**, default directly to **`chibi` mode** (`1080×1080` 1:1 square, pure `#ffffff` background, no text, no tokens) unless the user explicitly asks for another format.
- For any other `droid-demos` project or comparison, if the user has not specified the orientation, call `AskUser` first:

```text
1. [question] Which video format should we render for this droid-demos video?
[topic] Format
[option] Single Landscape (1440×1080 4:3 sharp-edge frame)
[option] Single Vertical (1080×1350 4:5 sharp-edge frame)
[option] Side-by-Side / Stacked Comparison (Landscape 1920×1080 + Vertical 1080×1350, sharp edges)
[option] Chibi 1:1 Square (1080×1080 pure #ffffff, no text or tokens)
```

### 2. Create `spec.json` in `/home/factory-user/droid-demo-videos/<slug>/`

#### A. For `chibi-oktaku` (`chibi-jelly-painting`) — 1:1 Pure White, No Text, No Tokens

```json
{
  "slug": "chibi-oktaku-eren",
  "format": "chibi",
  "fps": 30,
  "frames": 240,
  "size": 1080,
  "posterTimeSec": 4,
  "framesPattern": "/tmp/chibi-frames/%05d.jpg"
}
```

#### B. For a Single `droid-demos` Project (Sharp-Edge Frame)

```json
{
  "slug": "kobo-roast-lab",
  "format": "single-both",
  "fps": 30,
  "frames": 1200,
  "posterTimeSec": 15,
  "framesPattern": "/tmp/kobo-frames/%05d.jpg",
  "project": {
    "title": "KOBO // Roast Lab",
    "subtitle": "Gemini 4 Argon (high) · /awwwards + /jury + Blender 4.2",
    "time": "3h 54m",
    "timeNote": "active compute",
    "tokens": "~6.63M",
    "tokensNote": "34.93M w/ cache",
    "score": "8.61 / 10",
    "scoreNote": "blind /jury",
    "assets": "4 GLBs",
    "assetsNote": "procedural bpy"
  }
}
```

#### C. For a Two-Up Comparison (Sharp-Edge Frame)

```json
{
  "slug": "lindqvist-vs-kobo",
  "format": "both",
  "fps": 30,
  "frames": 1200,
  "posterTimeSec": 15,
  "leftFrames": "/tmp/left-frames/%05d.jpg",
  "rightFrames": "/tmp/right-frames/%05d.jpg",
  "left": {
    "model": "Lindqvist CMM-04",
    "harness": "Gemini 4 Argon (high) · Factory Droid",
    "time": "4h 53m",
    "timeLandscape": "4 h 53 min",
    "timeVertical": "4h 53m",
    "timeNote": "active time",
    "cost": "~8.24M",
    "costNote": "uncached tokens",
    "passes": "8.00/10",
    "passesLabel": "Jury",
    "checks": "3 GLBs",
    "checksLabel": "Assets"
  },
  "right": {
    "model": "KOBO Roast Lab",
    "harness": "Gemini 4 Argon (high) · Factory Droid",
    "time": "3h 54m",
    "timeLandscape": "3 h 54 min",
    "timeVertical": "3h 54m",
    "timeNote": "active time",
    "cost": "~6.63M",
    "costNote": "uncached tokens",
    "passes": "8.61/10",
    "passesLabel": "Jury",
    "checks": "4 GLBs",
    "checksLabel": "Assets"
  }
}
```

### 3. Record Deterministic Frames

Headless Chromium under SwiftShader renders WebGL/WebGPU-fallback at ~1–3 fps wall-clock. Always step simulation time deterministically at `1/30 s` per frame:

- Import `launch`, `VT`, and `initChibiStepper` from `$SKILL/scripts/common.mjs`.
- **For `chibi-oktaku` (`chibi-jelly-painting`):**
  - Open with `?webgl=1&char=<id>` at a `1080×1080` (1:1) viewport.
  - Wait for `document.documentElement.dataset.state === 'ready'`.
  - If recording pure artwork without UI buttons, hide `.brand, .presets, .mode, .hint, .lil-gui` so only the painted scene on `#ffffff` paper is visible.
  - Call `initChibiStepper` to stop the internal animation loop and step `window.__stepChibi(1 / 30)` each frame before capturing a `1080×1080` screenshot.

### 4. Composite Video & Poster

Run `render-demo.mjs`:

```bash
node "$SKILL/scripts/render-demo.mjs" /home/factory-user/droid-demo-videos/<slug> --format <chibi|single-landscape|single-vertical|single-both|landscape|vertical|both>
```

- Always inspect the generated poster PNG(s) with `Read` before finishing to verify sharp edges (`rx="0"`) and, for `chibi-oktaku`, a clean 1:1 `#ffffff` canvas with no text or token overlays.
