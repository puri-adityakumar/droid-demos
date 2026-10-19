// Single-clock idle input: t in seconds, x and y in -0.5..0.5 (lagged pointer or touch scroll velocity).
import { gsap } from 'gsap';
import { onPage, prefersReducedMotion, isTouch } from '../engine';

export const idle = { t: 0, x: 0, y: 0, gate: 1 };

let started = false;
let orbitEls: SVGElement[] = [];
let oscEls: SVGElement[] = [];

export function startIdle() {
  if (started || prefersReducedMotion()) return;
  started = true;

  onPage(() => {
    orbitEls = [...document.querySelectorAll<SVGElement>('[data-idle-orbit]')];
    oscEls = [...document.querySelectorAll<SVGElement>('[data-idle-osc]')];
    return () => {
      orbitEls = [];
      oscEls = [];
    };
  });

  // On touch devices, skip continuous idle ticker work so mobile scroll FPS stays at 60fps
  if (isTouch()) return;

  const aim = { x: 0, y: 0 };
  addEventListener(
    'pointermove',
    (e) => {
      aim.x = e.clientX / innerWidth - 0.5;
      aim.y = e.clientY / innerHeight - 0.5;
    },
    { passive: true }
  );

  let lastSvgMs = 0;

  gsap.ticker.add((t) => {
    const r = gsap.ticker.deltaRatio();
    const k = 1 - Math.pow(0.94, r);
    idle.t = t;
    idle.x += (aim.x - idle.x) * k;
    idle.y += (aim.y - idle.y) * k;

    const now = performance.now();
    if (now - lastSvgMs < 380) return;
    lastSvgMs = now;

    for (let i = 0; i < orbitEls.length; i++) {
      const el = orbitEls[i];
      el.style.transform = `rotate(${((t * 14) % 360).toFixed(2)}deg)`;
      el.style.transformOrigin = '50% 50%';
    }
    for (let i = 0; i < oscEls.length; i++) {
      const el = oscEls[i];
      const dx = Math.sin(t * 1.4 + i) * 6;
      const dy = Math.cos(t * 1.1 + i) * 4;
      el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    }
  });
}
