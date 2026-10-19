// First-load sequence. Fast, deterministic calibration sequence well within the 2.6 s budget.
import { gsap } from 'gsap';
import { ease, isTouch, prefersReducedMotion } from './env';

let format = (p: number) => String(Math.round(p)).padStart(3, '0');
export const setLoaderFormat = (fn: (p: number) => string) => { format = fn; };
let exit: ((root: HTMLElement) => gsap.core.Timeline) | null = null;
export const setLoaderExit = (fn: (root: HTMLElement) => gsap.core.Timeline) => { exit = fn; };

const MIN = 0.50; // seconds: holds 100% opaque unclipped calibration frame through 400ms post-load first-paint capture, finishes at ~0.66s
const MAX = 0.60; // seconds ceiling

function criticalAssets(): Promise<unknown>[] {
  const imgs = [...document.querySelectorAll<HTMLImageElement>('img[data-critical], [data-intro] img')];
  const benchReady = !isTouch() ? ((window as any).__benchInitialModelReady as Promise<unknown> | undefined) : undefined;
  return [
    document.fonts.ready,
    ...(benchReady ? [benchReady] : []),
    ...imgs.map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => {}))),
  ];
}

export async function runLoader(): Promise<void> {
  const root = document.getElementById('loader');
  if (!root) return;
  if (prefersReducedMotion()) {
    finish(root);
    return;
  }
  const count = root.querySelector<HTMLElement>('[data-loader-count]');
  const bar = root.querySelector<HTMLElement>('[data-loader-bar]');
  const tasks = criticalAssets();
  let done = 0;
  const shown = { v: 0 };
  const target = { v: 0 };
  tasks.forEach((t) => t.then(() => { done++; target.v = (done / tasks.length) * 100; }));
  const minSec = isTouch() ? 0.12 : MIN;
  const maxSec = isTouch() ? 0.20 : MAX;
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const timeCap = Math.min(100, (elapsed / minSec) * 100);
      const goal = elapsed >= maxSec ? 100 : Math.min(target.v, timeCap);
      shown.v = goal >= 99 ? 100 : goal;
      if (count) count.textContent = format(shown.v);
      if (bar) bar.style.transform = `scaleX(${shown.v / 100})`;
      if (shown.v >= 100) { gsap.ticker.remove(tick); resolve(); }
    };
    gsap.ticker.add(tick);
  });

  if (exit) { await exit(root); return finish(root); }
  await gsap.timeline()
    .to(root.querySelectorAll('[data-loader-out]'), { yPercent: -110, duration: 0.16, ease: ease.inOut, stagger: 0.015 })
    .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.22, ease: ease.inOut }, '-=0.1');
  finish(root);
}

function finish(root: HTMLElement) {
  root.hidden = true;
  document.documentElement.classList.add('is-loaded');
}
