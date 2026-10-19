// Astro adapter (ClientRouter). Call start(setup) once from the layout's <script>.
import { boot, cleanup, enter, leave, syncFlags } from './index';

let navigating = false;
let booted = false;

export function start(setup?: () => void) {
  document.addEventListener('astro:before-preparation', (e: any) => {
    navigating = true;
    const load = e.loader;
    e.loader = async () => { await Promise.all([leave(), load()]); };
  });
  document.addEventListener('astro:before-swap', () => cleanup());
  document.addEventListener('astro:after-swap', () => {
    syncFlags();
    document.getElementById('loader')?.remove();
  });
  document.addEventListener('astro:page-load', () => {
    if (!navigating) {
      if (booted) return;
      booted = true;
      return void boot(setup);
    }
    navigating = false;
    enter();
  });
  if (!booted) {
    booted = true;
    boot(setup);
  }
}
