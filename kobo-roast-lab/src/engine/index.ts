// Engine core: framework-agnostic page lifecycle. No DOM access at import time (SSR-safe).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScroll, resetScroll, startScroll, stopScroll } from './scroll';
import { initReveals } from './reveal';
import { initCursor, initMagnetic } from './interactions';
import { runLoader } from './loader';
import { playEnter, playLeave } from './transition';
import { prefersReducedMotion } from './env';

export { onScroll, scrollState, scrollToTarget, stopScroll, startScroll } from './scroll';
export { setTransition } from './transition';
export { setLoaderFormat, setLoaderExit } from './loader';
export { ease, isTouch, isMobile, prefersReducedMotion } from './env';

export type PageFn = (page: { intro: gsap.core.Timeline; path: string }) => void | (() => void);
const pageFns = new Set<PageFn>();
const cleanups: (() => void)[] = [];
let ctx: gsap.Context | null = null;
let intro: gsap.core.Timeline | null = null;
let ready = false;
let booted = false;

export function onPage(fn: PageFn) {
  pageFns.add(fn);
  if (ready) runPageFn(fn);
  return () => { pageFns.delete(fn); };
}

function runPageFn(fn: PageFn) {
  ctx?.add(() => {
    const c = fn({ intro: intro!, path: location.pathname });
    if (typeof c === 'function') cleanups.push(c);
  });
}

export function syncFlags() {
  const h = document.documentElement.classList;
  h.add('js', 'is-booted');
  h.toggle('motion', !prefersReducedMotion());
  if (document.querySelector('canvas[data-bench-canvas], [data-bench-canvas] canvas')) h.add('gl-on');
}

function clearStaleFocus() {
  if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
}

function initPage() {
  syncFlags();
  clearStaleFocus();
  document.getElementById('cursor')?.classList.remove('is-active');
  ctx = gsap.context(() => {
    intro = initReveals(document);
    initMagnetic(document);
  });
  ready = true;
  pageFns.forEach(runPageFn);
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export async function boot(setup?: () => void) {
  if (booted) return;
  booted = true;
  window.addEventListener(
    'pointermove',
    () => document.documentElement.classList.remove('nav-cooldown'),
    { passive: true }
  );
  window.addEventListener('popstate', () => {
    document.documentElement.classList.add('nav-cooldown');
    clearStaleFocus();
  });
  syncFlags();
  initScroll();
  initCursor();
  setup?.();
  stopScroll();
  initPage();
  await runLoader();
  startScroll();
  intro?.play();
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export async function leave() {
  document.documentElement.classList.add('nav-cooldown');
  clearStaleFocus();
  stopScroll();
  await playLeave();
}

export function cleanup() {
  if (!ready) return;
  ready = false;
  cleanups.splice(0).forEach((c) => c());
  ctx?.revert();
  ctx = null;
}

export async function enter({ transition = true, scrollTop = true } = {}) {
  if (!booted) return;
  document.documentElement.classList.add('nav-cooldown');
  clearStaleFocus();
  cleanup();
  if (scrollTop) resetScroll();
  initPage();
  if (transition) await playEnter();
  clearStaleFocus();
  startScroll();
  intro?.play();
}
