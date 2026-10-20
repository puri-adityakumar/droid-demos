// Declarative motion through data attributes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ease, prefersReducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger, SplitText);

const durations = { lines: 0.72, words: 0.68, chars: 0.58 } as const;
const staggers = { lines: 0.05, words: 0.022, chars: 0.012 } as const;

function splitTween(el: HTMLElement, isIntro: boolean) {
  const type = (el.dataset.split || 'lines') as keyof typeof durations;
  const delay = parseFloat(el.dataset.delay || '0');
  const s = { tween: undefined as gsap.core.Tween | undefined, done: false, requested: false };
  gsap.set(el, { visibility: 'visible', opacity: 1 });
  if (!isIntro) {
    s.tween = gsap.fromTo(
      el,
      { y: 10, opacity: 1 },
      {
        y: 0,
        opacity: 1,
        duration: durations[type],
        ease: ease.out,
        delay,
        onComplete: () => { s.done = true; },
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
      }
    );
    return () => { s.requested = true; s.tween?.play(); };
  }
  SplitText.create(el, {
    type: type === 'lines' ? 'lines' : `lines,${type}`,
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    wordsClass: 'split-word',
    charsClass: 'split-char',
    onSplit(self) {
      gsap.set(el, { visibility: 'visible', opacity: 1 });
      if (s.done) return;
      const targets = type === 'lines' ? self.lines : type === 'words' ? self.words : self.chars;
      s.tween = gsap.fromTo(
        targets,
        { yPercent: 28, opacity: 1 },
        {
          yPercent: 0,
          opacity: 1,
          duration: durations[type],
          stagger: staggers[type],
          ease: ease.out,
          delay,
          paused: isIntro && !s.requested,
          onComplete: () => { s.done = true; },
        }
      );
      return s.tween;
    },
  });
  return () => { s.requested = true; s.tween?.play(); };
}

function blockTween(el: HTMLElement, paused: boolean) {
  const kind = el.dataset.reveal || 'up';
  const delay = parseFloat(el.dataset.delay || '0');
  const from: gsap.TweenVars =
    kind === 'fade' ? { opacity: 1, y: 6 }
    : kind === 'clip' ? { opacity: 1, y: 10 }
    : kind === 'scale' ? { scale: 1.02, opacity: 1 }
    : { y: 12, opacity: 1 };
  const to: gsap.TweenVars = kind === 'scale' ? { scale: 1 } : {};
  gsap.set(el, { visibility: 'visible', opacity: 1 });
  return gsap.fromTo(el, from, {
    ...to,
    y: 0,
    opacity: 1,
    duration: kind === 'fade' ? 0.55 : 0.65,
    ease: ease.out,
    delay,
    paused,
    scrollTrigger: paused ? undefined : { trigger: el, start: 'top 95%', once: true },
  });
}

export function initReveals(root: ParentNode = document) {
  const intro = gsap.timeline({ paused: true });
  if (prefersReducedMotion()) return intro;

  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const isIntro = el.hasAttribute('data-intro') || el.hasAttribute('data-hero');
    const play = splitTween(el, isIntro);
    if (isIntro) intro.add(play, 0);
  });
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const isIntro = el.hasAttribute('data-intro') || el.hasAttribute('data-hero');
    const t = blockTween(el, isIntro);
    if (isIntro) intro.add(() => t.play(), 0);
  });
  root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.parallax || '0.15');
    gsap.fromTo(el, { yPercent: -amount * 100 }, {
      yPercent: amount * 100,
      ease: 'none',
      scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  return intro;
}
