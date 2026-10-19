# Blind `/jury` Critique & B2B Copywriting Audit Scorecard

- **Target**: `LINDQVIST // CMM-04` (`http://127.0.0.1:4321`)
- **Rubric**: `juliobsz/skills` (`/awwwards` & `/jury` `references/quality-bar.md`)
- **Blind Critic Sessions**:
  - Pass 1: `5946cd46-ed62-4a0a-b8dc-7a17ef5f82ed` (Initial build — **7.47 / 10**)
  - Pass 2: `023d091f-458b-4c74-8ecd-629e61bf4d17` (Post-interaction & copy pass — **7.65 / 10**)
  - Pass 3: `2eb5b954-bd1a-41a8-826d-191f2f89b80c` (Post-3D mesh detail, craft plates & sticky layout pass — **8.00 / 10**)
- **Marketing & Anti-AI-Slop Copywriting Critic Session**: `88f77350-28ed-4ee1-a4a7-6bc092057d80`

---

## 1. Blind Critic One-Sentence Site Idea

> "The site is a digital Coordinate Measuring Machine (`CMM-04`) optical inspection bench for Stockholm industrial designer and graphics engineer Soren Lindqvist, where CNC-machined hardware enclosures and their sub-300 KB, 60 fps exploded-view WebGL digital twins are inspected down to four-micron (`±0.004 mm`) tolerances from a single master CAD assembly."

---

## 2. Final Score Table (Pass 3 — All Categories >= 8/10)

| Criterion / Area | Pass 1 | Pass 2 | Pass 3 (Final) | Weight / Type | Evidence Cited | Critique & Justification |
|---|---:|---:|---:|---|---|---|
| **Design** | 7.5 | 7.5 | **8.0 / 10** | 40% | `.shots/home/d-01-hero.png`, `.shots/work-item/d-04-scroll.png`, `.shots/404/d-01-hero.png`, `.shots/home/h-01-hover.png`..`h-08-hover.png` | Disciplined dark granite coordinate palette (`#0b0d10`), bone display typography (`#f4f3ee`), vermilion laser datum (`#ff4f1f`), and tabular monospace telemetry. Asymmetric 2-column inspection bench pairing bold display type and a 5-node kinematic BOM with an interactive 3D stage and turret controls. Bespoke SVG orthographic engineering plates (`PLATE FIG 01.A..01.C`) and custom probe overtravel 404 schematic. Every primary button and BOM row has a flood-fill, shadow-offset, or rule-shift hover (`noHoverChange: 0`, `colorOnly: 0`). |
| **Usability** | 7.3 | 8.0 | **8.0 / 10** | 30% | `.shots/summary.json`, `.shots/home/k-01-focus.png`..`k-04-focus.png`, `.shots/home/r-01-hero.png` | Instant under-3s orientation across all 4 pages; throttled mobile LCP is `1864–1996 ms` and mobile scroll is `60 fps` across all pages (`summary.json`). `overflow: false`, `smallTargets: 0`, `axeSerious: 0`, `skipLinkFirst: true`, `noVisibleFocus: 0`, `noHoverChange: 0`, and `colorOnly: 0`. Reduced motion (`r-01-hero.png`) replaces the live WebGL stage with a calm, labeled static orthographic CAD schematic (`movingReduced: false`). |
| **Creativity** | 7.8 | 7.5 | **8.0 / 10** | 20% | `.shots/home/d-01-hero.png`, `.shots/home/h-04-hover.png`, `.shots/work-item/d-01-hero.png`, `.shots/work-item/d-90-transition-a.png`, `.shots/404/d-01-hero.png` | The Coordinate Measuring Machine (`CMM-04`) concept is specific to Soren Lindqvist's dual CAD + WebGL practice and drives the hero architecture, BOM-to-WebGL sub-assembly explosion (`Z-TRAVEL +40.3 mm (048%)`), reticle cursor follower inside the 3D viewport, optical laser-line page transition (`INDEXING OPTICAL DATUM`), and axis-overtravel 404. |
| **Content** | 7.2 | 7.5 | **8.0 / 10** | 10% | `.shots/work-item/d-02-scroll.png`..`d-05-scroll.png`, `.shots/home/d-05-scroll.png`, `.shots/about/d-03-scroll.png`, `.shots/audit.txt` | Technically authoritative copy throughout: alloys (`7075-T6`, `Ti-6Al-4V`, `C36000`), tolerances (`±0.004 mm`), masses (`142 g`, `38 g`), triangle/byte budgets (`14,820 tris // 287 KB GLB`), lab equipment (`Mitutoyo Bright-Strato 7106 CMM`, `Hermle C 250`), fixed engagement scopes (`3 Weeks Fixed` / `6 Weeks Fixed`), and concrete case-study outcomes (`610 g to 324 g`, `3.1x` conversion lift). |
| **Semantics / SEO** | 8.5 | 8.5 | **8.0 / 10** | Dev | `.shots/audit.txt`, `report.json` | `audit.txt` reports `5 pages crawled`, `0 FAIL, 0 WARN`. Unique `<title>`, single descriptive `<h1>` in static and hydrated DOM, proper landmark structure, and real HTTP 404 status on missing routes. |
| **Animations / Transitions** | 7.5 | 8.0 | **8.0 / 10** | Dev | `.shots/home/d-90-transition-a.png`..`c.png`, `report.json` | Continuous optical-datum shutter transition across routes, `idleMotion: true`, `mobile.scrollFps.fps: 60` on all 4 pages, and `hover.noHoverChange: []` / `hover.colorOnly: []` with physical multi-property hover states. |
| **Accessibility** | 7.2 | 8.0 | **8.0 / 10** | Dev | `.shots/summary.json`, `.shots/home/k-01-focus.png`..`k-04-focus.png`, `.shots/home/r-01-hero.png` | `axeSerious: 0`, `axeViolations: []`, `skipLinkFirst: true`, `noVisibleFocus: 0`, `invisibleFocus: 0`, `hiddenTextReduced: 0`, and `movingReduced: false` across all 4 pages. |
| **WPO** | 8.5 | 8.5 | **9.0 / 10** | Dev | `.shots/audit.txt`, `.shots/summary.json` | Heaviest page `/` is `~261 KB` (`JS 70 KB gz`, `CSS 7 KB gz`, `fonts 173 KB`, `images 0`). Throttled mobile LCP is `1864–1996 ms` (`< 2500 ms`), mobile CLS is `0–0.009` (`< 0.05`), `mobile.loaderMs` finishes in `1699–1824 ms` (`< 2600 ms`), and throttled mobile scroll holds `60 fps` on all 4 pages. |
| **Responsive** | 8.0 | 8.5 | **8.0 / 10** | Dev | `.shots/summary.json`, `.shots/home/m-01-hero.png`..`m-06-scroll.png` | `overflow: false` and `smallTargets: 0` across all 4 pages (`summary.json`). Typography, 3D WebGL stage, SVG schematics, and tables adapt cleanly to 390 px width. |
| **Markup / Meta-data** | 8.5 | 8.5 | **8.0 / 10** | Dev | `.shots/audit.txt`, `.shots/summary.json` | `0 FAIL, 0 WARN` in `audit.txt`; `errors: 0` and `failed: []` across all 4 page reports; complete OpenGraph/Twitter metadata, working `og:image`, and single-span accessible labels on all buttons and links. |

**Final Weighted Overall**:
$$\text{Weighted Overall} = 0.4(8.0) + 0.3(8.0) + 0.2(8.0) + 0.1(8.0) = \mathbf{8.00 / 10}$$

---

## 3. Automated Verification Summary (`.shots/summary.json` & `.shots/audit.txt`)

- **`audit.mjs`**: `5 pages crawled`, heaviest page `/` `~261 KB` (`html 11 KB | JS 70 KB gz | CSS 7 KB gz | fonts 173 KB`), **`0 FAIL, 0 WARN`**.
- **`shoot.mjs`**:
  - `home` (`/`): `errors: 0`, `overflow: false`, `smallTargets: 0`, `mobileLcpMs: 1908`, `mobileCls: 0`, `mobileFps: 60`, `axeSerious: 0`, `noHoverChange: 0`, `colorOnly: 0`, `idleMotion: true`
  - `about` (`/about`): `errors: 0`, `overflow: false`, `smallTargets: 0`, `mobileLcpMs: 1996`, `mobileCls: 0.009`, `mobileFps: 60`, `axeSerious: 0`, `noHoverChange: 0`, `colorOnly: 0`, `idleMotion: true`
  - `work-item` (`/work/kestrel-01`): `errors: 0`, `overflow: false`, `smallTargets: 0`, `mobileLcpMs: 1864`, `mobileCls: 0`, `mobileFps: 60`, `axeSerious: 0`, `noHoverChange: 0`, `colorOnly: 0`, `idleMotion: true`
  - `404`: `errors: 0`, `overflow: false`, `smallTargets: 0`, `mobileLcpMs: 1908`, `mobileCls: 0`, `mobileFps: 60`, `axeSerious: 0`, `noHoverChange: 0`, `colorOnly: 0`, `idleMotion: true`

---

## 4. Key Fixes Applied Across Passes

1. **Custom Blender 4.2 `.glb` Models (`scripts/generate_models.py`)**:
   - Procedurally modeled and exported 3 multi-part PBR hardware assemblies from scratch in headless Blender 4.2.3 LTS (`kestrel-recorder.glb` 287 KB, `verge-monochromator.glb` 109 KB, `aether-gimbal.glb` 153 KB) with cooling ribs, hex socket cap screws, stepped titanium cages, copper phase rings, and knurled rotary dials.
2. **Typography & Accessible Markup**:
   - Fixed `SplitText` word-spacing concatenation via `.split-word { margin-right: 0.26em; }`.
   - Replaced dual-span `.roll` markup with a single `<span data-roll="...">` and CSS `::after { content: attr(data-roll) }`, eliminating duplicate accessible link names in screen readers and keyboard focus checks.
3. **3D Stage, Craft Plates & Reduced-Motion Schematic**:
   - Enabled live 60fps Three.js WebGL rendering on both desktop and mobile viewports (`m-01-hero.png`), while hiding the 2D fallback SVG whenever WebGL is active (`display: none; opacity: 0; visibility: hidden;`) and showing a clean static CAD schematic under `prefers-reduced-motion: reduce`.
   - Replaced placeholder shapes in `/work/[slug]` (`PLATE FIG 01.A..C`) with multi-layered orthographic engineering drawings (4-ring acoustic cage cross-section with ray vectors, 24-tooth starwheel detent cam with ceramic plunger, and STEP-to-GLTF topology comparison).
4. **B2B Industrial Design & Copywriting Anti-AI-Slop Overhaul**:
   - Unified first-person principal voice (`"I"`, never `"we"` or third-person drift).
   - Replaced performative graphics jargon and uncontextualized micron flexes with buyer-relevant physical + digital value propositions (`"Tooling-Ready Hardware & Sub-300 KB WebGL Twins From One Master CAD Assembly"`).
   - Grounded all 3 case studies (`Kestrel-01`, `Verge-M2`, `Aether-G9`) with concrete physical and commercial outcomes (`610 g to 324 g`, `3.1x` configurator conversion lift, `42%` shorter sales engineering cycles).
   - Added a friction-free 3-step NDA + 24-hour STEP/IGES engineering audit commissioning flow and removed all em/en dashes from user-facing prose.
