// Assumptions:
// 1. Subject name (Soren Lindqvist), studio URL (https://lindqvist.studio), Stockholm workshop address,
//    and contact email (soren@lindqvist.studio) are authored for this portfolio concept.
// 2. Client commissions (Kestrel Audio Lab, Verge Photonics AB, Aether Inertial Systems) are clearly
//    marked with `placeholder: true` as representative industrial design + WebGL twin case studies
//    for the studio owner to replace with NDA-cleared client names.
// 3. The 3 multi-part .glb 3D models in /public/models/ were procedurally generated in Blender 4.2
//    with 5 named sub-assemblies (`part_01_chassis` .. `part_05_bayonet_mount`) specifically for this site.

export type SubAssemblyPart = {
  nodeName:
    | 'part_01_chassis'
    | 'part_02_capsule_guard'
    | 'part_03_transducer_core'
    | 'part_04_rotary_gain'
    | 'part_05_bayonet_mount';
  index: string;
  code: string;
  label: string;
  material: string;
  finish: string;
  tolerance: string;
  mass: string;
  vector: [number, number, number]; // Three.js Y-up explosion vector
  note: string;
};

export type CraftPlate = {
  index: string;
  title: string;
  metric: string;
  caption: string;
  diagramType: 'axial' | 'optical' | 'kinematic';
};

export type Project = {
  slug: string;
  specimenCode: string;
  title: string;
  shortTitle: string;
  client: string;
  sector: string;
  year: number;
  role: string[];
  modelUrl: string;
  glbSize: string;
  triangleCount: string;
  datumTolerance: string;
   axialTravelMm: number;
  summary: string;
  heroCaption: string;
  context: string[];
  decision: string[];
  outcome: string[];
  deliverables: string[];
  parts: SubAssemblyPart[];
  craftPlates: CraftPlate[];
  placeholder: boolean;
};

export type PipelineStage = {
  step: string;
  code: string;
  title: string;
  metric: string;
  summary: string;
  deliverable: string;
  specs: string[];
};

export type EngagementModel = {
  code: string;
  title: string;
  duration: string;
  deliverable: string;
  summary: string;
  includes: string[];
};

export const site = {
  name: 'Soren Lindqvist',
  studioCode: 'LINDQVIST // CMM-04',
  role: '3D Industrial Designer & Real-Time Graphics Engineer',
  url: 'https://lindqvist.studio',
  description:
    'Stockholm industrial design and real-time WebGL studio by Soren Lindqvist. Machined hardware enclosures and sub-300 KB 3D assembly twins.',
  location: 'Katarinavägen 18, Södermalm, Stockholm',
  coordinates: '59.3172° N, 18.0749° E',
  email: 'soren@lindqvist.studio',
  ctaLabel: 'Book a 20-min CAD review',
  availability: 'Q3/Q4 2026 bench window open (2 slots)',
  heroLead:
    'I design CNC-machined hardware enclosures and build interactive, sub-300 KB 3D browser twins for acoustic, photonics, and robotics teams.',
  heroSub:
    'Ship production-ready 5-axis STEP tooling and a 60 fps exploded-view web stage from one master CAD assembly. 3 weeks from existing STEP files, or 6 weeks from blank-sheet enclosure design.',
  socials: [
    { label: 'GitHub', href: 'https://github.com/sorenlindqvist-studio' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/sorenlindqvist' },
    { label: 'X / Twitter', href: 'https://x.com/sorenlindqvist' },
  ],
  benchMetrics: [
    {
      value: '±0.004 mm',
      label: 'CAD-to-browser accuracy',
      detail: 'Browser mesh vertices match the master manufacturing STEP assembly within four microns.',
    },
    {
      value: '109 to 287 KB',
      label: 'Total 3D file size',
      detail: 'Smaller than a single hero JPEG. Loads in under a second on conference Wi-Fi with zero 4K texture bloat.',
    },
    {
      value: '60 fps',
      label: 'Mobile & tablet frame rate',
      detail: 'Scroll, BOM readouts, and 3D rendering share one frame loop and automatically pause off-screen.',
    },
    {
      value: '3 to 6 Wks',
      label: 'Fixed-milestone delivery',
      detail: '3 weeks to compile an interactive twin from frozen STEP files; 6 weeks for full enclosure CAD and launch site.',
    },
  ],
};

export const projects: Project[] = [
  {
    slug: 'kestrel-01',
    specimenCode: 'SPECIMEN 01 // ACOUSTICS',
    title: 'Kestrel-01 Coaxial Field Recorder',
    shortTitle: 'Kestrel-01 Recorder',
    client: 'Kestrel Audio Lab (Stockholm)',
    sector: 'Electro-Acoustic Hardware',
    year: 2026,
    role: ['Mechanical Enclosure CAD', 'Acoustic Cage DFM', 'Real-Time WebGL Twin'],
    modelUrl: '/models/kestrel-recorder.glb',
    glbSize: '287 KB',
    triangleCount: '14,820 tris',
    datumTolerance: '±0.004 mm',
    axialTravelMm: 84.0,
    summary:
      'Anodized 7075-T6 aluminum field recorder housing and interactive 5-part exploded WebGL manual for pre-order acoustic engineers.',
    heroCaption:
      'Five coaxial sub-assemblies separated along the Z-inspection rail, exposing the C36000 brass pressure-gradient condenser capsule inside its wire-EDM titanium cage.',
    context: [
      'Kestrel Audio Lab needed a flagship handheld field recorder capable of surviving sub-arctic location work while keeping acoustic self-noise below 9 dBA. Their existing cast-zinc prototype suffered from handle resonance and weighed 610 grams.',
      'Alongside the physical tooling package, Kestrel needed an interactive browser inspection bench so studio recording engineers could verify capsule suspension geometry, rotary vernier detents, and XLR pinout servicing before placing pre-orders.',
    ],
    decision: [
      'I replaced the two-piece cast shell with an octagonal 7075-T6 billet chassis milled in a single fixture setup, flanked by damped titanium side rails. A four-ring Ti-6Al-4V acoustic guard isolates the internal brass condenser dome from wind turbulence without coloring off-axis frequencies above 14 kHz.',
      'Rather than rendering static turntable videos that hide internal tolerances, I exported the master CAD assembly directly into a 287 KB five-node GLB asset. Visitors drag or scroll the axial vernier to separate the cage, capsule, gain dial, and bayonet collar in real time.',
    ],
    outcome: [
      'Total instrument mass dropped from 610 g to 324 g while passing 1.8-meter drop validation onto concrete. First-batch machining tolerances held within ±0.004 mm across 250 serialized units.',
      'The embedded WebGL inspection stage helped Kestrel close all 250 serialized pre-orders six weeks ahead of CNC tooling completion and cut technical pre-sales engineering inquiries by half.',
    ],
    deliverables: [
      '5-axis CNC STEP & IGES production tooling package',
      '287 KB multi-part PBR GLB assembly (5 named kinematic nodes)',
      'Single-clock Three.js + GSAP axial explosion configurator',
      'Orthographic SVG service schematics for reduced-motion documentation',
    ],
    parts: [
      {
        nodeName: 'part_01_chassis',
        index: '01',
        code: 'K01-CHS-7075',
        label: 'Octagonal Billet Chassis',
        material: '7075-T6 Aluminum & Titanium Rails',
        finish: 'Type III Hard Anodized Obsidian (45 μm)',
        tolerance: '±0.004 mm',
        mass: '142 g',
        vector: [0, -0.16, 0],
        note: 'Chamfered eight-sided core housing with twin damped titanium grip rails.',
      },
      {
        nodeName: 'part_02_capsule_guard',
        index: '02',
        code: 'K01-CAG-TI64',
        label: 'Coaxial Titanium Acoustic Cage',
        material: 'Ti-6Al-4V Grade 5 Titanium',
        finish: 'Glass-Bead Matte Passivation',
        tolerance: '±0.003 mm',
        mass: '38 g',
        vector: [0, 0.92, 0],
        note: 'Four stepped torus rings and six axial struts tuned for zero standing-wave reflection.',
      },
      {
        nodeName: 'part_03_transducer_core',
        index: '03',
        code: 'K01-CAP-BR360',
        label: 'Pressure-Gradient Condenser Core',
        material: 'C36000 Free-Machining Brass & Copper',
        finish: 'Unlacquered Lapped Acoustic Face',
        tolerance: '±0.002 mm',
        mass: '64 g',
        vector: [0, 0.46, 0],
        note: 'Gold-sputtered diaphragm carrier with hemispherical coil-copper phase dome.',
      },
      {
        nodeName: 'part_04_rotary_gain',
        index: '04',
        code: 'K01-GAN-316L',
        label: 'Stepped Vernier Rotary Gain Dial',
        material: '316L Stainless Steel & Cerakote Pin',
        finish: 'Radial Brushed + Signal Vermilion Index',
        tolerance: '±0.005 mm',
        mass: '29 g',
        vector: [0, 0.06, 0.78],
        note: '24-detent ball-bearing attenuator with +2 dB mechanical steps and tactile zero lock.',
      },
      {
        nodeName: 'part_05_bayonet_mount',
        index: '05',
        code: 'K01-BAY-XLR3',
        label: 'Quarter-Turn XLR Bayonet Collar',
        material: 'Ti-6Al-4V Collar & C36000 Contact Pins',
        finish: 'Brushed Titanium + Vermilion Seal Ring',
        tolerance: '±0.004 mm',
        mass: '51 g',
        vector: [0, -0.86, 0],
        note: 'Hermetic rear locking collar with three solid-brass balanced phantom power pins.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 01.A',
        title: 'Acoustic Cage Diffraction Geometry',
        metric: '0.88 Open Aperture Ratio',
        caption:
          'Stepped ring radii (60 mm tapering to 49.5 mm) disperse axial plosives while keeping polar response linear within ±0.4 dB.',
        diagramType: 'axial',
      },
      {
        index: 'FIG 01.B',
        title: 'Vernier Gain Detent Cam Profile',
        metric: '24 Detents @ 15° Pitch',
        caption:
          'Spring-loaded ceramic plunger locks into CNC-broached internal flutes so gain changes can be counted by touch in dark field conditions.',
        diagramType: 'kinematic',
      },
      {
        index: 'FIG 01.C',
        title: 'Sub-300 KB GLB Mesh Budget',
        metric: '287 KB Total Payload',
        caption:
          'Hard-angle bevel modifiers baked at 32-degree thresholds preserve crisp specular highlights on anodized chamfers without normal maps.',
        diagramType: 'optical',
      },
    ],
    placeholder: true,
  },
  {
    slug: 'verge-m2',
    specimenCode: 'SPECIMEN 02 // PHOTONICS',
    title: 'Verge-M2 Optical Monochromator',
    shortTitle: 'Verge-M2 Monochromator',
    client: 'Verge Photonics AB (Uppsala)',
    sector: 'Spectroscopy & Optical Bench',
    year: 2025,
    role: ['Optomechanical Architecture', 'Kinematic Base DFM', 'WebGL Wavelength Simulator'],
    modelUrl: '/models/verge-monochromator.glb',
    glbSize: '109 KB',
    triangleCount: '7,640 tris',
    datumTolerance: '±0.002 mm',
    axialTravelMm: 62.5,
    summary:
      'Six-position diffraction grating turret with a kinematic alumina baseplate and an interactive 109 KB browser assembly twin.',
    heroCaption:
      'Orthogonal 3-axis explosion separating the top titanium grating wheel, front steel collimator barrel, right brass micrometer drum, and bottom ceramic kinematic base.',
    context: [
      'Verge Photonics builds compact Czerny-Turner monochromators for Raman spectroscopy benches. Laboratory researchers needed to swap six diffraction gratings without breaking optical alignment or re-collimating the input fiber.',
      'Their sales engineers also lacked a portable way to demonstrate the three-point kinematic baseplate and micrometer drive at international photonics conferences when $18,000 physical demo units were locked in cleanrooms.',
    ],
    decision: [
      'I housed the optical path inside a stress-relieved octagonal block and mounted the six grating cells on a top-loading titanium carousel. A lateral C36000 brass micrometer drum drives the sine-bar linkage with zero backlash, while an alumina ceramic baseplate seats onto three hardened steel balls.',
      'For the digital twin, I modeled all five sub-assemblies with multi-axis explosion vectors (+Y carousel, +Z collimator barrel, +X micrometer drum, -Y ceramic plate) inside a 109 KB GLB file that parses in under a second over conference Wi-Fi.',
    ],
    outcome: [
      'Grating swap repeatability improved to ±0.04 nm across 10,000 indexing cycles without optical recalibration.',
      'The 109 KB WebGL turret stage enabled live iPad trade-show demos at Photonics West without shipping $18,000 cleanroom units, and now serves as the lab integration specification sheet.',
    ],
    deliverables: [
      'Optomechanical CAD assembly & thermal expansion analysis',
      '109 KB multi-axis PBR GLB model with 5 kinematic nodes',
      'Interactive multi-vector explosion & wireframe inspection view',
      'Cleanroom installation & datum alignment schematics',
    ],
    parts: [
      {
        nodeName: 'part_01_chassis',
        index: '01',
        code: 'VM2-BLK-6082',
        label: '6082-T651 Optical Block',
        material: 'Stress-Relieved 6082-T651 Aluminum',
        finish: 'Optical Matte Black Anodize (Low-Reflectance)',
        tolerance: '±0.002 mm',
        mass: '310 g',
        vector: [0, 0, 0],
        note: 'Light-tight internal baffle cavity with precision-bored orthogonal optical ports.',
      },
      {
        nodeName: 'part_02_capsule_guard',
        index: '02',
        code: 'VM2-TUR-TI64',
        label: 'Ti-64 Grating Carousel',
        material: 'Ti-6Al-4V Carousel & Brass Master Cell',
        finish: 'Lapped Datum Face + Numbered Grating Pockets',
        tolerance: '±0.002 mm',
        mass: '94 g',
        vector: [0, 0.88, 0],
        note: 'Holds six 12.7 mm holographically etched gratings with brass index reference cell at 0°.',
      },
      {
        nodeName: 'part_03_transducer_core',
        index: '03',
        code: 'VM2-COL-316L',
        label: '316L Collimator Barrel',
        material: '316L Stainless Steel & Vermilion Retainer',
        finish: 'Diamond-Turned Bore + Signal Vermilion Ring',
        tolerance: '±0.003 mm',
        mass: '118 g',
        vector: [0, 0, 0.84],
        note: 'Front entrance aperture housing fused-silica doublet optics and stray-light knife edge.',
      },
      {
        nodeName: 'part_04_rotary_gain',
        index: '04',
        code: 'VM2-DRM-BR360',
        label: 'Brass Micrometer Drum',
        material: 'C36000 Naval Brass',
        finish: 'Precision Turned & Laser-Graduated Scale',
        tolerance: '±0.002 mm',
        mass: '76 g',
        vector: [0.88, 0.08, 0],
        note: '0.25 mm pitch leadscrew translating rotary divisions directly into nanometer wavelength steps.',
      },
      {
        nodeName: 'part_05_bayonet_mount',
        index: '05',
        code: 'VM2-KIN-AL2O3',
        label: 'Alumina Kinematic Base',
        material: '99.6% Alumina Technical Ceramic',
        finish: 'Diamond-Ground Kelvin Clamp V-Grooves',
        tolerance: '±0.001 mm',
        mass: '145 g',
        vector: [0, -0.82, 0],
        note: 'Thermally stable ceramic mounting foot with sub-micron return-to-zero repeatability.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 02.A',
        title: 'Kelvin Kinematic Coupling Foot',
        metric: '±0.8 μm Repeatability',
        caption:
          'Three radial carbide V-grooves on the alumina baseplate constrain all six degrees of freedom without inducing clamping stress into the optical block.',
        diagramType: 'kinematic',
      },
      {
        index: 'FIG 02.B',
        title: 'Six-Position Grating Turret Indexing',
        metric: '60.00° Angular Pitch',
        caption:
          'The C36000 brass master cell marks the 0-degree home wavelength while five steel cells carry ruled gratings from 300 to 2400 grooves/mm.',
        diagramType: 'optical',
      },
      {
        index: 'FIG 02.C',
        title: 'Orthogonal Multi-Axis Explosion',
        metric: '109 KB GLB / 7,640 Tris',
        caption:
          'Unlike single-axis stack explosions, Verge-M2 separates along X, Y, and Z vectors simultaneously to mirror real bench disassembly order.',
        diagramType: 'axial',
      },
    ],
    placeholder: true,
  },
  {
    slug: 'aether-g9',
    specimenCode: 'SPECIMEN 03 // INERTIAL',
    title: 'Aether-G9 Gyroscopic Sensor Head',
    shortTitle: 'Aether-G9 Sensor Gimbal',
    client: 'Aether Inertial Systems (Gothenburg)',
    sector: 'Autonomous Marine & Aerospace Robotics',
    year: 2025,
    role: ['Concentric Gimbal CAD', 'Dynamic Mass Balancing', 'Real-Time Telemetry Stage'],
    modelUrl: '/models/aether-gimbal.glb',
    glbSize: '153 KB',
    triangleCount: '11,240 tris',
    datumTolerance: '±0.003 mm',
    axialTravelMm: 76.0,
    summary:
      'Three-axis concentric gimbal assembly with an inertial brass core sphere and 153 KB interactive kinematic web twin.',
    heroCaption:
      'Concentric yaw, pitch, and roll rings separating radially around the high-density C36000 brass inertial reference sphere and 316L stator pedestal.',
    context: [
      'Aether Inertial Systems builds stabilized optical and radar payloads for North Sea autonomous surface vessels. Gimbal lock and cable harness torque in their previous two-axis bracket caused horizon drift during violent wave slam events.',
      'Their naval robotics customers needed an interactive 3D clearance model to verify mast sweep envelopes and slip-ring routing without Aether exposing proprietary internal SolidWorks assemblies.',
    ],
    decision: [
      'I engineered a continuous 360-degree three-axis concentric torus architecture: a hard-anodized outer yaw yoke, a 5-axis milled titanium pitch ring, and a Signal Vermilion roll calibration ring surrounding a dynamically balanced brass inertial sphere.',
      'In the browser twin, scrolling or scrubbing the axial control separates the nested rings along diagonal clearance vectors so mechanical engineers can inspect bearing seats and stator slip-ring geometry without downloading CAD viewer software.',
    ],
    outcome: [
      'Horizon stabilization held within 0.015 milliradians under 6G wave-slam vibration testing in the Gothenburg marine basin.',
      'The 153 KB WebGL gimbal twin allowed 14 naval robotics teams to verify mast clearances directly in the browser without exposing proprietary SolidWorks internals.',
    ],
    deliverables: [
      '3-axis concentric gimbal CAD & finite-element modal analysis',
      '153 KB PBR GLB model with radial clearance explosion vectors',
      'Interactive browser gimbal stage with CAD wireframe overlay',
      'Slip-ring pedestal bolt-circle & envelope drawings',
    ],
    parts: [
      {
        nodeName: 'part_01_chassis',
        index: '01',
        code: 'AG9-YAW-7075',
        label: '7075-T6 Outer Yaw Yoke',
        material: '7075-T6 Forged & Turned Aluminum Ring',
        finish: 'Hard-Coat Anodized Obsidian',
        tolerance: '±0.003 mm',
        mass: '112 g',
        vector: [0, 0.42, -0.52],
        note: 'Primary structural ring housing twin angular-contact ceramic duplex bearings.',
      },
      {
        nodeName: 'part_02_capsule_guard',
        index: '02',
        code: 'AG9-PTC-TI64',
        label: 'Ti-64 Pitch Gimbal Ring',
        material: 'Ti-6Al-4V Grade 5 Titanium',
        finish: 'Brushed Natural Titanium',
        tolerance: '±0.003 mm',
        mass: '68 g',
        vector: [-0.62, 0.52, 0.28],
        note: 'Low-inertia intermediate gimbal ring canted at 55° for unobstructed sensor field of regard.',
      },
      {
        nodeName: 'part_03_transducer_core',
        index: '03',
        code: 'AG9-COR-BR360',
        label: 'Brass Inertial Sphere',
        material: 'High-Density C36000 Brass Alloy',
        finish: 'Geodesic Faceted & Dynamically Balanced',
        tolerance: '±0.001 mm',
        mass: '184 g',
        vector: [0, 0.22, 0],
        note: 'Central proof-mass sphere containing fiber-optic gyro coils and MEMS accelerometers.',
      },
      {
        nodeName: 'part_04_rotary_gain',
        index: '04',
        code: 'AG9-ROL-VERM',
        label: 'Roll Calibration Ring',
        material: '6061-T6 Aluminum + Signal Vermilion',
        finish: 'High-Visibility Optical Calibration Coating',
        tolerance: '±0.002 mm',
        mass: '42 g',
        vector: [0.64, 0.28, 0.48],
        note: 'Innermost trim ring with optical encoder tracks for zero-drift roll indexing.',
      },
      {
        nodeName: 'part_05_bayonet_mount',
        index: '05',
        code: 'AG9-PED-316L',
        label: '316L Slip-Ring Pedestal',
        material: '316L Marine-Grade Stainless Steel',
        finish: 'Passivated Machined Billet',
        tolerance: '±0.004 mm',
        mass: '128 g',
        vector: [0, -0.88, 0],
        note: 'Base pedestal with 24-channel gold-on-gold capsule slip ring and IP68 deck seal.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 03.A',
        title: 'Concentric 3-Axis Singularity Avoidance',
        metric: '55° Pitch Ring Offset',
        caption:
          'Canting the intermediate titanium ring by 55 degrees shifts gimbal singularity outside the ±45 degree marine pitch-and-roll operational cone.',
        diagramType: 'kinematic',
      },
      {
        index: 'FIG 03.B',
        title: 'Geodesic Brass Proof-Mass Balancing',
        metric: '< 0.02 g·mm Imbalance',
        caption:
          'Icosahedral facet milling on the central brass sphere equalizes principal moments of inertia across all three rotational axes.',
        diagramType: 'axial',
      },
      {
        index: 'FIG 03.C',
        title: '153 KB Real-Time Telemetry Twin',
        metric: '60 fps @ 4x CPU Throttle',
        caption:
          'Clean torus topology and direct matrix transforms allow smooth radial explosion on mobile field tablets without shader compilation stalls.',
        diagramType: 'optical',
      },
    ],
    placeholder: true,
  },
];

export const pipelineStages: PipelineStage[] = [
  {
    step: '01',
    code: 'STAGE 01 // NURBS & DFM',
    title: 'Parametric CAD & Kinematic Architecture',
    metric: '±0.002 mm STEP Master',
    summary:
      'Every project begins in Rhino 8 and SolidWorks with real manufacturing constraints: 5-axis tool clearance, thread relief undercuts, anodized coat thickness, and bearing preload stacks.',
    deliverable: 'Production STEP / IGES assemblies + tolerance stack-up ledger',
    specs: [
      '5-axis CNC milling & wire-EDM DFM verification',
      'Sub-assembly naming standardized to part_01..part_05 hierarchy',
      'True axial & radial explosion vectors defined at the CAD origin',
    ],
  },
  {
    step: '02',
    code: 'STAGE 02 // BPY PIPELINE',
    title: 'Sub-300 KB Procedural GLB Compilation',
    metric: '109 to 287 KB Payload',
    summary:
      'Instead of shipping 35 MB CAD exports or blurry 4K normal maps, my custom Blender 4.2 Python (bpy) pipeline bakes angle-limited geometric bevels and analytic PBR metallic-roughness materials directly into compact vertex buffers.',
    deliverable: 'Self-contained multi-node .glb assets under 300 KB',
    specs: [
      '32-degree angle-limited bevel modifiers for crisp specular edges',
      '7 calibrated physical materials (Obsidian, Titanium, Steel, Brass, Copper, Vermilion, Ceramic)',
      'Zero external texture requests for sub-second first-frame parse',
    ],
  },
  {
    step: '03',
    code: 'STAGE 03 // SINGLE CLOCK',
    title: '60 fps Browser Coordinate Stage',
    metric: '1 GSAP Ticker Loop',
    summary:
      'The compiled GLB mounts into a custom Three.js inspection stage driven by the exact same GSAP ticker as Lenis smooth scroll and DOM micrometer readouts, with full SVG orthographic schematics for reduced-motion visitors.',
    deliverable: 'Drop-in Astro / Next.js / TypeScript 3D stage module',
    specs: [
      'Synchronized DOM Bill-of-Materials (BOM) callouts & vernier scrub',
      'Automatic off-screen render pause and zero-JS static SVG fallback',
      'Verified < 2.5 s mobile LCP and < 0.01 CLS under 4x CPU throttling',
    ],
  },
];

export const engagementModels: EngagementModel[] = [
  {
    code: 'SCOPE A // 3 WEEKS',
    title: 'Interactive Launch Twin from Existing CAD',
    duration: '3 Weeks Fixed',
    deliverable: 'Sub-300 KB GLB + WebGL Inspection Stage',
    summary:
      'For hardware teams who already have frozen STEP files and need an interactive 60 fps exploded-view stage for a product launch, documentation portal, or investor room.',
    includes: [
      'STEP-to-BMesh topology decimation & bevel baking in Blender 4.2',
      '5-part kinematic rig with axial explosion & wireframe toggle',
      'Responsive Three.js + GSAP stage component with static SVG fallback',
    ],
  },
  {
    code: 'SCOPE B // 6 WEEKS',
    title: 'Enclosure Industrial Design + WebGL System',
    duration: '6 Weeks Fixed',
    deliverable: 'CNC Tooling Package + Full Launch Microsite',
    summary:
      'End-to-end industrial design of a machined aluminum, titanium, or brass instrument enclosure alongside its complete high-converting interactive product launch site.',
    includes: [
      'Mechanical enclosure CAD, material finish schedule, and DFM review',
      'Custom multi-specimen 3D inspection bench and case documentation',
      'Full production build audited for accessibility, SEO, and 60 fps mobile WPO',
    ],
  },
  {
    code: 'SCOPE C // RETAINED',
    title: 'Multi-Product Configurator Architecture',
    duration: 'Quarterly Bench Retainer',
    deliverable: 'Modular GLB Asset Pipeline & Shader Library',
    summary:
      'Ongoing real-time graphics and industrial visualization partnership for instrument makers shipping entire product lines with shared hardware modules.',
    includes: [
      'Automated Python bpy asset compilation scripts for engineering teams',
      'Custom PBR material calibration matching physical anodized samples',
      'Shared WebGL coordinate stage across marketing, docs, and sales tools',
    ],
  },
];

export const labEquipment = [
  {
    category: 'CAD & Kinematics',
    items: ['Rhino 8 NURBS', 'SolidWorks Professional', 'Blender 4.2 LTS Python (bpy) Automation', 'GD&T Tolerance Stack Analysis'],
  },
  {
    category: 'Real-Time Graphics',
    items: ['Three.js WebGL2 Pipeline', 'Custom GLSL PBR & Wireframe Shaders', 'GSAP Ticker Single-Clock Architecture', 'glTF 2.0 Binary Packing'],
  },
  {
    category: 'Physical Metrology Bench',
    items: ['Mitutoyo Absolute Digimatic Calipers (±0.001 mm)', 'Zeiss Granite Surface Plate (Grade 00)', 'Anodized Aluminum & Ti-6Al-4V Coupon Library', 'Acoustic & Optical Fixture Prototyping'],
  },
];
