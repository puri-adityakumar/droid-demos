// Pointer craft: magnetic pull and reticle cursor follower (never hides native cursor).
import { gsap } from 'gsap';
import { isTouch, prefersReducedMotion } from './env';

export function initMagnetic(root: ParentNode = document) {
  if (isTouch() || prefersReducedMotion()) return;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = parseFloat(el.dataset.magnetic || '0.28');
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => { x(0); y(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
  });
}

let follower: HTMLElement | null = null;
export function initCursor() {
  if (follower || isTouch() || prefersReducedMotion()) return;
  follower = document.getElementById('cursor');
  if (!follower) return;
  const label = follower.querySelector<HTMLElement>('[data-cursor-label]');
  const x = gsap.quickTo(follower, 'x', { duration: 0.38, ease: 'power3.out' });
  const y = gsap.quickTo(follower, 'y', { duration: 0.38, ease: 'power3.out' });
  addEventListener('pointermove', (e) => {
    follower!.classList.add('has-moved');
    x(e.clientX);
    y(e.clientY);
    const el = e.target as HTMLElement | null;
    const overControl = el?.closest?.('a, button, input, [role="button"], [data-magnetic]');
    const cursorEl = el?.closest?.<HTMLElement>('[data-cursor], .bench-viewport, [data-bench-canvas]');
    const text = cursorEl?.dataset.cursor || '';
    follower!.classList.toggle('is-active', !!overControl || !!text);
    follower!.classList.toggle('has-label', !!text && !overControl);
    if (label && text && label.textContent !== text) label.textContent = text;
  }, { passive: true });
  addEventListener('scroll', () => {
    follower!.classList.remove('is-active', 'has-label');
  }, { passive: true });
  document.addEventListener('pointerleave', () => {
    follower!.classList.remove('is-active', 'has-label', 'has-moved');
  });
  follower.classList.add('is-ready');
}
