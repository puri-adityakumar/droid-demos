# KOBO ROAST LAB // Design System & Choreography Blueprint

## Phase 0: Brief & Subject Anchors
- **Subject:** **KOBO ROAST LAB** (`KOBO // ROAST LAB // KYOTO & PORTLAND`), a Japanese-Scandinavian specialty coffee roastery, convective extraction laboratory, and ceramic/brass brewing hardware studio founded by Haruki Sato and Linnea Lindholm.
- **Locations:** Higashiyama Roastery & Extraction Bar (Kyoto, `35.0037° N, 135.7785° E`) and SE Division Sensory Lab (Portland, `45.5048° N, 122.6305° W`).
- **Audience:** Specialty coffee buyers, home espresso engineers, café directors, and architecture/craft lovers seeking ultra-light convective micro-lots (`Agtron 68.4–71.2`) and precision manual extraction hardware.
- **Assets Provided:**
  - 4 original multi-part PBR `.glb` 3D assemblies in `public/models/` (all `< 180 KB`, each exposing 5 named sub-assemblies: `part_01_base`, `part_02_body`, `part_03_top`, `part_04_accent`, `part_05_vessel`):
    1. `/models/kobo-lever-espresso.glb` (`172 KB`) — **01 / KOBO L-01 Manual Lever Espresso Machine** (`slug: 'lever-l01'`)
    2. `/models/kobo-pourover-set.glb` (`128 KB`) — **02 / KOBO V-60 Fluted Porcelain Pour-Over & Copper Kettle** (`slug: 'pourover-v60'`)
    3. `/models/kobo-stoneware-cup.glb` (`177 KB`) — **03 / KOBO S-08 Speckled Stoneware Cappuccino & Rosetta** (`slug: 'stoneware-s08'`)
    4. `/models/kobo-coffee-pouch.glb` (`98 KB`) — **04 / KOBO LOT-04 Gedeb Worka Sakaro Reserve Pouch** (`slug: 'gedeb-lot04'`)
  - 10 high-key sunlit photographic & watercolor plate assets in `public/images/`:
    - Botanical Watercolor Tasting Notes (`560x506`): `note-bergamot.jpg`, `note-white-peach.jpg`, `note-cacao-nib.jpg`, `note-jasmine.jpg`
    - Sunlit Single-Origin Farm Cards (`700x506`): `origin-ethiopia.jpg`, `origin-colombia.jpg`, `origin-kenya.jpg`
    - High-Key Studio 3D Turnaround & Material Boards (`1200x800`): `sheet-lever-espresso.jpg`, `sheet-pourover-set.jpg`, `sheet-cup-and-pouch.jpg`

---

## Phase 1: Concept Generation & Selection

### Three Distinct Concept Territories
1. **Concept A (Material & Instrument — Selected):** *The Sunlit Extraction Counter & Tactile Calibration Bar.* Morning light streams across a warm travertine and white-oak counter where manual lever hydraulics, spiral-fluted Arita porcelain, and convective roast telemetry are inspected like horological instruments.
   - *Originality:* 5/5 | *Fit:* 5/5 | *Feasibility:* 5/5 | *Portability:* 1/5 (anchored strictly to KOBO's 4 physical `.glb` brewing assemblies and Loring S15 extraction telemetry).
2. **Concept B (Botanical Herbarium):** *High-Altitude Coffee Flora & Chemistry Ledger.* A botanical field press mapping volatile aromatics (`Linalool`, `Gamma-Decalactone`) to farm altitudes.
   - *Originality:* 4/5 | *Fit:* 4/5 | *Feasibility:* 5/5 | *Portability:* 3/5.
3. **Concept C (Thermal Convective Kiln):** *Thermodynamic Heat Transfer Atlas.* A purely chart-driven roast curve interface.
   - *Originality:* 4/5 | *Fit:* 3/5 | *Feasibility:* 5/5 | *Portability:* 3/5.

**Selection Reason:** Concept A unites KOBO's sun-drenched Kyoto/Portland daylight atmosphere (`#FAF7F2` warm alabaster and `#F3EDE2` oat travertine) with an interactive 3D extraction counter that lets visitors explode all 4 brewing assemblies into their 5 material sub-components while calibrating roast curves and brew ratios.

### Concept Card
```
Idea:        A sun-drenched Japanese-Scandinavian coffee extraction bar where manual brewing vessels and single-origin micro-lots are inspected with laboratory clarity.
Metaphor:    Morning sunlight across a warm travertine tasting counter paired with precision refractometer and lever-pressure telemetry.
Signature:   Interactive 3D Daylight Extraction Turntable switching between 4 custom 5-part .glb brewing assemblies with axial explosion, wireframe inspection, and live brew recipe synchronization.
Emotion:     Warm morning serenity, tactile ceramic/brass warmth, and luminous sensory clarity.
Motion verb: Bloom and settle like a laminar gooseneck pour.
Screenshot:  The high-key alabaster hero stage with sunlit gobo beams, Fraunces editorial typography on the left, and the gleaming brushed-brass KOBO L-01 Lever Espresso Machine exploded into 5 sub-assemblies on the right.
```

---

## Phase 2: Art Direction System ("Sun-Drenched High-Key Daylight")

### 1. Color Palette (`src/styles/tokens.css`)
All text tokens are verified for AAA/AA contrast against both `--bg` (`#FAF7F2`) and `--bg-elevated` (`#F3EDE2`):
- `--bg`: `#FAF7F2` — Sun-Drenched Warm Alabaster (primary page ground)
- `--bg-elevated`: `#F3EDE2` — Warm Travertine / Oat Cream (secondary section & card surface)
- `--surface-bright`: `#FFFFFF` — Sunlit Porcelain (floating HUD plates & cards with `rgba(255, 255, 255, 0.88)` and `backdrop-filter: blur(12px)`)
- `--ink`: `#241710` — Deep Espresso Roast (`15.2:1` AAA contrast on `#FAF7F2`, `13.6:1` AAA on `#F3EDE2`)
- `--ink-secondary`: `#5C473A` — Roasted Walnut Husk (`7.4:1` AAA contrast on `#FAF7F2`, `6.6:1` AA on `#F3EDE2`)
- `--muted`: `#755B4B` — Warm Cedar Bark (`5.4:1` AA contrast on `#FAF7F2`, `4.85:1` AA on `#F3EDE2` — zero contrast warnings)
- `--accent`: `#C45A28` — Warm Terracotta / Roasted Persimmon (primary interactive accent; paired with `#241710` or `#FAF7F2` where verified for AA contrast)
- `--brass`: `#9E7123` — Brushed Warm Brass (metallic telemetry & frame rule accent)
- `--sage`: `#3D6347` — Highland Washed Process Sage (botanical & roast curve secondary accent)
- `--line`: `rgba(36, 23, 16, 0.12)` — 1px crisp architectural hairline rules
- `--line-strong`: `rgba(36, 23, 16, 0.24)` — structural card borders

### 2. Typography
- **Display (`--f-display`):** `Fraunces` (self-hosted variable WOFF2 `400..700`), optical serif with warm sculptural terminals for headlines, lot numbers, and sensory titles.
- **Body (`--f-body`):** `General Sans` (self-hosted WOFF2 `400, 500, 600`), clean neo-grotesque for long-form brewing protocols and origin provenance.
- **Telemetry / Mono (`--f-mono`):** `JetBrains Mono` (self-hosted WOFF2 `400, 500`), tabular numerals (`font-variant-numeric: tabular-nums`) for `RoR °C/min`, `TDS %`, `MASL`, and `BAR` readouts.

### 3. Grid, Rhythm & Sunlit Lighting
- **Grid:** 12-column architectural grid (`max-width: 1680px`), fluid gutter `clamp(1rem, 0.6rem + 1.6vw, 2.5rem)`, 4px subtle ceramic chamfer radius (`--radius: 4px`).
- **Sunlit Window Light Overlay:** Diagonal morning sunbeam gobo across hero and section headers (`radial-gradient` + `linear-gradient(125deg, rgba(255, 252, 245, 0.85) 0%, rgba(250, 247, 242, 0.1) 48%, rgba(243, 237, 226, 0.5) 100%)`).
- **Three.js High-Key Daylight Studio (`src/motion/bench.ts`):**
  - `renderer.toneMapping = THREE.ACESFilmicToneMapping`, `renderer.toneMappingExposure = 1.35`, `preserveDrawingBuffer: true`.
  - Multi-light sunlit café dome: warm white ceiling hemisphere (`#FFFDF9` / `#EDE2D0`, intensity `2.6`), sunlit window key (`#FFF6E5`, intensity `3.2`), warm bounce fill (`#F7EFE2`, intensity `1.8`), golden brass rim (`#FFD89B`, intensity `2.2`), plus a warm travertine contact shadow disc underneath the assembly.

### 4. Section Layout Blueprint (Distinct Layout Family per Section)
1. **Hero (`#stage`) — Asymmetric 5/7 Editorial + Interactive 3D Extraction Stage:**
   - Left 5 columns: Harvest eyebrow, `Fraunces` display headline (`Sunlit Extraction & Tactile Craft.`), lead copy, live 4-cell Brew Telemetry Strip (`93.5°C`, `9.0 BAR`, `21.4% EXT`, `1.42% TDS`), and interactive 5-part sub-assembly inspector list.
   - Right 7 columns: Sunlit 3D WebGL Turntable (`#workbench-canvas`) with 4-model switcher tabs, explode slider + preset detents, wireframe toggle, camera reset, and active component telemetry card.
2. **Section 02 (`#origins`) — 3-Card Single-Origin Harvest Ledger + 4-Column Botanical Watercolor Matrix:**
   - 3 sunlit origin farm cards (`origin-ethiopia.jpg`, `origin-colombia.jpg`, `origin-kenya.jpg`) with full farm gate transparency, elevation, processing protocol, and `"LOAD BREW RECIPE ON 3D BAR"` interactive trigger that updates the hero telemetry and switches to the matching vessel.
   - 4 botanical watercolor illustrations (`note-bergamot.jpg`, `note-white-peach.jpg`, `note-cacao-nib.jpg`, `note-jasmine.jpg`) paired with volatile aromatic compound specifications.
3. **Section 03 (`#roast-curve`) — Asymmetric 7/5 Interactive Loring S15 Roast Curve & Precision Brew Ratio Calculator:**
   - Left 7 columns: Dual-axis interactive SVG Roast Profile Chart (`Bean Temp °C` & `Rate of Rise °C/min` from `00:00` to `10:00`) with 5 clickable thermodynamic phases (`01 Charge`, `02 Turning Point`, `03 Dry End / Maillard`, `04 First Crack 196.4°C`, `05 Drop 204.2°C`).
   - Right 5 columns: Real-time Brew Ratio & Extraction Calculator switching between `Lever Espresso (1:2.1)` and `V60 Pour-Over (1:16.5)` with interactive dose slider (`14g` to `24g`) calculating yield, bloom water, temperature, grind median (`µm`), and expected refractometer TDS.
4. **Section 04 (`#equipment`) — 2x2 Architectural Vessel & Studio Turnaround Dossiers:**
   - Showcases all 4 custom 3D hardware models alongside their high-key studio turnaround & material boards (`sheet-lever-espresso.jpg`, `sheet-pourover-set.jpg`, `sheet-cup-and-pouch.jpg`), 5-part bill of materials, and dual actions: load directly onto the 3D stage or open the dedicated `/work/[slug]` dossier page.
5. **Section 05 (`#craft`) — 3-Plate Orthographic Fluid/Thermal Blueprints + Kyoto & Portland Tasting Room Ledger:**
   - 3 technical SVG plates (`PLATE FIG 01.A // 9-BAR PISTON LEVER PRESSURE DECAY`, `PLATE FIG 02.B // 60° SPIRAL FLUTE LAMINAR BYPASS`, `PLATE FIG 03.C // MASHIKO IRON-CLAY THERMAL RETENTION`) followed by the Kyoto Higashiyama & Portland SE Division tasting bar hours and water remineralization ledger.
