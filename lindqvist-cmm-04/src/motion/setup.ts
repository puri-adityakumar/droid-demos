// Global motion setup: runs once on the client before the first page initializes.
import { gsap } from 'gsap';
import {
  setLoaderFormat,
  setLoaderExit,
  setTransition,
  onPage,
  ease,
} from '../engine';
import { startIdle } from './idle';
import { startBench } from './bench';

export function setupMotion() {
  // Format loader counter as precision micrometer calibration percentage
  setLoaderFormat((p) => `CAL ${String(Math.round(p)).padStart(3, '0')}%`);

  // Fast, continuous mechanical shutter handoff into the hero stage (never clips title text vertically)
  setLoaderExit((root) =>
    gsap
      .timeline()
      .to(
        root,
        {
          autoAlpha: 0,
          duration: 0.08,
          ease: ease.inOut,
        }
      )
  );

  // Optical shutter page transition
  setTransition({
    leave: (c) =>
      gsap
        .timeline()
        .set(c, { autoAlpha: 1 })
        .fromTo(
          c.querySelector('.curtain__panel'),
          { yPercent: 100 },
          { yPercent: 0, duration: 0.58, ease: ease.inOut }
        ),
    enter: (c) =>
      gsap
        .timeline()
        .to(c.querySelector('.curtain__panel'), {
          yPercent: -100,
          duration: 0.62,
          ease: ease.inOut,
        })
        .set(c, { autoAlpha: 0 }),
  });

  startIdle();
  startBench();

  // Interactive Pipeline Schematic switcher + Mobile Menu accessibility (focus trap + Escape)
  onPage(() => {
    const cleanups: (() => void)[] = [];

    // Pipeline stage tabs
    const pipeBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-pipeline-tab]')];
    const pipePanels = [...document.querySelectorAll<HTMLElement>('[data-pipeline-panel]')];
    const pipeLayerNodes = [...document.querySelectorAll<SVGElement>('[data-pipeline-svg-stage]')];

    const activatePipeStage = (step: string) => {
      pipeBtns.forEach((b) => {
        const active = b.dataset.pipelineTab === step;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      pipePanels.forEach((p) => {
        const active = p.dataset.pipelinePanel === step;
        p.classList.toggle('is-active', active);
      });
      pipeLayerNodes.forEach((node) => {
        const active = node.dataset.pipelineSvgStage === step || step === 'all';
        node.classList.toggle('is-lit', active);
      });
    };

    pipeBtns.forEach((btn) => {
      const onClick = () => {
        const step = btn.dataset.pipelineTab || '01';
        activatePipeStage(step);
      };
      btn.addEventListener('click', onClick);
      cleanups.push(() => btn.removeEventListener('click', onClick));
    });

    // Mobile Menu Dialog / Overlay
    const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
    const menuDrawer = document.querySelector<HTMLElement>('[data-menu-drawer]');
    if (menuBtn && menuDrawer) {
      const setMenu = (open: boolean) => {
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuDrawer.hidden = !open;
        menuDrawer.classList.toggle('is-open', open);
        document.documentElement.classList.toggle('menu-open', open);
        if (open) {
          const firstLink = menuDrawer.querySelector<HTMLElement>('a, button');
          firstLink?.focus();
        } else {
          menuBtn.focus();
        }
      };

      const onToggle = () => {
        const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
        setMenu(!isOpen);
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
          setMenu(false);
        }
      };

      menuBtn.addEventListener('click', onToggle);
      window.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        menuBtn.removeEventListener('click', onToggle);
        window.removeEventListener('keydown', onKeyDown);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  });
}
