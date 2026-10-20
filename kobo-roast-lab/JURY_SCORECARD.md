# KOBO // ROAST LAB: jury score
Estimate, not affiliated with Awwwards. Independent critic (Pass 3 Verified), from 4 shot page types (6 crawled HTML pages) on 2026-10-20.

**The idea, as the critic read it:** A sunlit Japanese-Pacific Northwest specialty coffee roastery and extraction equipment studio that presents single-origin harvests, convective roast telemetry, and bespoke brass, walnut, and porcelain brewing vessels as an interactive engineering and sensory dossier.
**Critic overall: 8.61 (8.6)** (0.4 Design `8.6` + 0.3 Usability `8.6` + 0.2 Creativity `8.5` + 0.1 Content `8.9`, on the critic's strict scale)
**Jury estimate: about 9.7** (critic + 1.1, measured on two recent Sites of the Day)
**Band, from the estimate:** Site of the Day / Site of the Month contender range (8.2 and up across every criterion)

---

## Summary Score Tables

| Criterion | Weight | Score | Evidence |
|---|---|---|---|
| **Design** | 40% | **8.6 / 10** | `home/d-01-hero.png`, `home/d-02-scroll.png`, `home/d-03-scroll.png`, `home/d-04-scroll.png`, `home/d-05-scroll.png`, `work-item/d-02-scroll.png`, `about/d-06-scroll.png`: disciplined sunlit porcelain/espresso/terracotta palette on an architectural drafting grid, sharp Fraunces + General Sans + JetBrains Mono hierarchy, custom terracotta range sliders across both the 3D stage and Dose Calculator (`home/d-04-scroll.png`), balanced two-column dossier layout with untruncated sub-assembly titles (`work-item/d-02-scroll.png`), non-wrapping price tags (`$25 / 250G` in `home/d-02-scroll.png`), and aligned single-line allocation CTAs (`about/d-06-scroll.png`). |
| **Usability** | 30% | **8.6 / 10** | `summary.json`, `home/report.json`, `work-item/m-01-hero.png`..`m-05-scroll.png`, `home/k-01-focus.png`..`k-04-focus.png`: `0` console/page/network errors across all 4 pages, `0` axe violations, `skipLinkFirst: true`, visible 2px terracotta focus rings (`noVisibleFocus: 0`), `overflow: false`, `smallTargets: 0`, `noHoverChange: 0`, `colorOnly: 0`, throttled mobile `loaderMs: 1576 ms` (`loadMs: 1413 ms`), mobile `LCP: 624–984 ms`, `CLS: 0`, `5-PART SUB-ASSEMBLY INSPECTOR` positioned directly below the 3D stage on mobile (`work-item/m-02-scroll.png`), and stacked mobile Bill of Materials cards (`work-item/m-04-scroll.png`, `work-item/m-05-scroll.png`). |
| **Creativity** | 20% | **8.5 / 10** | `home/d-01-hero.png`, `home/d-04-scroll.png`, `work-item/d-01-hero.png`, `work-item/d-03-scroll.png`: an unmistakable, subject-specific synthesis of specialty coffee extraction science and CAD hardware inspection — combining a 4-specimen interactive 3D turntable (`AXIAL EXPLOSION` slider, wireframe toggle, sub-assembly isolation) with a 5-phase Loring S15 roast telemetry log, a live dose-to-yield refractometer calculator, a botanical aroma compound atlas, and a terracotta-edged curtain page transition. |
| **Content** | 10% | **8.9 / 10** | `audit.mjs` (`0 FAIL, 0 WARN`), `home/d-02-scroll.png`, `home/d-03-scroll.png`, `work-item/d-02-scroll.png`, `work-item/d-04-scroll.png`: zero placeholder or AI-cliche tells; deeply specific farm-gate provenance (Gedeb Worka Sakaro, Huila Finca El Paraiso, Nyeri Othaya AA), chemical aroma compounds (`Linalool & Linalyl Acetate 18.4 mg/L`, `2,5-Dimethylpyrazine`), untruncated 5-part sub-assembly descriptions, and three-stage technical case studies. |

| Developer | Score | Evidence |
|---|---|---|
| **Semantics/SEO** | **9.2 / 10** | `audit.mjs` (`0 FAIL, 0 WARN` across 6 crawled pages), `desktop.h1` in all 4 `report.json` files: valid `lang`, one SSR `<h1>` per page matching hydrated DOM, clean heading hierarchy, `<main>`, unique titles and descriptions, canonical URLs, robots.txt, sitemap, and a real HTTP 404 route (`0` console/network errors). |
| **Animations/Transitions** | **8.6 / 10** | `h-01`..`h-08`, `summary.json`: custom porcelain-and-terracotta curtain wipe with masked line-by-line headline reveal; `noHoverChange: 0` and `colorOnly: 0` across all 4 pages; `IntersectionObserver` (`threshold: [0, 0.05, 0.25]`) pauses WebGL rendering when off-screen; `movingReduced: false` and `hiddenTextReduced: 0` under `prefers-reduced-motion`. |
| **Accessibility** | **9.2 / 10** | `summary.json`, `k-01-focus.png`..`k-04-focus.png`, `r-01-hero.png`, `r-02-mid.png`: `axeSerious: 0` and `0` total axe violations across all 4 pages; `skipLinkFirst: true` with a high-contrast `Skip to content` button on first Tab (`k-01-focus.png`); `noVisibleFocus: 0` and `invisibleFocus: 0` with 2px terracotta focus rings; `hiddenTextReduced: 0` and `movingReduced: false`. |
| **WPO** | **8.8 / 10** | `audit.mjs` (`heaviest page /: ~728 KB | html 15 | JS 6 (gz) | CSS 9 (gz) | fonts 93 | images 605`), `home/report.json`: desktop `loadMs: 137 ms`, `LCP: 228 ms`, `CLS: 0`; throttled mobile `loadMs: 1413 ms`, `loaderMs: 1576 ms` (well below the 2000 ms target), mobile `LCP: 624–984 ms` across all 4 pages, and mobile `CLS: 0`. |
| **Responsive** | **8.7 / 10** | `summary.json` (`overflow: false`, `smallTargets: 0` across all 4 pages), `work-item/m-01-hero.png`..`m-05-scroll.png`: zero horizontal overflow, compliant tap targets, responsive 3D stage hint badge (`max-width: calc(100% - 1.5rem)`), 5-part inspector placed directly beneath the 3D stage on mobile, BOM table stacked into clean mobile cards at `<= 640px`, single Unicode arrows (`→` / `←`) that never split across lines, and `rgba(250, 246, 238, 0.97)` mobile sticky header opacity. |
| **Markup/Meta-data** | **9.3 / 10** | `audit.mjs` (`0 FAIL, 0 WARN` across 6 crawled pages): complete Open Graph and Twitter card metadata, verified `og:image` asset, valid favicon and viewport meta, descriptive `alt` text on all imagery, and accessible names on all buttons and inputs. |

---

## Pass 2 -> Pass 3 Verified Fixes

1. **[Design] Custom Terracotta Styling for All `<input type="range">` Controls (`home/d-04-scroll.png`):**
   - Added global custom range input rules (`input[type="range"]`, `.bench-slider`, `.calc-slider`) in `src/styles/base.css` and scoped rules in `src/pages/index.astro` (`-webkit-appearance: none; appearance: none; accent-color: var(--accent);` with a `16px` `#C45A28` terracotta thumb, `2px solid #FAF6EE` halo, and warm travertine track). Verified in `home/d-04-scroll.png` with zero native system-blue controls.
2. **[Design / Usability / Responsive] Balanced `5-PART SUB-ASSEMBLY INSPECTOR` Layout & Full Untruncated Titles (`work-item/d-02-scroll.png`, `work-item/m-02-scroll.png`):**
   - Updated `.part-row__title` and `.part-row__meta` in `src/components/BenchStage.astro` to `white-space: normal; line-height: 1.3;` so zero part names truncate with `...`.
   - Positioned `.parts-panel` inside `.bench-viewport-col` directly beneath `.bench-stage` on dossier pages (`work-item/d-02-scroll.png`) and ordered `.parts-panel` below `.bench-viewport-col` at `@media (max-width: 1080px)` (`work-item/m-02-scroll.png`).
3. **[Usability / Responsive] Stacked Mobile Bill of Materials Cards & Non-Wrapping Desktop Cells (`work-item/m-04-scroll.png`, `work-item/m-05-scroll.png`):**
   - Added `white-space: nowrap` to `.bom-idx`, `.bom-node`, `.bom-tol`, and `.bom-mass` on desktop in `src/pages/work/[slug].astro`.
   - Added `@media (max-width: 640px)` rules hiding `.bom-table thead` and transforming each `.bom-table tbody tr` into a structured porcelain card (`display: grid; grid-template-columns: auto 1fr auto;`) with full-width descriptions.
4. **[Design / Responsive] Single Unicode Arrows (`→` / `←`), Non-Wrapping Price Badges, and Responsive 3D Hint Pill (`home/d-02-scroll.png`, `work-item/m-03-scroll.png`, `about/d-06-scroll.png`):**
   - Replaced all two-character ASCII `->` and `<-` arrows with single Unicode `→` / `←` across `src/data/projects.ts`, `src/components/BenchStage.astro`, `src/scripts/workbench-stage.ts`, `src/pages/index.astro`, `src/pages/work/[slug].astro`, `src/pages/about.astro`, `src/pages/404.astro`, `src/components/Header.astro`, and `src/components/Footer.astro`.
   - Added `white-space: nowrap; flex-shrink: 0;` to `.origin-card__price` in `src/pages/index.astro`, `flex-wrap: wrap; gap: 0.45rem 1rem;` to `.alloc-card__top` and `white-space: nowrap;` to `.alloc-card__btn` in `src/pages/about.astro`, and `@media (max-width: 560px)` wrapping rules to `.bench-orbit-hint` in `src/components/BenchStage.astro`.
5. **[Design / Responsive] High-Opacity Mobile Sticky Header (`home/m-04-scroll.png`, `work-item/m-04-scroll.png`):**
   - Increased `.hdr` background opacity at `@media (max-width: 760px)` to `rgba(250, 246, 238, 0.97)` with `backdrop-filter: blur(14px)` in `src/components/Header.astro`.
6. **[Usability / WPO] Sub-1.6s Mobile Loader & Code-Split Entry Bundle (`home/report.json`):**
   - Code-split motion and Three.js bundles (`src/layouts/Base.astro`, `src/motion/bench.ts`), subsetted `Fraunces` to an `18 KB` Latin WOFF2 (`93 KB` total fonts, down from `165 KB`), updated `src/components/Loader.astro` to dismiss immediately on touch/mobile and within `180 ms` on desktop, and set `IntersectionObserver` threshold to `[0, 0.05, 0.25]` in `src/scripts/workbench-stage.ts`.
   - Reduced heaviest page `/` from `~1008 KB` (`JS 215 KB gz | fonts 165 KB`) to `~728 KB` (`JS 6 KB gz | fonts 93 KB`), cutting throttled mobile `loadMs` from `2906 ms` to `1413 ms` and `mobile.loaderMs` from `3171 ms` to `1576 ms`.

---

## Measured

- **Pages audited (`audit.mjs`):** 6 pages crawled, `0 FAIL, 0 WARN`.
- **Heaviest page (`/`):** `~728 KB` total (`html 15 KB | JS 6 KB gz | CSS 9 KB gz | fonts 93 KB | images 605 KB`).
- **Desktop Load & LCP (`home/report.json`):** `loadMs: 137 ms`, `loaderMs: 1294 ms`, `LCP: 228 ms` (`h1.t-display`), `CLS: 0`, `scrollFps: 60 fps` (`worstFrameMs: 17 ms`).
- **Throttled Mobile Load & Loader (`home/report.json`):** `loadMs: 1413 ms`, `loaderMs: 1576 ms` (down from `3171 ms`), `CLS: 0`.
- **Throttled Mobile LCP (`mobileLcpMs`):** `home` `980 ms`, `about` `704 ms`, `work-item` `840 ms`, `404` `796 ms`.
- **Throttled Mobile CLS (`mobileCls`):** `0` across all 4 pages (`desktop.vitals.cls`: `0` on `home`, `0` on `about`, `0.001` on `work-item`, `0` on `404`).
- **Accessibility (`a11y` & `keyboard`):** `axeSerious: 0`, `axeViolations: []` on all 4 pages; `skipLinkFirst: true` on all 4 pages; `noVisibleFocus: 0`, `invisibleFocus: 0`, `stuck: false` on all 4 pages.
- **Reduced motion (`reduced`):** `hiddenTextReduced: 0`, `movingReduced: false` on all 4 pages.
- **Responsive layout (`overflow` & `smallTargets`):** `overflow: false` (`desktop.overflowX: false`, `mobile.overflowX: false`) and `smallTargets: 0` on all 4 pages.
- **Pointer & hover (`hover`):** `noHoverChange: 0`, `colorOnly: 0`, `cursorFollower: true` on all 4 pages.
