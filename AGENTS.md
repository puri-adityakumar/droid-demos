# AGENTS.md — Droid Demos

## Recording Demo & Comparison Videos (`/droid-demo`)

- **Skill:** Activate `/droid-demo` (`.factory/skills/droid-demo/SKILL.md`, also installed system-wide at `~/.factory/skills/droid-demo/`) whenever recording or rendering a demo or comparison video for any project in `droid-demos`.
- **Sharp Edges Only (`rx="0"`):** Never use rounded corners on framed cutouts or video panes. All `droid-demos` frame templates (`templates/single-landscape.html`, `templates/single-vertical.html`, `templates/landscape.html`, `templates/vertical.html`) use sharp 90° corners (`rx="0"`) on `#fafaf8`.
- **Solo Landscape = 4:3 (`1440×1080`):** Single-project landscape showcases (`--format single-landscape`, `templates/single-landscape.html`) use a **4:3 (`1440×1080`)** canvas with tight `80px` left/right margins (`1280×800` for `16:10` captures, `1280×720` for `16:9` captures) so there is no excess horizontal whitespace.
- **Chibi-Oktaku (`chibi-jelly-painting`) Mode (`--format chibi`):**
  - **1:1 square (`1080×1080`)** aspect ratio.
  - **Pure white (`#ffffff`)** background.
  - **No text, no headers, no token/stats overlays.**
- **External Output Directory (`/home/factory-user/droid-demo-videos/`):** Store generated MP4s, posters, overlay PNGs, and `spec.json` files in `/home/factory-user/droid-demo-videos/<slug>/`.
