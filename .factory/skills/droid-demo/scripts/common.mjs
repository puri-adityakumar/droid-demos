import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

async function loadChromium() {
  const candidates = [
    'playwright',
    '/home/factory-user/droid-demos/kobo-roast-lab/node_modules/playwright/index.mjs',
    '/home/factory-user/bell-loop/node_modules/playwright/index.mjs',
  ];
  for (const c of candidates) {
    try {
      if (c.startsWith('/') && !existsSync(c)) continue;
      const mod = await import(c);
      return mod.chromium || mod.default?.chromium;
    } catch {
      // try next candidate
    }
  }
  const req = createRequire(import.meta.url);
  return req('playwright').chromium;
}

export async function launch(extraArgs = []) {
  const chromium = await loadChromium();
  return chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required',
      ...extraArgs,
    ],
  });
}

export const VT = `(() => {
  let now = 1000; const cbs = new Map(); let id = 0;
  performance.now = () => now;
  const base = Date.now(); Date.now = () => base + now;
  window.requestAnimationFrame = (cb) => { id++; cbs.set(id, cb); return id; };
  window.cancelAnimationFrame = (i) => { cbs.delete(i); };
  window.__vt = {
    step(ms) {
      now += ms;
      const list = [...cbs.values()];
      cbs.clear();
      for (const cb of list) {
        try { cb(now); } catch (e) { console.error('raf', e && e.message); }
      }
      return now;
    },
    now: () => now,
  };
})();`;

/**
 * Installs a deterministic frame stepper for chibi-oktaku (chibi-jelly-painting)
 * once document.documentElement.dataset.state === 'ready'.
 * Optionally hides page chrome (.brand, .presets, .mode, .hint, .lil-gui) for
 * pure 1:1 white-paper captures.
 */
export const CHIBI_STEPPER = `(hideChrome = true) => {
  if (hideChrome) {
    const s = document.createElement('style');
    s.textContent = '.brand, .presets, .mode, .hint, .lil-gui, .cursor { display: none !important; } html, body { background: #ffffff !important; }';
    document.head.appendChild(s);
  }
  const a = window.__chibi;
  if (!a) throw new Error('window.__chibi not found — run against Vite dev server');
  a.renderer.setAnimationLoop(null);
  window.__chibiTime = 0;
  window.__stepChibi = (dt = 1 / 30) => {
    window.__chibiTime += dt;
    for (const c of Object.values(a.cast)) c.rig.update(dt);
    a.theme.update(dt);
    if (a.applyView) a.applyView(dt);
    a.controls.update();
    a.filter.update();
    a.filter.render();
    return window.__chibiTime;
  };
  return true;
}`;
