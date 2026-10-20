// KOBO // ROAST LAB — Choreography setup, thermal calibration loader format, and lifecycle mounts
import { gsap } from 'gsap';
import {
  onPage,
  ease,
  setLoaderFormat,
  setLoaderExit,
  setTransition,
} from '../engine/index';
import { mountBenchStage } from './bench';
import { mountIdle } from './idle';

export function setup() {
  // Format loader counter as Loring S15 First Crack calibration (92.0°C -> 196.4°C)
  setLoaderFormat((p) => {
    const temp = 92.0 + (p / 100) * (196.4 - 92.0);
    return `${temp.toFixed(1)}°C`;
  });

  setLoaderExit((root) =>
    gsap
      .timeline()
      .to(root.querySelectorAll('[data-loader-out]'), {
        yPercent: -105,
        opacity: 0,
        duration: 0.14,
        ease: ease.inOut,
        stagger: 0.012,
      })
      .to(
        root,
        {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.18,
          ease: ease.inOut,
        },
        '-=0.08'
      )
  );

  setTransition({
    leave: (c) =>
      gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .fromTo(
          c.querySelector('.curtain__panel'),
          { yPercent: 100 },
          { yPercent: 0, duration: 0.48, ease: ease.inOut }
        ),
    enter: (c) =>
      gsap
        .timeline()
        .to(c.querySelector('.curtain__panel'), {
          yPercent: -100,
          duration: 0.54,
          ease: ease.inOut,
        })
        .set(c, { autoAlpha: 0 }),
  });

  onPage(() => {
    const stopBench = mountBenchStage();
    const stopIdle = mountIdle();
    return () => {
      stopBench();
      stopIdle();
    };
  });
}
