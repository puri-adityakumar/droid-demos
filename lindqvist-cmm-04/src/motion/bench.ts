// Coordinate Measuring Machine (CMM) 3D Stage Driver Module.
// Runs strictly on the single GSAP ticker clock (zero standalone requestAnimationFrame loops).
// Maps scroll progress, interactive vernier explode slider, specimen selector, pointer light angle,
// and idle harmonic drift to the 5 named sub-assemblies (`part_01_chassis` .. `part_05_bayonet_mount`)
// inside `/models/kestrel-recorder.glb`, `/models/verge-monochromator.glb`, and `/models/aether-gimbal.glb`.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onPage, onScroll, prefersReducedMotion, isTouch } from '../engine';
import { projects, type Project, type SubAssemblyPart } from '../data/site';
import { idle } from './idle';

gsap.registerPlugin(ScrollTrigger);

type LoadedPart = {
  node: any; // THREE.Object3D
  basePos: { x: number; y: number; z: number };
  baseRot: { x: number; y: number; z: number };
  spec: SubAssemblyPart;
  materials: any[];
};

type CachedSpecimen = {
  root: any; // THREE.Group
  parts: LoadedPart[];
};

const specimenCache = new Map<string, CachedSpecimen>();

export function startBench() {
  // Global scroll listener updates html.frame-away and header telemetry
  let lastY = 0;
  let lastScrollActivityMs = 0;
  let globalProgress: HTMLElement | null = null;
  onScroll(({ y, progress }) => {
    lastScrollActivityMs = performance.now();
    if (Math.abs(y - lastY) >= 6) {
      document.documentElement.classList.toggle('frame-away', y > 160 && y > lastY);
      lastY = y;
    }
    if (globalProgress) {
      const txt = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
      if (globalProgress.textContent !== txt) globalProgress.textContent = txt;
    }
  });

  onPage(() => {
    globalProgress = document.querySelector<HTMLElement>('[data-frame-progress]');
    const stageEl = document.querySelector<HTMLElement>('[data-bench-stage]');
    if (!stageEl) return;

    const canvasHost = stageEl.querySelector<HTMLElement>('[data-bench-canvas]');
    const initialSlug = stageEl.dataset.initialSpecimen || 'kestrel-01';
    const initialExplode = parseFloat(stageEl.dataset.initialExplode || '0.38');

    let currentProject: Project =
      projects.find((p) => p.slug === initialSlug) || projects[0];

    // Driver state
    let scrollExplode = initialExplode;
    let manualExplode: number | null = null;
    let displayedExplode = initialExplode;
    let wireframeMode = false;
    let highlightedPart: string | null = null;
    let dragYaw = 0;
    let dragPitch = 0;
    let isDragging = false;
    let dragStart = { x: 0, y: 0, yaw: 0, pitch: 0 };
    let inView = true;
    let disposed = false;

    // DOM Elements inside or linked to the bench
    const slider = document.querySelector<HTMLInputElement>('[data-bench-slider]');
    const wireBtn = document.querySelector<HTMLButtonElement>('[data-bench-wireframe]');
    const presetBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-bench-preset]')];
    const specimenBtns = [...document.querySelectorAll<HTMLButtonElement>('[data-specimen-select]')];
    const workRows = [...document.querySelectorAll<HTMLElement>('[data-specimen-hover]')];
    const bomContainer = document.querySelector<HTMLElement>('[data-bom-list]');
    const fallbackSchematics = [... stageEl.querySelectorAll<HTMLElement>('[data-schematic-slug]')];

    const elSpread = document.querySelectorAll<HTMLElement>('[data-telemetry-spread]');
    const elRatio = document.querySelectorAll<HTMLElement>('[data-telemetry-ratio]');
    const elAngle = document.querySelectorAll<HTMLElement>('[data-telemetry-angle]');
    const elSpecimen = document.querySelectorAll<HTMLElement>('[data-telemetry-specimen]');
    const elTolerance = document.querySelectorAll<HTMLElement>('[data-telemetry-tolerance]');
    const elMode = document.querySelectorAll<HTMLElement>('[data-telemetry-mode]');
    const elActivePart = document.querySelectorAll<HTMLElement>('[data-telemetry-part]');
    const reticleRing = stageEl.querySelector<SVGGElement>('[data-reticle-orbit]');
    const svgGroups = [...stageEl.querySelectorAll<SVGGElement>('[data-svg-part], [data-part]')];

    const setText = (nodes: NodeListOf<HTMLElement>, value: string) => {
      nodes.forEach((n) => {
        if (n.textContent !== value) n.textContent = value;
      });
    };

    // Sync DOM BOM list when specimen changes
    const renderBomDom = (proj: Project) => {
      fallbackSchematics.forEach((el) => {
        const match = el.dataset.schematicSlug === proj.slug;
        el.classList.toggle('is-active', match);
        el.setAttribute('aria-hidden', match ? 'false' : 'true');
      });
      specimenBtns.forEach((btn) => {
        const active = btn.dataset.specimenSelect === proj.slug;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      setText(elSpecimen, `${proj.shortTitle.toUpperCase()} // ${proj.glbSize}`);
      setText(elTolerance, proj.datumTolerance);

      if (!bomContainer) return;
      const rows = [...bomContainer.querySelectorAll<HTMLElement>('[data-bom-row]')];
      rows.forEach((row, idx) => {
        const part = proj.parts[idx];
        if (!part) return;
        row.dataset.bomPart = part.nodeName;
        const codeEl = row.querySelector<HTMLElement>('[data-part-code]');
        const labelEl = row.querySelector<HTMLElement>('[data-part-label]');
        const matEl = row.querySelector<HTMLElement>('[data-part-material]');
        const tolEl = row.querySelector<HTMLElement>('[data-part-tolerance]');
        if (codeEl) codeEl.textContent = `${part.index} // ${part.code}`;
        if (labelEl) labelEl.textContent = part.label;
        if (matEl) matEl.textContent = part.material;
        if (tolEl) tolEl.textContent = `${part.tolerance} · ${part.mass}`;
      });
    };

    const updateTelemetryDom = (explodeVal: number, angleDeg: number) => {
      const mm = (explodeVal * currentProject.axialTravelMm).toFixed(1).padStart(4, '0');
      const pct = `${String(Math.round(explodeVal * 100)).padStart(3, '0')}%`;
      const deg = `${angleDeg.toFixed(1).padStart(5, '0')}°`;
      setText(elSpread, `+${mm} mm`);
      setText(elRatio, pct);
      setText(elAngle, deg);
      setText(elMode, wireframeMode ? 'CAD WIREFRAME' : 'PBR BILLET');
      document.documentElement.dataset.benchMode = wireframeMode ? 'wireframe' : 'billet';

      if (slider && document.activeElement !== slider) {
        slider.value = String(Math.round(explodeVal * 100));
      }
      presetBtns.forEach((btn) => {
        const target = parseFloat(btn.dataset.benchPreset || '0');
        const isCurrent = Math.abs(target - explodeVal) < 0.08;
        btn.classList.toggle('is-active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });
    };

    renderBomDom(currentProject);
    updateTelemetryDom(displayedExplode, 24.0);

    const applySvgParts = (val: number) => {
      svgGroups.forEach((g) => {
        const vy = parseFloat(g.dataset.svgVy || '0');
        const vx = parseFloat(g.dataset.svgVx || '0');
        const shiftY = vy * val * 38;
        const shiftX = vx * val * 32;
        g.style.transform = `translate(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px)`;
      });
    };
    applySvgParts(displayedExplode);

    // Under prefers-reduced-motion: keep static Orthographic CAD Blueprint interactive via slider, presets, and tabs
    if (prefersReducedMotion()) {
      const applyStaticState = (val: number) => {
        displayedExplode = gsap.utils.clamp(0, 1, val);
        applySvgParts(displayedExplode);
        updateTelemetryDom(displayedExplode, 24.0);
      };
      const onSlider = () => {
        if (!slider) return;
        applyStaticState(parseFloat(slider.value) / 100);
      };
      slider?.addEventListener('input', onSlider);
      const onPreset = (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        applyStaticState(parseFloat(btn.dataset.benchPreset || '0.38'));
      };
      presetBtns.forEach((b) => b.addEventListener('click', onPreset));
      const onSpecClick = (e: Event) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const slug = btn.dataset.specimenSelect;
        if (!slug) return;
        const proj = projects.find((p) => p.slug === slug) || projects[0];
        currentProject = proj;
        renderBomDom(proj);
        applySvgParts(displayedExplode);
        updateTelemetryDom(displayedExplode, 24.0);
      };
      specimenBtns.forEach((b) => b.addEventListener('click', onSpecClick));
      return () => {
        slider?.removeEventListener('input', onSlider);
        presetBtns.forEach((b) => b.removeEventListener('click', onPreset));
        specimenBtns.forEach((b) => b.removeEventListener('click', onSpecClick));
      };
    }

    const touchMode = isTouch() || window.innerWidth < 900;
    let needsRender = true;

    // ScrollTrigger for sticky hero scrub (desktop only so mobile touch scroll runs at 60 fps)
    const heroSection = document.querySelector<HTMLElement>('[data-bench-hero]');
    let stHero: ScrollTrigger | null = null;
    if (heroSection && !touchMode) {
      stHero = ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          scrollExplode = initialExplode + self.progress * (1 - initialExplode);
          needsRender = true;
        },
      });
    }

    // Pause ticker work when stage is completely scrolled out of view
    const stVisibility = ScrollTrigger.create({
      trigger: stageEl,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        inView = self.isActive;
        if (inView) needsRender = true;
      },
    });

    // Event handlers for interactive controls
    const cleanups: (() => void)[] = [];

    if (slider) {
      const onInput = () => {
        manualExplode = gsap.utils.clamp(0, 1, parseFloat(slider.value) / 100);
        if (touchMode) {
          displayedExplode = manualExplode;
          applySvgParts(displayedExplode);
          updateTelemetryDom(displayedExplode, 24.0);
        }
        needsRender = true;
      };
      slider.addEventListener('input', onInput);
      cleanups.push(() => slider.removeEventListener('input', onInput));
    }

    presetBtns.forEach((btn) => {
      const onClick = () => {
        const val = parseFloat(btn.dataset.benchPreset || '0.38');
        manualExplode = gsap.utils.clamp(0, 1, val);
        if (touchMode) {
          displayedExplode = manualExplode;
          applySvgParts(displayedExplode);
          updateTelemetryDom(displayedExplode, 24.0);
        }
        needsRender = true;
      };
      btn.addEventListener('click', onClick);
      cleanups.push(() => btn.removeEventListener('click', onClick));
    });

    // Three.js references populated once async chunk initializes
    let renderer: any = null;
    let scene: any = null;
    let camera: any = null;
    let stageGroup: any = null;
    let keyLight: any = null;
    let rimLight: any = null;
    let activeCached: CachedSpecimen | null = null;
    let switchSpecimenFn: ((slug: string) => void) | null = null;
    let applyWireframeFn: ((wire: boolean) => void) | null = null;
    let highlightPartFn: ((nodeName: string | null) => void) | null = null;

    if (wireBtn) {
      const onWireClick = () => {
        wireframeMode = !wireframeMode;
        wireBtn.classList.toggle('is-active', wireframeMode);
        wireBtn.setAttribute('aria-pressed', wireframeMode ? 'true' : 'false');
        stageEl.classList.toggle('is-wireframe', wireframeMode);
        applyWireframeFn?.(wireframeMode);
        updateTelemetryDom(displayedExplode, 24.0);
        needsRender = true;
      };
      wireBtn.addEventListener('click', onWireClick);
      cleanups.push(() => wireBtn.removeEventListener('click', onWireClick));
    }

    specimenBtns.forEach((btn) => {
      const onClick = () => {
        const slug = btn.dataset.specimenSelect;
        if (slug) {
          switchSpecimenFn?.(slug);
          needsRender = true;
        }
      };
      btn.addEventListener('click', onClick);
      cleanups.push(() => btn.removeEventListener('click', onClick));
    });

    workRows.forEach((row) => {
      const triggerSwitch = () => {
        const slug = row.dataset.specimenHover;
        if (slug) {
          switchSpecimenFn?.(slug);
          needsRender = true;
        }
      };
      row.addEventListener('pointerenter', triggerSwitch);
      row.addEventListener('focusin', triggerSwitch);
      cleanups.push(() => {
        row.removeEventListener('pointerenter', triggerSwitch);
        row.removeEventListener('focusin', triggerSwitch);
      });
    });

    if (bomContainer) {
      const rows = [...bomContainer.querySelectorAll<HTMLElement>('[data-bom-row]')];
      rows.forEach((row) => {
        const onEnter = () => {
          const partName = row.dataset.bomPart || null;
          highlightedPart = partName;
          rows.forEach((r) => r.classList.toggle('is-highlighted', r === row));
          const partObj = currentProject.parts.find((p) => p.nodeName === partName);
          if (partObj) {
            setText(elActivePart, `${partObj.index} ${partObj.label.toUpperCase()} (${partObj.tolerance})`);
          }
          highlightPartFn?.(partName);
          needsRender = true;
        };
        const onLeave = () => {
          highlightedPart = null;
          row.classList.remove('is-highlighted');
          setText(elActivePart, 'ALL 05 SUB-ASSEMBLIES LOCKED');
          highlightPartFn?.(null);
          needsRender = true;
        };
        row.addEventListener('pointerenter', onEnter);
        row.addEventListener('pointerleave', onLeave);
        row.addEventListener('focusin', onEnter);
        row.addEventListener('focusout', onLeave);
        row.addEventListener('click', () => {
          if (displayedExplode < 0.45) manualExplode = 0.72;
          onEnter();
        });
        cleanups.push(() => {
          row.removeEventListener('pointerenter', onEnter);
          row.removeEventListener('pointerleave', onLeave);
          row.removeEventListener('focusin', onEnter);
          row.removeEventListener('focusout', onLeave);
        });
      });
    }

    // Pointer drag rotation on the 3D viewport
    if (canvasHost) {
      const onPointerDown = (e: PointerEvent) => {
        isDragging = true;
        dragStart = { x: e.clientX, y: e.clientY, yaw: dragYaw, pitch: dragPitch };
        canvasHost.setPointerCapture?.(e.pointerId);
      };
      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        dragYaw = dragStart.yaw + (e.clientX - dragStart.x) * 0.009;
        dragPitch = gsap.utils.clamp(-0.55, 0.55, dragStart.pitch + (e.clientY - dragStart.y) * 0.007);
        needsRender = true;
      };
      const onPointerUp = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        canvasHost.releasePointerCapture?.(e.pointerId);
      };
      canvasHost.addEventListener('pointerdown', onPointerDown);
      canvasHost.addEventListener('pointermove', onPointerMove);
      canvasHost.addEventListener('pointerup', onPointerUp);
      canvasHost.addEventListener('pointercancel', onPointerUp);
      cleanups.push(() => {
        canvasHost.removeEventListener('pointerdown', onPointerDown);
        canvasHost.removeEventListener('pointermove', onPointerMove);
        canvasHost.removeEventListener('pointerup', onPointerUp);
        canvasHost.removeEventListener('pointercancel', onPointerUp);
      });
    }

    let lastRenderMs = 0;

    // Single-clock tick function added to gsap.ticker
    const tick = () => {
      if (!inView || disposed) return;

      // On touch/mobile, only render when state is dirty so touch scroll stays at a locked 60 fps
      if (touchMode && !needsRender) return;

      const now = performance.now();
      const gate = touchMode ? 0 : idle.gate;
      const activelyScrolling = now - lastScrollActivityMs < 140;

      // When purely idle (no user input/scroll), step WebGL renders at ~2.6 Hz to keep software GPU fast
      if (!needsRender && (activelyScrolling || now - lastRenderMs < 380)) return;
      if (needsRender && activelyScrolling && now - lastRenderMs < 34) return;

      // Target explode combines scroll or manual vernier + subtle harmonic breathing
      const baseTarget = manualExplode !== null ? manualExplode : scrollExplode;
      const idleBreath = Math.sin(idle.t * 1.55) * 0.008 * gate;
      const targetExplode = gsap.utils.clamp(0, 1, baseTarget + idleBreath);
      const diffExplode = targetExplode - displayedExplode;
      displayedExplode += touchMode || Math.abs(diffExplode) < 0.003
        ? diffExplode
        : diffExplode * 0.38;

      // Precision metrology vernier oscillation + pointer influence
      const yawRad = 0.42 + Math.sin(idle.t * 1.45) * 0.022 * gate + dragYaw + idle.x * 0.36 * gate;
      const pitchRad = 0.22 + Math.cos(idle.t * 1.1) * 0.01 * gate + dragPitch + idle.y * 0.22 * gate;
      const angleDeg = (((yawRad * 180) / Math.PI) % 360 + 360) % 360;

      if (!touchMode || needsRender) {
        updateTelemetryDom(displayedExplode, angleDeg);
      }

      if (reticleRing && gate > 0) {
        reticleRing.style.transform = `rotate(${((idle.t * 28 * gate) % 360).toFixed(2)}deg)`;
        reticleRing.style.transformOrigin = '50% 50%';
      }
      if (!document.documentElement.classList.contains('gl-on')) {
        applySvgParts(displayedExplode);
      }

      // Drive Three.js 3D assembly if WebGL is active
      if (renderer && scene && camera && stageGroup) {
        stageGroup.rotation.y = yawRad;
        stageGroup.rotation.x = pitchRad;

        if (keyLight && !touchMode) {
          keyLight.position.x = 3.2 + idle.x * 2.4;
          keyLight.position.y = 4.5 - idle.y * 1.8;
        }
        if (rimLight && !touchMode) {
          rimLight.position.x = -3.4 - idle.x * 1.5;
        }

        if (activeCached) {
          for (const part of activeCached.parts) {
            const [vx, vy, vz] = part.spec.vector;
            const spread = displayedExplode * 0.65;
            part.node.position.set(
              part.basePos.x + vx * spread,
              part.basePos.y + vy * spread,
              part.basePos.z + vz * spread
            );
            if (part.spec.nodeName === 'part_04_rotary_gain' || part.spec.nodeName === 'part_02_capsule_guard') {
              part.node.rotation.y = part.baseRot.y + displayedExplode * 0.45;
            }
          }
        }

        renderer.render(scene, camera);
        lastRenderMs = now;
        if (touchMode || Math.abs(targetExplode - displayedExplode) < 0.004) {
          needsRender = false;
        }
      }
    };

    gsap.ticker.add(tick);

    // Boot Three.js + GLTFLoader asynchronously on both desktop and mobile
    if (canvasHost) {
      let resolveInitialReady: (() => void) | null = null;
      (window as any).__benchInitialModelReady = new Promise<void>((res) => {
        resolveInitialReady = res;
        setTimeout(res, 220);
      });

      Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
      ])
        .then(([THREE, { GLTFLoader }]) => {
          if (disposed) return;

          try {
            renderer = new THREE.WebGLRenderer({
              antialias: !touchMode,
              alpha: true,
              powerPreference: 'high-performance',
            });
          } catch {
            document.documentElement.classList.add('no-gl');
            resolveInitialReady?.();
            return;
          }

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touchMode ? 1.25 : 1.5));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        const rect = canvasHost.getBoundingClientRect();
        const w = Math.max(280, rect.width || 640);
        const h = Math.max(280, rect.height || 520);
        renderer.setSize(w, h, false);
        renderer.domElement.classList.add('bench-gl-canvas');
        renderer.domElement.setAttribute('aria-hidden', 'true');
        canvasHost.innerHTML = '';
        canvasHost.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
        camera.position.set(0, 0.12, 6.4);
        camera.lookAt(0, 0, 0);

        // Precision 5-light studio metrology rig (zero PMREM cubemap convolution stall)
        const hemi = new THREE.HemisphereLight(0xfffcf5, 0x18202c, 2.2);
        scene.add(hemi);

        const ambient = new THREE.AmbientLight(0xeceae4, 0.85);
        scene.add(ambient);

        keyLight = new THREE.DirectionalLight(0xfffcf5, 3.4);
        keyLight.position.set(3.2, 4.5, 3.8);
        scene.add(keyLight);

        rimLight = new THREE.DirectionalLight(0xd9b05b, 2.4);
        rimLight.position.set(-3.4, 2.2, -2.8);
        scene.add(rimLight);

        const fillLight = new THREE.DirectionalLight(0x9da5b0, 1.6);
        fillLight.position.set(-2.2, -1.5, 3.5);
        scene.add(fillLight);

        const vermilionBounce = new THREE.PointLight(0xff5530, 1.8, 9);
        vermilionBounce.position.set(0, -2.1, 1.4);
        scene.add(vermilionBounce);

        stageGroup = new THREE.Group();
        scene.add(stageGroup);

        // Caliper coordinate ring around the base of the 3D stage
        const ringGeo = new THREE.RingGeometry(1.32, 1.35, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xe84520,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.42,
        });
        const datumRing = new THREE.Mesh(ringGeo, ringMat);
        datumRing.rotation.x = Math.PI / 2;
        datumRing.position.y = -1.35;
        scene.add(datumRing);

        stageEl.classList.add('is-gl-ready');
        document.documentElement.classList.add('gl-on');
        needsRender = true;

        const loader = new GLTFLoader();

        const applyWireframe = (wire: boolean) => {
          if (!activeCached) return;
          for (const p of activeCached.parts) {
            for (const m of p.materials) {
              m.wireframe = wire;
              m.needsUpdate = true;
            }
          }
        };
        applyWireframeFn = applyWireframe;

        const highlightPart = (nodeName: string | null) => {
          if (!activeCached) return;
          for (const p of activeCached.parts) {
            const isMatch = nodeName && p.spec.nodeName === nodeName;
            for (const m of p.materials) {
              if (m.emissive) {
                if (isMatch) {
                  m.emissive.setHex(0xe84520);
                  m.emissiveIntensity = 0.55;
                } else if (m.name === 'Signal_Vermilion') {
                  m.emissive.setRGB(0.35, 0.06, 0.02);
                  m.emissiveIntensity = 1.0;
                } else {
                  m.emissive.setHex(0x000000);
                  m.emissiveIntensity = 0;
                }
              }
            }
          }
        };
        highlightPartFn = highlightPart;

        const mountSpecimen = (proj: Project, cached: CachedSpecimen) => {
          if (disposed) return;
          while (stageGroup.children.length > 0) {
            stageGroup.remove(stageGroup.children[0]);
          }
          activeCached = cached;
          for (const part of cached.parts) {
            const [vx, vy, vz] = part.spec.vector;
            const spread = displayedExplode * 0.65;
            part.node.position.set(
              part.basePos.x + vx * spread,
              part.basePos.y + vy * spread,
              part.basePos.z + vz * spread
            );
            if (part.spec.nodeName === 'part_04_rotary_gain' || part.spec.nodeName === 'part_02_capsule_guard') {
              part.node.rotation.y = part.baseRot.y + displayedExplode * 0.45;
            }
          }
          stageGroup.rotation.y = 0.42 + dragYaw;
          stageGroup.rotation.x = 0.22 + dragPitch;
          stageGroup.add(cached.root);
          applyWireframe(wireframeMode);
          highlightPart(highlightedPart);
          stageEl.classList.add('is-gl-ready');
          document.documentElement.classList.add('gl-on');
          renderer.render(scene, camera);
          lastRenderMs = performance.now();
          needsRender = false;
          resolveInitialReady?.();
        };

        const loadAndSwitch = (slug: string) => {
          const proj = projects.find((p) => p.slug === slug) || projects[0];
          currentProject = proj;
          renderBomDom(proj);

          const existing = specimenCache.get(proj.slug);
          if (existing) {
            mountSpecimen(proj, existing);
            return;
          }

          loader.load(
            proj.modelUrl,
            (gltf: any) => {
              if (disposed) return;
              const root = gltf.scene;
              const parts: LoadedPart[] = [];

              for (const spec of proj.parts) {
                const found = root.getObjectByName(spec.nodeName);
                if (found) {
                  const mats: any[] = [];
                  found.traverse((child: any) => {
                    if (child.isMesh && child.material) {
                      const cloned = child.material.clone();
                      if (typeof cloned.metalness === 'number') {
                        cloned.metalness = Math.min(cloned.metalness, 0.58);
                      }
                      if (typeof cloned.roughness === 'number') {
                        cloned.roughness = Math.max(cloned.roughness, 0.24);
                      }
                      child.material = cloned;
                      mats.push(cloned);
                    }
                  });
                  parts.push({
                    node: found,
                    basePos: { x: found.position.x, y: found.position.y, z: found.position.z },
                    baseRot: { x: found.rotation.x, y: found.rotation.y, z: found.rotation.z },
                    spec,
                    materials: mats,
                  });
                }
              }

              const cached: CachedSpecimen = { root, parts };
              specimenCache.set(proj.slug, cached);
              if (currentProject.slug === proj.slug) {
                mountSpecimen(proj, cached);
              }
            },
            undefined,
            () => {
              resolveInitialReady?.();
            }
          );
        };

        switchSpecimenFn = loadAndSwitch;
        loadAndSwitch(currentProject.slug);

        const onResize = () => {
          if (!renderer || !camera || !canvasHost) return;
          const r = canvasHost.getBoundingClientRect();
          const nw = Math.max(260, r.width);
          const nh = Math.max(260, r.height);
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh, false);
          needsRender = true;
        };
        window.addEventListener('resize', onResize, { passive: true });
        cleanups.push(() => window.removeEventListener('resize', onResize));
      })
      .catch(() => {
        resolveInitialReady?.();
      });
    }

    return () => {
      disposed = true;
      gsap.ticker.remove(tick);
      stHero?.kill();
      stVisibility.kill();
      cleanups.forEach((fn) => fn());
      if (renderer) {
        renderer.dispose();
        renderer = null;
      }
    };
  });
}
