import { gsap } from 'gsap';
import { prefersReducedMotion } from '../engine/env';

// Subtle thermal telemetry pulse on live status dots and kiln airflow bars
export function mountIdle(): () => void {
  if (prefersReducedMotion()) return () => {};
  const dots = document.querySelectorAll<HTMLElement>('[data-pulse-dot]');
  const bars = document.querySelectorAll<HTMLElement>('[data-idle-bar]');
  const tweens: gsap.core.Tween[] = [];

  if (dots.length) {
    tweens.push(
      gsap.to(dots, {
        opacity: 0.25,
        duration: 1.05,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.25,
      })
    );
  }

  if (bars.length) {
    tweens.push(
      gsap.fromTo(
        bars,
        { scaleX: 0.22 },
        {
          scaleX: 0.96,
          duration: 1.1,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        }
      )
    );
  }

  return () => {
    tweens.forEach((t) => t.kill());
  };
}
