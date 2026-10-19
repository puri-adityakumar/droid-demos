# DESIGN.md — Soren Lindqvist (`https://lindqvist.studio`)

## Phase 0: Brief

- **Subject:** **Soren Lindqvist**, Principal 3D Industrial Designer & Real-Time Graphics Engineer based in Stockholm, Sweden.
- **Practice:** Designs machined physical instruments (anodized aluminum housings, titanium cages, brass acoustic capsules, optical monochromators, 3-axis gimbals) and authors their sub-300 KB real-time WebGL assembly twins on a single clock for acoustics laboratories, optical instrument makers, and robotics teams.
- **Audience:** Hardware founders, VPs of Product, industrial design directors, and engineering leads who need either physical enclosure design + DFM or an interactive, zero-lag 3D product twin that ships on the web without a 40 MB game engine download.
- **Site's Job:** Convert technical decision-makers into booked engagements (`Book an inspection call`), proving both mechanical CAD authority and 60 fps browser graphics discipline in the first three seconds.
- **Provided Assets:**
  - `public/models/kestrel-recorder.glb` (326 KB) — Kestrel-01 Coaxial Acoustic Field Recorder
  - `public/models/verge-monochromator.glb` (138 KB) — Verge-M2 Optical Monochromator Turret
  - `public/models/aether-gimbal.glb` (195 KB) — Aether-G9 3-Axis Gyroscopic Sensor Head
  - Each `.glb` contains 5 named mechanical sub-assemblies (`part_01_chassis`, `part_02_capsule_guard`, `part_03_transducer_core`, `part_04_rotary_gain`, `part_05_bayonet_mount`) with PBR materials (`Anodized_Obsidian`, `Brushed_Titanium`, `Machined_Steel`, `Raw_Brass`, `Coil_Copper`, `Signal_Vermilion`, `Technical_Ceramic`).
- **Explicit Assumptions (marked `placeholder: true` in `src/data/site.ts`):**
  - Client project briefs (`Kestrel Audio Lab`, `Verge Photonics AB`, `Aether Inertial Systems`) are representative commissioned hardware + WebGL twin case studies for the owner to replace with real NDA-cleared client names.
  - Contact email (`soren@lindqvist.studio`), studio location (`Katarinavägen 18, Södermalm, Stockholm`), and booking availability (`Q3/Q4 inspection window`) are realistic placeholders.

---

## Phase 1: Concept

### Three Territory Concepts

| Criterion | Concept A: The Coordinate Measuring Bench (Territory 4: Process Metaphor) | Concept B: Billet & Tolerance Sheet (Territory 2: Material of the Profession) | Concept C: Anechoic Test Chamber (Territory 3: Place & Culture) |
| :--- | :--- | :--- | :--- |
| **One-sentence Idea** | The site is an optical coordinate measuring machine (CMM) bench where precision 3D hardware instruments sit on an inspection stage, exploding along their axial rails and shifting from CAD wireframe to machined billet as you scroll or adjust the vernier controls. | Every page is a CNC machinist's G-code setup sheet where paragraphs are toolpaths and scrolling mills away raw aluminum blocks to expose finished 3D assemblies. | Modeled after Stockholm's subterranean acoustic test chambers, the site uses sound-wave interference grids to reveal instruments through directional reflections. |
| **Anchor** | Soren's dual deliverable: physical CNC-machined multi-part instruments (`part_01`..`part_05`) and their interactive WebGL exploded-view twins. | CNC milling tolerances and STEP-to-GLB mesh decimation. | Nordic electro-acoustic engineering heritage. |
| **Layout Rule** | 12-column metrology datum grid with four-corner instrument readout frame, sticky coordinate stage hero, indexed BOM callouts, and ledger-style specimen rows. | Two-column split between G-code instructions on the left and a vertical milling viewport on the right. | Centered chamber viewport surrounded by radial decibel rings. |
| **Motion Verb** | **Index and detent**: mechanical steps that lock into place with a crisp caliper snap (`cubic-bezier(0.16, 1, 0.3, 1)`), inner text rolling through clipped apertures, and fills flooding from the datum edge. | **Mill and clear**: horizontal sweeping cuts that shave layers off blocks. | **Pulse and dampen**: concentric ripples that decay rapidly to silence. |
| **Type Voice** | Wide architectural display grotesk (`Clash Display`) paired with Swiss technical sans (`General Sans`) and tabular micrometer telemetry (`JetBrains Mono`). | Monospace-heavy G-code blocks with condensed industrial headers. | Light geometric sans with ultra-wide tracked numerals. |
| **Palette Source** | Zeiss/Leica optical inspection tables: granite-obsidian slate, anodized titanium, warm technical ivory paper, brass datum accents, and Signal Vermilion index pins. | Raw 6061 aluminum silver, cutting-fluid cobalt blue, and carbide dark grey. | Foam-wedge charcoal, warm copper coil, and oscilloscope amber. |
| **Signature Moment** | A sticky 3D coordinate inspection stage powered by Three.js (`GLTFLoader` on the single `gsap.ticker` clock) where scrolling or dragging the axial explode control separates the 5 mechanical sub-assemblies (`part_01_chassis` .. `part_05_bayonet_mount`) along their true engineering vectors, while live DOM datum callouts track the exploded state, with specimen switching, CAD wireframe/solid toggle, and pointer-reactive key lighting. | Hovering a toolpath line highlights the corresponding bevel on the 3D block. | Clicking a frequency node sends an impulse across the 3D mesh surface. |
| **Screenshot Frame** | The Kestrel-01 field recorder suspended at `64% AXIAL EXPLODE` on the dark metrology stage, its 5 titanium, brass, and vermilion sub-assemblies separated along a vertical axis with crisp tabular BOM callout rows locked alongside mega display typography. | Half-wireframe, half-shaded billet block mid-cut. | Acoustic capsule inside a dark radial grid. |
| **Scores (O / F / Fe / P)** | **Originality: 5 · Fit: 5 · Feasibility: 5 · Portability: 1** (Total edge: best) | Originality: 4 · Fit: 4 · Feasibility: 3 · Portability: 2 | Originality: 3 · Fit: 3 · Feasibility: 4 · Portability: 3 |

**Selection:** **Concept A (The Coordinate Measuring Bench)** wins because it directly unifies Soren's two crafts—machined multi-part industrial design and real-time WebGL inspection tools—and uses the exact 5-part hierarchy built into the `.glb` models (`part_01_chassis` to `part_05_bayonet_mount`). We also borrow a detail from Concept B for the 404 page: an out-of-tolerance datum gauge report.

### Winning Concept Card

```
Idea:        The site is an optical metrology bench where precision 3D hardware instruments sit on a coordinate inspection stage, exploding along their axial rails and shifting from CAD wireframe to machined billet as you scroll or adjust the vernier controls.
Metaphor:    Zeiss / Leica Coordinate Measuring Machine (CMM) and hardware assembly manual.
Signature:   Sticky 3D coordinate inspection stage (Three.js GLTFLoader on the single GSAP ticker) exploding 5 named mechanical sub-assemblies along true axial vectors with synchronized DOM BOM callouts, specimen turret selector, PBR/Wireframe toggle, and pointer-reactive key lighting.
Emotion:     Tactile mechanical authority: like turning a knurled titanium vernier dial that clicks into a machined detent.
Motion verb: "index and detent" — mechanical steps that lock into place with a crisp caliper snap (cubic-bezier(0.16, 1, 0.3, 1)), inner text rolling through clipped apertures, and fills flooding from the datum edge.
Screenshot:  Kestrel-01 Coaxial Field Recorder at 65% axial explosion over the granite-obsidian metrology grid, brass condenser core exposed between the titanium cage and anodized chassis, flanked by Signal Vermilion datum indices and architectural Clash Display typography.
```

---

## Phase 2: Art Direction System

### 1. Palette (6 Named Roles)

Sampled from Zeiss granite surface plates, bead-blasted titanium instruments, Mitutoyo dial calipers, and Signal Vermilion calibration pins. All text colors follow a single global state variable on `<html>` (`data-surface="dark"` default, or `html.is-blueprint` when toggled into high-contrast inspection sheet mode) so contrast is guaranteed in every chapter and scroll state.

| Role | Token | Default Precision-Dark Value | Contrast vs Ground | Material Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Ground** | `--c-bg` / `--c-surface` | `#0b0d10` (Granite Obsidian) / `#12161c` (Stage Platen) | — | Lapped black granite metrology surface plate |
| **Ink** | `--c-fg` | `#eceae4` (Technical Ivory) | **16.4 : 1 (AAA)** | Archival cotton inspection log stock |
| **Muted** | `--c-muted` | `#9da5b0` (Micrometer Steel) | **7.3 : 1 (AAA)** | Laser-etched stainless vernier scale |
| **Line** | `--c-line` | `rgba(236, 234, 228, 0.14)` | Hairline datum | Optical reticle rule & vernier ticks |
| **Accent** | `--c-accent` | `#e84520` (Signal Vermilion) / `#d4a84f` (Raw Brass secondary) | **4.6 : 1 (AA large/UI)**; paired with `#0b0d10` dark ink on filled badges (**8.1 : 1**) | Anodized calibration index pin & brass capsule |
| **Curtain** | `--c-curtain` | `#141820` with `#e84520` leading vernier edge | — | Optical shutter blade |

*Justification against AI-default dark palettes:* Unlike generic neon-on-black tech templates, this palette is derived directly from the 7 PBR materials embedded in the Blender `.glb` assemblies (`Anodized_Obsidian`, `Brushed_Titanium`, `Raw_Brass`, `Signal_Vermilion`, `Technical_Ceramic`), so the DOM interface and the 3D hardware share the exact same physical material swatches.

### 2. Typography

Self-hosted in `public/fonts/` via `scripts/font.mjs` (`woff2` only, preloaded above the fold):

- **Display (`--f-display`):** **Clash Display** (Fontshare `clash-display`, weights `500, 600, 700`). Wide shoulders, squared mechanical apertures, and engineered geometry that reads like stamped instrument housings.
- **Body & UI (`--f-body`):** **General Sans** (Fontshare `general-sans`, weights `400, 500, 600`). Clean, high-legibility neo-grotesk for long-form engineering case studies and controls.
- **Telemetry & Datum (`--f-mono`):** **JetBrains Mono** (Google `JetBrains Mono`, weights `400, 500`). Strictly reserved for live micrometer coordinates, tolerances (`±0.004 mm`), BOM part indices (`PART 01..05`), and file weights (`326 KB GLB`).

#### Fluid Type Scale & Optical Rules
- `--t-mega`: `clamp(2.85rem, 1.1rem + 7.2vw, 7.25rem)` — `line-height: 0.9`, `letter-spacing: -0.04em`, optical left margin `-0.04em`.
- `--t-xl`: `clamp(2.1rem, 1.2rem + 3.6vw, 4.4rem)` — `line-height: 0.94`, `letter-spacing: -0.035em`.
- `--t-l`: `clamp(1.5rem, 1.15rem + 1.4vw, 2.35rem)` — `line-height: 1.08`, `letter-spacing: -0.025em`.
- `--t-m`: `clamp(1.15rem, 1.05rem + 0.45vw, 1.45rem)` — `line-height: 1.3`, `letter-spacing: -0.015em`.
- `--t-body`: `clamp(1rem, 0.96rem + 0.2vw, 1.125rem)` — `line-height: 1.55`, measure capped at `62ch`.
- `--t-s`: `0.875rem` (14 px) — `line-height: 1.45`.
- `--t-xs`: `0.75rem` (12 px) — `letter-spacing: 0.06em`, `font-variant-numeric: tabular-nums`.

### 3. Grid, Rhythm & Shape

- **Grid:** 12-column CSS Grid (`grid-template-columns: repeat(12, minmax(0, 1fr))`), fluid gutter `--gutter: clamp(1rem, 0.6rem + 1.6vw, 2.5rem)`, max container width `1680px` centered with full-bleed datum rules. Strong vertical hang lines at **Col 1**, **Col 5**, and **Col 8**.
- **Mobile Grid (390 px):** 4-column grid, explicit `auto` row sizing, zero horizontal overflow, minimum `44px × 44px` interactive control targets on the inspection stage.
- **Section Spacing Moods:**
  - *Stage (Hero):* `190svh` desktop / `145svh` mobile sticky coordinate bench.
  - *Tight (Telemetry strip):* `calc(var(--u) * 6)` vertical padding.
  - *Normal (Specimen Archive & Pipeline):* `calc(var(--u) * 14)` vertical padding.
  - *Airy (Booking & Finale):* `calc(var(--u) * 20)` vertical padding.
- **Shape Rule:** `--radius: 2px` everywhere (machined 0.5 mm chamfered edge; never pill buttons or bubbly SaaS cards).

### 4. Motion Language ("Index and Detent")

- **Single Clock:** Lenis smooth scroll, GSAP ScrollTrigger, the idle oscillator, and the Three.js `WebGLRenderer` all execute inside a single `gsap.ticker` callback. Zero standalone `requestAnimationFrame` loops.
- **Driver Module (`src/motion/bench.ts`):**
  - Combines scroll progress `p`, interactive explode slider value, pointer light angle `(x, y)`, and slow `gsap.ticker` idle harmonic drift (`idleMotion: true` at rest) into one unified state vector.
  - Separates `part_01_chassis`, `part_02_capsule_guard`, `part_03_transducer_core`, `part_04_rotary_gain`, and `part_05_bayonet_mount` along their individual 3D axial vectors (`explosionVector`) and rotates the turret smoothly.
  - Updates live DOM telemetry (`[data-telemetry-spread]`, `[data-telemetry-angle]`, `[data-telemetry-part]`) and highlights the active BOM row.
  - Pauses rendering automatically when the stage is scrolled out of the viewport (`IntersectionObserver` / `ScrollTrigger`) and disables WebGL completely under `prefers-reduced-motion: reduce`.
- **Micro-interaction Treatments (one per role):**
  1. **Primary CTAs & Stage Controls (`.btn-detent`):** Flood fill from the datum edge (`scaleX(0) -> scaleX(1)` on `.btn-detent__fill`) + inner label vertical detent roll (`.roll` spans) + 5 px arrow travel.
  2. **Project / Specimen Rows (`.specimen-row`):** Full-row surface flood + left vermilion datum bar expansion + inner title shift + triggers live 3D specimen switch on the inspection stage.
  3. **Navigation Links (`.nav-link`):** Inner clipped vertical roll (`.roll`) with active page caliper bracket indicator `[aria-current="page"]`.
  4. **Inline Text Links (`.inline-link`):** Persistent 1 px underline at rest that rises into a highlight band on `:hover` and `:focus-visible`.

### 5. Composition Plan & ASCII Wireframes (Distinct Layout Family per Section)

#### Home (`/`)

1. **Four-Corner Metrology Frame (`Header.astro`, fixed UI that steps aside on scroll down via `html.frame-away`):**
```
+-----------------------------------------------------------------------+
| [TL] SOREN LINDQVIST · STO     [TR] SPECIMENS / PIPELINE / LAB / CTA  |
|                                                                       |
| [BL] BENCH TOLERANCE ±0.004MM  [BR] AXIAL SPREAD 00.0MM · STAGE LIVE  |
+-----------------------------------------------------------------------+
```

2. **Section 1 — Hero: Split Coordinate Stage (`Sticky Stage / Split Frame Family`, `190svh`):**
```
+----------------------------------+------------------------------------+
| COL 1..6: SERVER-RENDERED COPY   | COL 7..12: 3D CMM VIEWPORT         |
| [DATUM 00 // STOCKHOLM LAB]      | +--------------------------------+ |
| H1: MACHINED INSTRUMENTS &       | |   [part_02_capsule_guard]      | |
|     REAL-TIME 3D TWINS.          | |         ↑ axial explode        | |
| Lead copy + primary CTA:         | |   [part_03_transducer_core]    | |
| [Book an inspection call ↗]      | |   [part_01_chassis]            | |
|                                  | |   [part_04_rotary_gain] →      | |
| LIVE 5-PART BOM CALLOUT TABLE:   | |         ↓                      | |
| 01 CHASSIS       7075-T6 AL      | |   [part_05_bayonet_mount]      | |
| 02 CAPSULE CAGE  TI-6AL-4V       | +--------------------------------+ |
| 03 TRANSDUCER    C36000 BRASS    | TURRET CONTROLS:                   |
| 04 VERNIER GAIN  316L + VERMILION| [KESTREL-01] [VERGE-M2] [AETHER-G9]|
| 05 BAYONET MOUNT CNC COLLAR      | EXPLODE: [====|----] [PBR / WIRE]  |
+----------------------------------+------------------------------------+
```
*(Static / Reduced-Motion Fallback: High-contrast multi-layer orthographic SVG technical blueprint of the active instrument sits inside the stage frame and remains 100% visible when WebGL is off or reduced-motion is enabled.)*

3. **Section 2 — Selected Commissions (`Index List + Live Preview Family`):**
```
+-----------------------------------------------------------------------+
| COL 1..4: SECTION HEADER          COL 5..12: BENCH LEDGER SUMMARY     |
+-----------------------------------------------------------------------+
| 01 | KESTREL-01 FIELD RECORDER  | ACOUSTICS   | 326 KB GLB | [INSPECT]|
+-----------------------------------------------------------------------+
| 02 | VERGE-M2 MONOCHROMATOR     | PHOTONICS   | 138 KB GLB | [INSPECT]|
+-----------------------------------------------------------------------+
| 03 | AETHER-G9 GYRO GIMBAL      | INERTIAL    | 195 KB GLB | [INSPECT]|
+-----------------------------------------------------------------------+
```

4. **Section 3 — Engineering Pipeline & Explainer Schematic (`Asymmetric Technical Diagram + 3-Stage Matrix Family`):**
*(Note: The optional `/anatomy` companion skill is not installed in this environment; we build a bespoke interactive orthographic CAD-to-GLB kinematics schematic here and note `/anatomy` in the final handoff).*
```
+----------------------------------------+------------------------------+
| COL 1..7: ORTHOGRAPHIC CAD-TO-WEBGL    | COL 8..12: 3-STAGE PROTOCOL  |
| SCHEMATIC PLATE (Interactive SVG       | STAGE 01: NURBS & Kinematics |
| showing STEP solid -> BMesh Bevel ->   | STAGE 02: Sub-300KB GLB Pack |
| 5-Node GLB Hierarchy -> GSAP Ticker)   | STAGE 03: Single-Clock WebGL |
+----------------------------------------+------------------------------+
```

5. **Section 4 — Verified Bench Telemetry (`Data / Facts Family`):**
```
+-----------------+-----------------+-----------------+-----------------+
| 0.004 mm        | 138–326 KB      | 60 fps          | 5 Nodes         |
| CNC & mesh      | Self-contained  | Single GSAP     | Standardized    |
| datum accuracy  | PBR .glb weight | ticker budget   | axial hierarchy |
+-----------------+-----------------+-----------------+-----------------+
```

6. **Section 5 — Commissioning & Footer Finale (`Statement + Finale Family`):**
```
+-----------------------------------------------------------------------+
| ENGAGEMENT SPECIFICATIONS (3 CONCRETESCOPES):                         |
| [A] 3-Week Launch Twin  [B] Hardware + WebGL System  [C] Configurator |
|                                                                       |
| MEGA DISPLAY CTA: BOOK AN INSPECTION CALL                             |
| soren@lindqvist.studio · Katarinavägen 18, Stockholm · Colophon       |
+-----------------------------------------------------------------------+
```

#### Case Study Pages (`/work/kestrel-01`, `/work/verge-m2`, `/work/aether-g9`)
- **Hero:** Split header with specimen metadata (`CLIENT`, `YEAR`, `GLB WEIGHT`, `TOLERANCE`) + live interactive 3D `.glb` inspection viewport with preset state buttons (`0% Assembled`, `45% Sub-Assembly`, `100% Full Explode`, `CAD Wireframe`) and static orthographic SVG fallback.
- **Body:** Asymmetric 12-column layout (Col 1..4 sticky BOM part specification table; Col 5..12 Context, Kinematic Decision, Craft Breakdown with technical SVG cross-sections, and Shipped Outcome).
- **Footer Handoff:** Continuous full-width next-specimen index bar.

#### About & Metrology Lab (`/about`)
- **Hero:** Statement manifesto + Stockholm workshop credentials.
- **Equipment & Standards Ledger:** Hardware toolchain (Rhino 8, SolidWorks, Blender 4.2 Python `bpy` pipelines, Three.js, custom GLSL PBR shaders) and physical prototyping bench capabilities.

#### 404 Page (`/404`)
- **Concept Voice:** `"OUT OF TOLERANCE: DATUM NOT FOUND ON THE INSPECTION BENCH"` with a live micrometer deviation readout (`DEVIATION: +404.000 μm`) and direct return link to the main coordinate stage.

### 6. Genericness Test

- *Question:* "If I gave a similar prompt to a generic model, would it land here?"
- *Audit & Changes Made:*
  1. A generic model would render a floating abstract icosahedron or torus knot with purple-blue glow behind a centered heading. **Changed:** We load three real, purpose-built multi-part mechanical `.glb` instruments (`kestrel-recorder.glb`, `verge-monochromator.glb`, `aether-gimbal.glb`) and explode their actual named sub-assemblies (`part_01_chassis`..`part_05_bayonet_mount`) along true engineering axes with synchronized DOM BOM callouts.
  2. A generic model would use bare text-color swaps on links and buttons. **Changed:** Every interactive control uses the "index and detent" mechanical fill flood + clipped vertical label roll + arrow travel.
  3. A generic model would leave reduced-motion users with an empty black box where the canvas was. **Changed:** Every 3D viewport has a multi-part technical orthographic SVG schematic underneath that is 100% visible under `prefers-reduced-motion: reduce` or before WebGL boots.
