// KOBO // ROAST LAB — High-Key Sunlit 3D Extraction Stage & Interactive Lab Telemetry
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from 'gsap';
import { prefersReducedMotion } from '../engine/env';
import { projects, roastCurvePhases, type Project } from '../data/projects';

type PartEntry = {
  node: THREE.Object3D;
  basePos: THREE.Vector3;
  baseScale: THREE.Vector3;
  vector: THREE.Vector3;
  meshes: THREE.Mesh[];
};

const modelCache = new Map<string, THREE.Group>();

export function mountWorkbenchStage(): () => void {
  const cleanups: Array<() => void> = [];

  // Mount interactive Roast Curve & Brew Calculator even on pages without the 3D stage
  cleanups.push(mountRoastCurveInteractive());
  cleanups.push(mountBrewCalculatorInteractive());

  const stageEl = document.querySelector<HTMLElement>('[data-bench-stage]');
  const canvas = stageEl?.querySelector<HTMLCanvasElement>('[data-bench-canvas]');
  if (!stageEl || !canvas) {
    return () => cleanups.forEach((fn) => fn());
  }

  const initialSlug = (stageEl.dataset.initialSlug as Project['slug']) || 'lever-l01';
  let currentProject = projects.find((p) => p.slug === initialSlug) || projects[0];

  // WebGLRenderer configured for high-key sunlit daylight & screenshot capture
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
  } catch {
    stageEl.dataset.webglFallback = 'true';
    return () => cleanups.forEach((fn) => fn());
  }

  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  renderer.setPixelRatio(isCoarsePointer ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const defaultSpherical = { radius: 4.9, theta: -0.36, phi: 1.15 };
  const spherical = { ...defaultSpherical };
  const targetSpherical = { ...defaultSpherical };
  let userThetaOffset = 0;
  let elapsedIdle = 0;
  let needsRender = true;
  let lastRenderMs = 0;
  const lookTarget = new THREE.Vector3(0, 0.06, 0);

  // Precision 5-Light Sunlit Kyoto/Scandinavian Studio Rig (zero PMREM cubemap convolution stall)
  const hemiLight = new THREE.HemisphereLight(0xfffdf9, 0xd8cbb8, 1.85);
  hemiLight.position.set(0, 8, 0);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xf6efe4, 0.72);
  scene.add(ambientLight);

  const sunKeyLight = new THREE.DirectionalLight(0xfff6e5, 2.65);
  sunKeyLight.position.set(4.5, 7.0, 5.5);
  scene.add(sunKeyLight);

  const alabasterFillLight = new THREE.DirectionalLight(0xf7efe2, 1.35);
  alabasterFillLight.position.set(-5.0, 3.5, 3.5);
  scene.add(alabasterFillLight);

  const brassRimLight = new THREE.DirectionalLight(0xffd89b, 1.75);
  brassRimLight.position.set(0.5, 4.0, -5.5);
  scene.add(brassRimLight);

  // Sunlit Travertine Counter Plinth & Vernier Calibration Ring
  const stageGroup = new THREE.Group();
  scene.add(stageGroup);

  const ringGroup = new THREE.Group();
  ringGroup.position.y = -1.16;
  stageGroup.add(ringGroup);

  // Warm soft contact shadow disc on counter surface
  const shadowGeo = new THREE.CircleGeometry(1.55, 64);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0xd8cbb8,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = -0.01;
  ringGroup.add(shadowDisc);

  const outerRingGeo = new THREE.RingGeometry(1.48, 1.505, 96);
  outerRingGeo.rotateX(-Math.PI / 2);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: 0x9e7123,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
  });
  ringGroup.add(new THREE.Mesh(outerRingGeo, outerRingMat));

  const innerRingGeo = new THREE.RingGeometry(1.06, 1.075, 72);
  innerRingGeo.rotateX(-Math.PI / 2);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0xc45a28,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  });
  ringGroup.add(new THREE.Mesh(innerRingGeo, innerRingMat));

  const tickPositions: number[] = [];
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const r1 = i % 3 === 0 ? 1.38 : 1.43;
    const r2 = 1.48;
    tickPositions.push(
      Math.cos(angle) * r1,
      0,
      Math.sin(angle) * r1,
      Math.cos(angle) * r2,
      0,
      Math.sin(angle) * r2
    );
  }
  const tickGeo = new THREE.BufferGeometry();
  tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPositions, 3));
  const tickMat = new THREE.LineBasicMaterial({
    color: 0x755b4b,
    transparent: true,
    opacity: 0.35,
  });
  ringGroup.add(new THREE.LineSegments(tickGeo, tickMat));

  const specimenHolder = new THREE.Group();
  stageGroup.add(specimenHolder);

  let activeParts = new Map<string, PartEntry>();
  let explodeState = { value: 0 };
  let isWireframe = false;
  let isolatedNodeName: string | null = null;
  let loadToken = 0;

  // DOM References
  const rootDoc = stageEl.closest('main') || document;
  const explodeSlider = stageEl.querySelector<HTMLInputElement>('[data-explode-range]');
  const explodeReadout = stageEl.querySelector<HTMLElement>('[data-explode-readout]');
  const travelReadout = stageEl.querySelector<HTMLElement>('[data-travel-readout]');
  const wireframeBtn = stageEl.querySelector<HTMLButtonElement>('[data-toggle-wireframe]');
  const resetCamBtn = stageEl.querySelector<HTMLButtonElement>('[data-reset-camera]');
  const specimenTabs = Array.from(rootDoc.querySelectorAll<HTMLElement>('[data-specimen-select]'));
  const externalLoadBtns = Array.from(document.querySelectorAll<HTMLElement>('[data-load-specimen]'));
  const originRecipeBtns = Array.from(document.querySelectorAll<HTMLElement>('[data-origin-recipe]'));

  const hudCode = stageEl.querySelector<HTMLElement>('[data-hud-code]');
  const hudTitle = stageEl.querySelector<HTMLElement>('[data-hud-title]');
  const hudSize = stageEl.querySelector<HTMLElement>('[data-hud-size]');
  const hudTris = stageEl.querySelector<HTMLElement>('[data-hud-tris]');
  const hudTol = stageEl.querySelector<HTMLElement>('[data-hud-tolerance]');
  const hudPartCode = stageEl.querySelector<HTMLElement>('[data-hud-part-code]');
  const hudPartLabel = stageEl.querySelector<HTMLElement>('[data-hud-part-label]');
  const hudPartMaterial = stageEl.querySelector<HTMLElement>('[data-hud-part-material]');
  const hudPartTolerance = stageEl.querySelector<HTMLElement>('[data-hud-part-tolerance]');
  const hudPartNote = stageEl.querySelector<HTMLElement>('[data-hud-part-note]');
  const dossierLink = stageEl.querySelector<HTMLAnchorElement>('[data-hud-dossier-link]');
  const partsListEl = rootDoc.querySelector<HTMLElement>('[data-parts-list]');

  // Hero Brew Telemetry Strip elements
  const brewTempEl = document.querySelector<HTMLElement>('[data-brew-temp]');
  const brewPressureEl = document.querySelector<HTMLElement>('[data-brew-pressure]');
  const brewExtEl = document.querySelector<HTMLElement>('[data-brew-ext]');
  const brewTdsEl = document.querySelector<HTMLElement>('[data-brew-tds]');
  const brewBadgeEl = document.querySelector<HTMLElement>('[data-brew-active-label]');

  const gltfLoader = new GLTFLoader();

  function loadGLB(url: string): Promise<THREE.Group> {
    if (modelCache.has(url)) {
      return Promise.resolve(modelCache.get(url)!.clone(true));
    }
    return new Promise((resolve, reject) => {
      gltfLoader.load(
        url,
        (gltf) => {
          modelCache.set(url, gltf.scene);
          resolve(gltf.scene.clone(true));
        },
        undefined,
        reject
      );
    });
  }

  function applyExplosionAndIsolation() {
    const t = explodeState.value;
    activeParts.forEach((entry, nodeName) => {
      entry.node.position.copy(entry.basePos).addScaledVector(entry.vector, t);
      const isSelected = isolatedNodeName === nodeName;
      const scaleMult = isSelected ? 1.045 : 1.0;
      entry.node.scale.copy(entry.baseScale).multiplyScalar(scaleMult);

      entry.meshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat) return;
        mat.wireframe = isWireframe;
        if (isolatedNodeName && !isSelected) {
          mat.transparent = true;
          mat.opacity = 0.28;
        } else {
          const origOpacity = (mat.userData?.origOpacity as number) ?? 1.0;
          mat.transparent = origOpacity < 0.99;
          mat.opacity = origOpacity;
        }
      });
    });

    if (explodeSlider) {
      explodeSlider.value = String(Math.round(t * 100));
    }
    if (explodeReadout) {
      explodeReadout.textContent = `${Math.round(t * 100)}%`;
    }
    if (travelReadout) {
      const mm = (t * currentProject.axialTravelMm).toFixed(1);
      travelReadout.textContent = `${mm} mm`;
    }
    const presetBtns = stageEl!.querySelectorAll<HTMLButtonElement>('[data-explode-preset]');
    presetBtns.forEach((btn) => {
      const targetVal = Number(btn.dataset.explodePreset || '0') / 100;
      const active = Math.abs(targetVal - t) < 0.04;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    needsRender = true;
  }

  function updateHeroBrewTelemetry(project: Project, customLabel?: string) {
    if (brewTempEl) brewTempEl.textContent = `${project.brewTelemetry.tempC.toFixed(1)}°C`;
    if (brewPressureEl) brewPressureEl.textContent = project.brewTelemetry.pressureBar;
    if (brewExtEl) brewExtEl.textContent = project.brewTelemetry.extractionPct;
    if (brewTdsEl) brewTdsEl.textContent = project.brewTelemetry.tdsPct;
    if (brewBadgeEl) {
      brewBadgeEl.textContent = customLabel || `${project.specimenCode} // ${project.shortTitle.toUpperCase()}`;
    }
  }

  function updatePartHUD(partNodeName: string | null) {
    const part =
      currentProject.parts.find((p) => p.nodeName === partNodeName) || currentProject.parts[0];
    if (!part) return;
    if (hudPartCode) hudPartCode.textContent = `PART ${part.index} // ${part.code}`;
    if (hudPartLabel) hudPartLabel.textContent = part.label;
    if (hudPartMaterial) hudPartMaterial.textContent = `${part.material} · ${part.finish}`;
    if (hudPartTolerance) hudPartTolerance.textContent = `${part.tolerance} · ${part.mass}`;
    if (hudPartNote) {
      hudPartNote.textContent = partNodeName
        ? part.note
        : 'Select any of the 5 sub-assemblies to isolate its 3D mesh and inspect machining tolerances.';
    }

    const rows = rootDoc.querySelectorAll<HTMLElement>('[data-part-item]');
    rows.forEach((row) => {
      const active = row.dataset.partItem === (partNodeName || '');
      row.classList.toggle('is-active', active);
      row.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function rebuildPartsDOM(project: Project) {
    if (!partsListEl) return;
    partsListEl.innerHTML = project.parts
      .map(
        (part) => `
        <button
          type="button"
          class="part-row"
          data-part-item="${part.nodeName}"
          aria-pressed="false"
        >
          <span class="part-row__idx">${part.index}</span>
          <span class="part-row__main">
            <span class="part-row__title">${part.label}</span>
            <span class="part-row__meta">${part.code} · ${part.material}</span>
          </span>
          <span class="part-row__tol">${part.mass}</span>
        </button>
      `
      )
      .join('');
    bindPartRowListeners();
  }

  function bindPartRowListeners() {
    const rows = rootDoc.querySelectorAll<HTMLElement>('[data-part-item]');
    rows.forEach((row) => {
      row.onclick = () => {
        const nodeName = row.dataset.partItem || null;
        if (isolatedNodeName === nodeName) {
          isolatedNodeName = null;
        } else {
          isolatedNodeName = nodeName;
          if (explodeState.value < 0.35) {
            gsap.to(explodeState, {
              value: 0.65,
              duration: prefersReducedMotion() ? 0 : 0.72,
              ease: 'expo.out',
              onUpdate: applyExplosionAndIsolation,
            });
          }
        }
        updatePartHUD(isolatedNodeName);
        applyExplosionAndIsolation();
      };
    });
  }

  async function mountSpecimen(slug: Project['slug'], animateTransition = true) {
    const project = projects.find((p) => p.slug === slug) || projects[0];
    currentProject = project;
    isolatedNodeName = null;
    const myToken = ++loadToken;

    specimenTabs.forEach((tab) => {
      const isCurrent = tab.dataset.specimenSelect === project.slug;
      tab.classList.toggle('is-active', isCurrent);
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    if (hudCode) hudCode.textContent = project.specimenCode;
    if (hudTitle) hudTitle.textContent = project.title;
    if (hudSize) hudSize.textContent = project.glbSize;
    if (hudTris) hudTris.textContent = project.triangleCount;
    if (hudTol) hudTol.textContent = project.datumTolerance;
    if (dossierLink) {
      dossierLink.href = `/work/${project.slug}`;
      dossierLink.textContent = `Inspect ${project.shortTitle} Dossier →`;
    }

    updateHeroBrewTelemetry(project);
    rebuildPartsDOM(project);
    updatePartHUD(null);

    const rawGroup = await loadGLB(project.modelUrl);
    if (myToken !== loadToken) return;

    while (specimenHolder.children.length > 0) {
      specimenHolder.remove(specimenHolder.children[0]);
    }
    activeParts.clear();

    // Normalize bounding box to fit sunlit stage cleanly
    const box = new THREE.Box3().setFromObject(rawGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetSize = 2.28;
    const normScale = targetSize / maxDim;

    rawGroup.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.scale.setScalar(normScale);
    wrapper.add(rawGroup);
    specimenHolder.add(wrapper);

    project.parts.forEach((partSpec) => {
      const obj = rawGroup.getObjectByName(partSpec.nodeName);
      if (!obj) return;
      const meshes: THREE.Mesh[] = [];
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (m.material) {
            const clonedMat = (m.material as THREE.MeshStandardMaterial).clone();
            clonedMat.userData = { origOpacity: clonedMat.opacity };
            if (typeof clonedMat.metalness === 'number') {
              clonedMat.metalness = Math.min(clonedMat.metalness, 0.54);
            }
            if (typeof clonedMat.roughness === 'number') {
              clonedMat.roughness = Math.max(clonedMat.roughness, 0.24);
            }
            m.material = clonedMat;
          }
          meshes.push(m);
        }
      });

      activeParts.set(partSpec.nodeName, {
        node: obj,
        basePos: obj.position.clone(),
        baseScale: obj.scale.clone(),
        vector: new THREE.Vector3(...partSpec.vector),
        meshes,
      });
    });

    if (animateTransition && !prefersReducedMotion()) {
      gsap.fromTo(
        specimenHolder.rotation,
        { y: specimenHolder.rotation.y - 0.45 },
        {
          y: specimenHolder.rotation.y,
          duration: 0.85,
          ease: 'expo.out',
          onUpdate: () => {
            needsRender = true;
          },
        }
      );
      gsap.to(explodeState, {
        value: 0.25,
        duration: 0.65,
        ease: 'expo.out',
        onUpdate: applyExplosionAndIsolation,
      });
    } else {
      applyExplosionAndIsolation();
    }
    needsRender = true;
  }

  // Expose initial model ready promise for loader synchronization
  const initialPromise = mountSpecimen(initialSlug, false);
  (window as any).__benchInitialModelReady = initialPromise;

  // Bind Specimen Switcher Tabs
  specimenTabs.forEach((tab) => {
    const onClick = () => {
      const slug = tab.dataset.specimenSelect as Project['slug'];
      if (slug && slug !== currentProject.slug) {
        mountSpecimen(slug, true);
      }
    };
    tab.addEventListener('click', onClick);
    cleanups.push(() => tab.removeEventListener('click', onClick));
  });

  // Bind External Load Vessel Buttons (in Section 04 Equipment Matrix)
  externalLoadBtns.forEach((btn) => {
    const onClick = () => {
      const slug = btn.dataset.loadSpecimen as Project['slug'];
      if (slug) {
        mountSpecimen(slug, true);
        stageEl.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
      }
    };
    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  });

  // Bind Single-Origin Recipe Sync Buttons (in Section 02 Origin Lots)
  originRecipeBtns.forEach((btn) => {
    const onClick = () => {
      const slug = (btn.dataset.originSpecimen as Project['slug']) || 'pourover-v60';
      const temp = btn.dataset.originTemp || '93.5°C';
      const pressure = btn.dataset.originPressure || '9.0 BAR';
      const ext = btn.dataset.originExt || '21.4%';
      const tds = btn.dataset.originTds || '1.42%';
      const title = btn.dataset.originTitle || 'LOT 01 // GEDEB';

      mountSpecimen(slug, true).then(() => {
        if (brewTempEl) brewTempEl.textContent = temp;
        if (brewPressureEl) brewPressureEl.textContent = pressure;
        if (brewExtEl) brewExtEl.textContent = ext;
        if (brewTdsEl) brewTdsEl.textContent = tds;
        if (brewBadgeEl) brewBadgeEl.textContent = `RECIPE LOADED // ${title}`;
      });

      originRecipeBtns.forEach((b) => b.classList.remove('is-loaded'));
      btn.classList.add('is-loaded');
      stageEl.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    };
    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  });

  // Bind Explode Slider
  if (explodeSlider) {
    const onInput = () => {
      const nextVal = Math.max(0, Math.min(1, Number(explodeSlider.value) / 100));
      gsap.to(explodeState, {
        value: nextVal,
        duration: prefersReducedMotion() ? 0 : 0.22,
        ease: 'power3.out',
        onUpdate: applyExplosionAndIsolation,
      });
    };
    explodeSlider.addEventListener('input', onInput);
    cleanups.push(() => explodeSlider.removeEventListener('input', onInput));
  }

  // Bind Explode Preset Detent Buttons (0%, 50%, 100%)
  const presetBtns = Array.from(stageEl.querySelectorAll<HTMLButtonElement>('[data-explode-preset]'));
  presetBtns.forEach((btn) => {
    const onClick = () => {
      const targetVal = Math.max(0, Math.min(1, Number(btn.dataset.explodePreset || '0') / 100));
      gsap.to(explodeState, {
        value: targetVal,
        duration: prefersReducedMotion() ? 0 : 0.72,
        ease: 'expo.out',
        onUpdate: applyExplosionAndIsolation,
      });
    };
    btn.addEventListener('click', onClick);
    cleanups.push(() => btn.removeEventListener('click', onClick));
  });

  // Bind Wireframe Toggle
  if (wireframeBtn) {
    const onWire = () => {
      isWireframe = !isWireframe;
      wireframeBtn.classList.toggle('is-active', isWireframe);
      wireframeBtn.setAttribute('aria-pressed', isWireframe ? 'true' : 'false');
      applyExplosionAndIsolation();
    };
    wireframeBtn.addEventListener('click', onWire);
    cleanups.push(() => wireframeBtn.removeEventListener('click', onWire));
  }

  // Bind Reset Camera + Reassemble
  if (resetCamBtn) {
    const onReset = () => {
      userThetaOffset = 0;
      targetSpherical.radius = defaultSpherical.radius;
      targetSpherical.theta = defaultSpherical.theta;
      targetSpherical.phi = defaultSpherical.phi;
      isolatedNodeName = null;
      updatePartHUD(null);
      gsap.to(explodeState, {
        value: 0,
        duration: prefersReducedMotion() ? 0 : 0.72,
        ease: 'expo.out',
        onUpdate: applyExplosionAndIsolation,
      });
    };
    resetCamBtn.addEventListener('click', onReset);
    cleanups.push(() => resetCamBtn.removeEventListener('click', onReset));
  }

  // Pointer Orbit Drag & Raycast Sub-Assembly Click
  let isDragging = false;
  let downX = 0;
  let downY = 0;
  let prevX = 0;
  let prevY = 0;
  const raycaster = new THREE.Raycaster();
  const pointerNDC = new THREE.Vector2();

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    downX = prevX = e.clientX;
    downY = prevY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    userThetaOffset -= dx * 0.0075;
    targetSpherical.theta = defaultSpherical.theta + userThetaOffset;
    targetSpherical.phi = Math.max(0.42, Math.min(1.62, targetSpherical.phi - dy * 0.0065));
    needsRender = true;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}

    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (moved < 6) {
      const rect = canvas.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);

      const allMeshes: THREE.Mesh[] = [];
      activeParts.forEach((entry) => allMeshes.push(...entry.meshes));
      const hits = raycaster.intersectObjects(allMeshes, false);
      if (hits.length > 0) {
        let hitObj: THREE.Object3D | null = hits[0].object;
        let foundName: string | null = null;
        while (hitObj) {
          if (activeParts.has(hitObj.name)) {
            foundName = hitObj.name;
            break;
          }
          hitObj = hitObj.parent;
        }
        if (foundName) {
          isolatedNodeName = isolatedNodeName === foundName ? null : foundName;
          updatePartHUD(isolatedNodeName);
          applyExplosionAndIsolation();
        }
      }
    }
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  cleanups.push(() => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  });

  // ResizeObserver for crisp high-DPI viewport sizing
  const updateSize = () => {
    const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsRender = true;
  };
  updateSize();
  const ro = new ResizeObserver(updateSize);
  ro.observe(canvas.parentElement || canvas);
  cleanups.push(() => ro.disconnect());

  // Pause rendering when scrolled offscreen or during active scroll
  let isVisible = true;
  let lastScrollY = window.scrollY;
  let scrollingUntil = 0;
  const onWindowScroll = () => {
    const y = window.scrollY;
    if (Math.abs(y - lastScrollY) > 2) {
      scrollingUntil = performance.now() + 180;
    }
    lastScrollY = y;
  };
  window.addEventListener('scroll', onWindowScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onWindowScroll));

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      isVisible = entry ? entry.isIntersecting && entry.intersectionRatio >= 0.05 : true;
      if (isVisible) needsRender = true;
    },
    { threshold: [0, 0.05, 0.25] }
  );
  io.observe(canvas);
  cleanups.push(() => io.disconnect());

  // Single-Clock GSAP Ticker Loop (software-GPU friendly cadence)
  const tick = (_time: number, deltaMs: number) => {
    if (!isVisible) return;
    const now = performance.now();
    const activelyScrolling = now < scrollingUntil;

    if ((isCoarsePointer || prefersReducedMotion()) && !needsRender) return;
    if (!needsRender && !isDragging && (activelyScrolling || now - lastRenderMs < 380)) return;

    const dt = Math.min(deltaMs / 1000, 0.05);

    if (!isDragging && !prefersReducedMotion() && !isCoarsePointer) {
      elapsedIdle += 0.38;
      targetSpherical.theta =
        defaultSpherical.theta + userThetaOffset + Math.sin(elapsedIdle * 1.35) * 0.022;
      ringGroup.rotation.y -= 0.014;
    }

    const damp = prefersReducedMotion() || isCoarsePointer ? 1 : 0.42;
    spherical.radius += (targetSpherical.radius - spherical.radius) * damp;
    spherical.theta += (targetSpherical.theta - spherical.theta) * damp;
    spherical.phi += (targetSpherical.phi - spherical.phi) * damp;

    const sinPhi = Math.sin(spherical.phi);
    camera.position.set(
      spherical.radius * sinPhi * Math.sin(spherical.theta),
      spherical.radius * Math.cos(spherical.phi),
      spherical.radius * sinPhi * Math.cos(spherical.theta)
    );
    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
    lastRenderMs = now;
    needsRender = false;
  };

  gsap.ticker.add(tick);
  cleanups.push(() => {
    gsap.ticker.remove(tick);
    renderer.dispose();
  });

  return () => cleanups.forEach((fn) => fn());
}

function mountRoastCurveInteractive(): () => void {
  const root = document.querySelector<HTMLElement>('[data-roast-lab]');
  if (!root) return () => {};

  const phaseBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-roast-phase]'));
  const svgNodes = Array.from(root.querySelectorAll<SVGGElement>('[data-roast-svg-node]'));
  const cursorLine = root.querySelector<SVGLineElement>('[data-roast-cursor-line]');

  const phaseStepEl = root.querySelector<HTMLElement>('[data-phase-step]');
  const phaseNameEl = root.querySelector<HTMLElement>('[data-phase-name]');
  const phaseTimeEl = root.querySelector<HTMLElement>('[data-phase-time]');
  const phaseTempEl = root.querySelector<HTMLElement>('[data-phase-temp]');
  const phaseRorEl = root.querySelector<HTMLElement>('[data-phase-ror]');
  const phaseBurnerEl = root.querySelector<HTMLElement>('[data-phase-burner]');
  const phaseAgtronEl = root.querySelector<HTMLElement>('[data-phase-agtron]');
  const phaseSummaryEl = root.querySelector<HTMLElement>('[data-phase-summary]');
  const phaseSpecsEl = root.querySelector<HTMLElement>('[data-phase-specs]');

  const selectPhase = (id: string) => {
    const phase = roastCurvePhases.find((p) => p.id === id) || roastCurvePhases[3];
    if (!phase) return;

    phaseBtns.forEach((btn) => {
      const active = btn.dataset.roastPhase === phase.id;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    svgNodes.forEach((node) => {
      const active = node.dataset.roastSvgNode === phase.id;
      node.classList.toggle('is-active', active);
    });

    if (cursorLine) {
      cursorLine.setAttribute('x1', String(phase.svgX));
      cursorLine.setAttribute('x2', String(phase.svgX));
    }

    if (phaseStepEl) phaseStepEl.textContent = `${phase.step} // ${phase.timestamp}`;
    if (phaseNameEl) phaseNameEl.textContent = phase.name;
    if (phaseTimeEl) phaseTimeEl.textContent = phase.timestamp;
    if (phaseTempEl) phaseTempEl.textContent = phase.beanTempC;
    if (phaseRorEl) phaseRorEl.textContent = phase.rorCMin;
    if (phaseBurnerEl) phaseBurnerEl.textContent = phase.burnerKpa;
    if (phaseAgtronEl) phaseAgtronEl.textContent = phase.agtronTarget;
    if (phaseSummaryEl) phaseSummaryEl.textContent = phase.summary;
    if (phaseSpecsEl) {
      phaseSpecsEl.innerHTML = phase.specs.map((s) => `<li>${s}</li>`).join('');
    }
  };

  phaseBtns.forEach((btn) => {
    btn.onclick = () => selectPhase(btn.dataset.roastPhase || '04');
  });
  svgNodes.forEach((node) => {
    node.onclick = () => selectPhase(node.dataset.roastSvgNode || '04');
  });

  return () => {
    phaseBtns.forEach((btn) => (btn.onclick = null));
    svgNodes.forEach((node) => (node.onclick = null));
  };
}

function mountBrewCalculatorInteractive(): () => void {
  const calc = document.querySelector<HTMLElement>('[data-brew-calc]');
  if (!calc) return () => {};

  const modeBtns = Array.from(calc.querySelectorAll<HTMLButtonElement>('[data-brew-mode]'));
  const doseInput = calc.querySelector<HTMLInputElement>('[data-brew-dose-input]');
  const doseOut = calc.querySelector<HTMLElement>('[data-calc-dose]');
  const yieldOut = calc.querySelector<HTMLElement>('[data-calc-yield]');
  const bloomOut = calc.querySelector<HTMLElement>('[data-calc-bloom]');
  const ratioOut = calc.querySelector<HTMLElement>('[data-calc-ratio]');
  const tempOut = calc.querySelector<HTMLElement>('[data-calc-temp]');
  const grindOut = calc.querySelector<HTMLElement>('[data-calc-grind]');
  const timeOut = calc.querySelector<HTMLElement>('[data-calc-time]');
  const tdsOut = calc.querySelector<HTMLElement>('[data-calc-tds]');

  let currentMode: 'pourover' | 'espresso' = 'pourover';

  const recompute = () => {
    const dose = Number(doseInput?.value || 15);
    if (doseOut) doseOut.textContent = `${dose.toFixed(1)} g`;

    if (currentMode === 'pourover') {
      const ratio = 16.5;
      const totalWater = Math.round(dose * ratio);
      const bloom = Math.round(dose * 3.0);
      const grind = Math.round(590 + (dose - 14) * 8);
      if (yieldOut) yieldOut.textContent = `${totalWater} g`;
      if (bloomOut) bloomOut.textContent = `${bloom} g (40s Bloom)`;
      if (ratioOut) ratioOut.textContent = '1 : 16.5';
      if (tempOut) tempOut.textContent = '93.5°C (200.3°F)';
      if (grindOut) grindOut.textContent = `${grind} µm (EK43 #8.4)`;
      if (timeOut) timeOut.textContent = '02m 32s Drawdown';
      if (tdsOut) tdsOut.textContent = '1.42% TDS · 21.4% EXT';
    } else {
      const ratio = 2.1;
      const liquidYield = (dose * ratio).toFixed(1);
      const preinfusion = (dose * 0.85).toFixed(1);
      const grind = Math.round(255 + (dose - 16) * 3);
      if (yieldOut) yieldOut.textContent = `${liquidYield} g`;
      if (bloomOut) bloomOut.textContent = `${preinfusion} g (7s @ 2.0 BAR)`;
      if (ratioOut) ratioOut.textContent = '1 : 2.1';
      if (tempOut) tempOut.textContent = '93.5°C Saturated Bell';
      if (grindOut) grindOut.textContent = `${grind} µm (EK43 #2.1)`;
      if (timeOut) timeOut.textContent = '31s Declining Lever';
      if (tdsOut) tdsOut.textContent = '9.84% TDS · 21.6% EXT';
    }
  };

  modeBtns.forEach((btn) => {
    btn.onclick = () => {
      currentMode = (btn.dataset.brewMode as 'pourover' | 'espresso') || 'pourover';
      modeBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (doseInput) {
        doseInput.value = currentMode === 'pourover' ? '15.0' : '18.0';
      }
      recompute();
    };
  });

  if (doseInput) {
    doseInput.oninput = recompute;
  }

  recompute();

  return () => {
    modeBtns.forEach((b) => (b.onclick = null));
    if (doseInput) doseInput.oninput = null;
  };
}
