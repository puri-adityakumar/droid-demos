export type SubAssemblyPart = {
  index: string;
  nodeName:
    | 'part_01_base'
    | 'part_02_body'
    | 'part_03_top'
    | 'part_04_accent'
    | 'part_05_vessel';
  code: string;
  label: string;
  material: string;
  finish: string;
  tolerance: string;
  mass: string;
  vector: [number, number, number];
  note: string;
};

export type CraftPlate = {
  index: string;
  title: string;
  metric: string;
  caption: string;
};

export type BrewRecipeSpec = {
  doseG: number;
  yieldG: number;
  tempC: number;
  pressureBar: string;
  timeSec: string;
  tdsPct: string;
  extractionPct: string;
  grindUm: string;
};

export type Project = {
  slug: 'lever-l01' | 'pourover-v60' | 'stoneware-s08' | 'gedeb-lot04';
  index: string;
  specimenCode: string;
  title: string;
  shortTitle: string;
  client: string;
  sector: string;
  year: string;
  modelUrl: string;
  sheetImage: string;
  sheetAlt: string;
  glbSize: string;
  triangleCount: string;
  datumTolerance: string;
  axialTravelMm: number;
  priceUsd: string;
  summary: string;
  heroCaption: string;
  brewTelemetry: BrewRecipeSpec;
  context: string[];
  decision: string[];
  outcome: string[];
  deliverables: string[];
  parts: SubAssemblyPart[];
  craftPlates: CraftPlate[];
};

export type OriginLot = {
  id: string;
  lotCode: string;
  title: string;
  region: string;
  producer: string;
  altitude: string;
  varietal: string;
  process: string;
  agtron: string;
  cuppingScore: string;
  fobPrice: string;
  bagPrice: string;
  orderCta: string;
  orderHref: string;
  image: string;
  imageAlt: string;
  tastingNotes: string[];
  linkedSpecimen: Project['slug'];
  brewTemp: string;
  pressure: string;
  extraction: string;
  tds: string;
  recipeSummary: string;
};

export type TastingNoteCard = {
  id: string;
  code: string;
  title: string;
  botanicalLatin: string;
  compound: string;
  volatility: string;
  foundInLot: string;
  image: string;
  imageAlt: string;
  summary: string;
};

export type RoastPhase = {
  id: string;
  step: string;
  name: string;
  timestamp: string;
  beanTempC: string;
  rorCMin: string;
  burnerKpa: string;
  agtronTarget: string;
  svgX: number;
  svgTempY: number;
  svgRorY: number;
  summary: string;
  specs: string[];
};

export const site = {
  name: 'KOBO // ROAST LAB',
  shortName: 'KOBO',
  studioCode: 'KYOTO · PORTLAND',
  role: 'Specialty Coffee Roastery, Extraction Lab & Equipment Studio',
  location: 'Higashiyama, Kyoto & SE Division, Portland',
  coordinates: '35.0037° N, 135.7785° E // 45.5048° N, 122.6305° W',
  email: 'lab@kobo-roast.studio',
  availability: 'ROAST BATCH #042 · DISPATCHING MON & THU',
  url: 'https://kobo-roast-lab.vercel.app',
  description:
    'KOBO Roast Lab is a Japanese-Scandinavian specialty coffee roastery, convective extraction lab, and manual brewing hardware studio in Kyoto and Portland.',
  heroLead:
    'We roast high-altitude single-origin micro-lots on a recirculating Loring S15 Falcon (Agtron 68.4 to 71.2) and machine companion brass, walnut, and Arita porcelain brewing instruments.',
  heroSub:
    'Use the sunlit 3D extraction turntable to switch between our 4 custom assemblies, scrub the axial explosion slider, or click any of the 5 sub-components to inspect material tolerances and thermal mass.',
  ctaLabel: 'Order Lot-04 Reserve ($24)',
  benchMetrics: [
    {
      label: 'CONVECTIVE ROAST COLOR',
      value: '68.4 Ag',
      detail: 'Whole-bean / 76.2 ground Agtron gourmet scale on Loring S15 Falcon.',
    },
    {
      label: 'REFRACTOMETER EXTRACTION',
      value: '21.4% EXT',
      detail: 'Verified at 1.42% filter TDS and 9.8% lever espresso TDS via VST Lab Coffee III.',
    },
    {
      label: 'REMINERALIZED WATER SPEC',
      value: '38 ppm GH',
      detail: 'Magnesium-dominant buffer with 18 ppm KH alkalinity at 6.8 pH.',
    },
    {
      label: 'DIRECT FARM GATE MULTIPLE',
      value: '3.4x C-MKT',
      detail: '$6.40/lb average FOB price paid directly to washing station partners.',
    },
  ],
  socials: [
    { label: 'Roast Telemetry Logs', href: 'https://github.com' },
    { label: 'Kyoto Tasting Room', href: 'https://instagram.com' },
    { label: 'Direct Trade Ledger', href: 'https://linkedin.com' },
  ],
};

export const projects: Project[] = [
  {
    slug: 'lever-l01',
    index: '01',
    specimenCode: 'KOBO-L01 // REV 4.2',
    title: 'KOBO L-01 Manual Lever Espresso Machine',
    shortTitle: 'Lever Espresso',
    client: 'KOBO Kyoto Hardware Works',
    sector: '9-Bar Direct-Piston Espresso Architecture',
    year: '2025',
    modelUrl: '/models/kobo-lever-espresso.glb',
    sheetImage: '/images/sheet-lever-espresso.jpg',
    sheetAlt: 'Studio turnaround and material board for the KOBO L-01 Brass and Walnut Manual Lever Espresso Machine',
    glbSize: '172 KB',
    triangleCount: '4,820 tris',
    datumTolerance: '±0.015 mm',
    axialTravelMm: 92,
    priceUsd: '$2,480',
    summary:
      'Direct-spring manual lever espresso machine machined from C36000 free-cutting brass, American black walnut, and 316L stainless steel with a declining 9.0 to 5.2 bar extraction profile.',
    heroCaption:
      'Active on 3D Bar: KOBO L-01 Lever Assembly. Drag to orbit in morning daylight, scrub Z-axis separation, or isolate any of the 5 thermal sub-assemblies.',
    brewTelemetry: {
      doseG: 18.0,
      yieldG: 38.0,
      tempC: 93.5,
      pressureBar: '9.0 → 5.2 BAR',
      timeSec: '31s',
      tdsPct: '9.84%',
      extractionPct: '21.6%',
      grindUm: '265 µm',
    },
    context: [
      'Flat-9-bar rotary pump machines erode delicate floral terpenes during the final 10 seconds of espresso extraction as puck resistance degrades. Light-roast washed Ethiopian and high-elevation Colombian lots demand a natural declining pressure curve after full puck saturation.',
      'We engineered the KOBO L-01 around a calibrated 62 mm tempered chrome-silicon piston spring coupled to a thermally saturated C36000 brass grouphead bell. A 2.0 bar line-pressure pre-infusion wets the 58 mm puck for 7 seconds before the lever releases a 9.0 bar peak that tapers smoothly to 5.2 bar.',
    ],
    decision: [
      'Every structural component is turned from solid C36000 brass bar stock in Higashiyama and paired with kiln-dried American black walnut handles oiled in pure tung resin. The 1.8 L vertical boiler uses a dual-probe PID loop holding group water within ±0.15°C of target.',
      'For the browser twin, all 5 mechanical sub-assemblies were modeled directly in Blender 4.2 with procedural bevel normals and zero image textures, delivering a 172 KB glTF 2.0 asset that reflects sunlit studio highlights at 60 fps.',
    ],
    outcome: [
      'Across 250 consecutive shots of Roast Batch #042 (LOT-04 Gedeb Worka Sakaro), VST refractometer readings averaged 21.6% extraction yield at 9.84% TDS with zero astringent channeling.',
      'Each L-01 unit ships serialized in a Japanese cedar flight crate with bottomless walnut portafilter, competition 20 g precision basket, and a 5-year mechanical seal warranty.',
    ],
    deliverables: [
      'Serialized C36000 Brass & Walnut L-01 Chassis',
      '58 mm 316L Bottomless Portafilter + Precision Basket',
      '0 to 12 BAR Glycerine-Damped Bourdon Pressure Gauge',
      'Interactive 172 KB 5-Part WebGL Maintenance Twin',
    ],
    parts: [
      {
        index: '01',
        nodeName: 'part_01_base',
        code: 'WALNUT-PLINTH',
        label: 'Turned American Black Walnut Plinth & Perforated Brass Drip Tray',
        material: 'Kiln-Dried Juglans Nigra + C36000 Brass',
        finish: 'Hand-Rubbed Tung Oil & Hairline Satin Brass',
        tolerance: '±0.025 mm',
        mass: '3,420 g',
        vector: [0, -0.75, 0],
        note: 'CNC-routed drainage basin with laser-perforated 1.4 mm brass drip grid and four vibration-isolating brass feet.',
      },
      {
        index: '02',
        nodeName: 'part_02_body',
        code: 'BOILER-COL',
        label: 'Brushed C36000 Brass 1.8L Boiler Column & Sight-Glass Assembly',
        material: 'C36000 Free-Cutting Brass + 316L Core',
        finish: '320-Grit Orbital Brushed Patina',
        tolerance: '±0.015 mm',
        mass: '5,890 g',
        vector: [0, 0.05, -0.35],
        note: 'Dual-PID 1,400 W immersion element with triple turned collar rings and matte obsidian structural spine.',
      },
      {
        index: '03',
        nodeName: 'part_03_top',
        code: 'LEVER-GROUP',
        label: 'Direct-Piston Spring Lever Fork, Grouphead Bell & Turned Walnut Grip',
        material: 'Forged Brass Bell + Chrome-Silicon Spring',
        finish: 'Mirror Chamfer & Lathe-Turned Walnut',
        tolerance: '±0.010 mm',
        mass: '2,640 g',
        vector: [0, 0.85, 0.25],
        note: 'Delivers 9.0 bar peak extraction tapering to 5.2 bar across a 38 g liquid yield.',
      },
      {
        index: '04',
        nodeName: 'part_04_accent',
        code: 'PF-GAUGE-WAND',
        label: '58mm Bottomless Portafilter, 0-12 BAR Bourdon Pressure Gauge & Steam Wand',
        material: '316L Surgical Steel + Arita Dial Face',
        finish: 'Electropolished Steel & Walnut Grip',
        tolerance: '±0.012 mm',
        mass: '1,180 g',
        vector: [0.45, -0.1, 0.65],
        note: 'Real-time piston chamber Bourdon manometer paired with a cool-touch two-hole dry steam wand.',
      },
      {
        index: '05',
        nodeName: 'part_05_vessel',
        code: 'ARITA-DEMITASSE',
        label: 'Arita Porcelain Demitasse Cup & 9-Bar Tiger-Flecked Espresso Crema',
        material: 'Amakusa Kaolin Porcelain (1,300°C Firing)',
        finish: 'Clear Feldspar Glaze Interior',
        tolerance: '±0.120 mm',
        mass: '145 g',
        vector: [0, -0.45, 0.55],
        note: 'Pre-warmed 85 mL thick-walled demitasse holding a 38 g double shot at 9.84% TDS.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 01.A',
        title: '9-Bar Piston Lever Pressure Decay Curve',
        metric: '9.0 → 5.2 BAR',
        caption: 'Spring compression release profile preventing late-stage tannin extraction.',
      },
      {
        index: 'FIG 01.B',
        title: 'Thermal Bridge & Saturated Grouphead Bell',
        metric: '93.5°C ±0.15°C',
        caption: 'Active thermosyphon loop equilibrating brass group mass with boiler water.',
      },
      {
        index: 'FIG 01.C',
        title: 'Sub-180 KB Procedural PBR Mesh Topology',
        metric: '172 KB GLB',
        caption: '5-node glTF 2.0 hierarchy with bevel-weighted normals and zero texture bloat.',
      },
    ],
  },
  {
    slug: 'pourover-v60',
    index: '02',
    specimenCode: 'KOBO-V60 // REV 2.8',
    title: 'KOBO V-60 Fluted Porcelain Pour-Over & Copper Kettle',
    shortTitle: 'V60 Pour-Over',
    client: 'Arita Kiln & Tsubame Metalworks',
    sector: 'Laminar Percolation & Thermal Brewing System',
    year: '2025',
    modelUrl: '/models/kobo-pourover-set.glb',
    sheetImage: '/images/sheet-pourover-set.jpg',
    sheetAlt: 'Studio turnaround and material board for the KOBO V-60 Fluted Porcelain Pour-Over, Borosilicate Carafe, and Rose-Copper Kettle',
    glbSize: '128 KB',
    triangleCount: '3,940 tris',
    datumTolerance: '±0.080 mm',
    axialTravelMm: 84,
    priceUsd: '$340',
    summary:
      'Slip-cast 60° Arita porcelain dripper with 16 high-relief spiral air ribs, paired with a 600 mL borosilicate glass server and a 700 mL hand-hammered rose-copper gooseneck kettle.',
    heroCaption:
      'Active on 3D Bar: KOBO V-60 Percolation Set & Copper Kettle. Inspect the 16 spiral ribs, walnut thermal collar, and 5.2 mm laminar gooseneck spout.',
    brewTelemetry: {
      doseG: 15.0,
      yieldG: 250.0,
      tempC: 93.0,
      pressureBar: '1.0 ATM',
      timeSec: '2m 35s',
      tdsPct: '1.42%',
      extractionPct: '21.4%',
      grindUm: '620 µm',
    },
    context: [
      'Conventional ceramic drippers suffer from two thermodynamic flaws: heavy stoneware steals up to 6.5°C of slurry heat during the initial 45-second bloom, and shallow interior ribs allow wet filter paper to seal against the cone wall, choking drawdown and causing bitter bypass stagnation.',
      'Working with a fourth-generation kiln in Arita, Saga Prefecture, we formulated a thin-walled high-alumina Amakusa porcelain cone with 16 knife-crisp 2.4 mm spiral ribs that hold the paper filter suspended in an insulating air pocket.',
    ],
    decision: [
      'We paired the dripper with a lathe-turned walnut thermal collar seated atop a hand-blown 3.3 borosilicate carafe, alongside a 700 mL rose-copper kettle forged in Tsubame whose triple-curved 5.2 mm gooseneck spout maintains a vertical, zero-turbulence laminar stream at 4.5 g/s.',
      'In the 128 KB 3D WebGL twin, alpha-blended borosilicate glass and glowing amber brewed coffee sit alongside high-metallicity rose copper and matte porcelain.',
    ],
    outcome: [
      'Slurry thermistor logs confirm a 2.8°C higher mid-brew slurry temperature compared to standard ceramic cones, yielding 21.4% extraction at 1.42% TDS with a clean 2:35 total drawdown.',
      'Adopted across both our Kyoto Higashiyama and Portland SE Division pour-over bars for all single-origin filter flights.',
    ],
    deliverables: [
      '60° Arita Porcelain 02 Dripper (16 Spiral Ribs)',
      '600 mL Borosilicate Range Server + Walnut Collar',
      '700 mL Tsubame Rose-Copper Laminar Kettle',
      'Interactive 128 KB 5-Part WebGL Percolation Twin',
    ],
    parts: [
      {
        index: '01',
        nodeName: 'part_01_base',
        code: 'BORO-CARAFE',
        label: 'Hand-Blown 600mL Borosilicate Glass Carafe & Glowing Amber Brewed Lot',
        material: 'Schott 3.3 Low-Expansion Borosilicate Glass',
        finish: 'Flame-Polished Rim & Integrated Glass Ear',
        tolerance: '±0.150 mm',
        mass: '210 g',
        vector: [-0.35, -0.65, 0],
        note: 'Conical swirl base engineered to oxygenate light-roast filter extractions without rapid heat loss.',
      },
      {
        index: '02',
        nodeName: 'part_02_body',
        code: 'WALNUT-COLLAR',
        label: 'Turned Walnut Thermal Collar Ring (Ø 94mm)',
        material: 'Kiln-Dried American Black Walnut',
        finish: 'Food-Safe Beeswax & Tung Oil Seal',
        tolerance: '±0.050 mm',
        mass: '48 g',
        vector: [-0.35, 0.0, 0],
        note: 'Insulates the porcelain dripper seat from the glass server while providing a cool-touch pour grip.',
      },
      {
        index: '03',
        nodeName: 'part_03_top',
        code: 'ARITA-V60-CONE',
        label: '60° Arita Porcelain Dripper with 16 High-Relief Spiral Air Ribs & Coffee Bed',
        material: 'High-Alumina Amakusa Porcelain',
        finish: 'Matte Biscuit Exterior / Glazed Flutes',
        tolerance: '±0.080 mm',
        mass: '185 g',
        vector: [-0.35, 0.78, 0],
        note: '2.4 mm spiral ribs prevent paper vacuum lock and maintain uniform 620 µm coffee bed percolation.',
      },
      {
        index: '04',
        nodeName: 'part_04_accent',
        code: 'COPPER-KETTLE',
        label: '700mL Tsuchime Rose-Copper Gooseneck Kettle (5.2mm Laminar Spout)',
        material: 'C1100 Oxygen-Free Copper + Tin Lining',
        finish: 'Brushed Rose Copper & Walnut Handle',
        tolerance: '±0.040 mm',
        mass: '490 g',
        vector: [0.55, -0.25, 0.15],
        note: 'Precision-tapered gooseneck spout delivers vertical water entry at 3.5 to 6.0 g/s without bed agitation.',
      },
      {
        index: '05',
        nodeName: 'part_05_vessel',
        code: 'KETTLE-LID',
        label: 'Fitted Copper Lid & Turned Walnut Finial Thermometer Knob',
        material: 'C1100 Copper + Turned Walnut Finial',
        finish: 'Friction-Fit Steam Vent & Brass Ferrule',
        tolerance: '±0.030 mm',
        mass: '62 g',
        vector: [0.55, 0.82, 0.15],
        note: 'Includes an integrated 4.0 mm thermistor port for live brew-water temperature verification.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 02.A',
        title: '60° Spiral Flute Laminar Bypass Geometry',
        metric: '16 RIBS // 2.4 MM',
        caption: 'Air-channel relief geometry eliminating paper wall adhesion.',
      },
      {
        index: 'FIG 02.B',
        title: '5.2mm Gooseneck Spout Reynolds Number Profile',
        metric: 'Re < 1,850 LAMINAR',
        caption: 'Triple-radius spout bend suppressing vortex shedding at 4.5 g/s pour rate.',
      },
      {
        index: 'FIG 02.C',
        title: 'Slurry Thermal Retention Curve (00:00 to 02:35)',
        metric: '93.0°C → 90.8°C',
        caption: 'High-alumina thin-wall porcelain minimizing initial bloom heat draw.',
      },
    ],
  },
  {
    slug: 'stoneware-s08',
    index: '03',
    specimenCode: 'KOBO-S08 // REV 1.9',
    title: 'KOBO S-08 Speckled Stoneware Cappuccino & Rosetta',
    shortTitle: 'Stoneware Cup',
    client: 'Mashiko Wood-Fired Ceramic Guild',
    sector: 'Thermal Retention Vessel & Microfoam Fluid Dynamics',
    year: '2025',
    modelUrl: '/models/kobo-stoneware-cup.glb',
    sheetImage: '/images/sheet-cup-and-pouch.jpg',
    sheetAlt: 'Studio turnaround and material board for the KOBO S-08 Speckled Stoneware Cup and LOT-04 Gedeb Coffee Pouch',
    glbSize: '177 KB',
    triangleCount: '4,960 tris',
    datumTolerance: '±0.180 mm',
    axialTravelMm: 76,
    priceUsd: '$68',
    summary:
      'Wheel-thrown 190 mL Mashiko iron-speckled stoneware vessel with a parabolic interior crema bowl, paired with a lathe-turned oiled walnut saucer.',
    heroCaption:
      'Active on 3D Bar: KOBO S-08 Mashiko Stoneware Vessel. Explore the parabolic bowl geometry, walnut saucer well, and 8-leaf microfoam rosetta.',
    brewTelemetry: {
      doseG: 18.0,
      yieldG: 38.0,
      tempC: 93.5,
      pressureBar: '9.0 → 5.2 BAR',
      timeSec: '29s',
      tdsPct: '9.80%',
      extractionPct: '21.2%',
      grindUm: '260 µm',
    },
    context: [
      'A classic 1:3 specialty cappuccino relies on the surface tension interplay between a viscous 9.8% TDS double-ristretto crema base and 62°C steamed whole milk aerated to 15% micro-bubble expansion. Flat-bottomed cups fracture the crema ring on impact.',
      'Thrown from iron-rich Mashiko clay in Tochigi Prefecture and fired in a reduction atmosphere at 1,260°C, the KOBO S-08 features a continuous 44 mm radius parabolic interior floor that folds steamed milk smoothly underneath the golden crema.',
    ],
    decision: [
      'We gave the vessel a 7.0 mm lower thermal mass wall that tapers to a 3.2 mm rolled lip for tactile mouthfeel, resting inside a recessed foot well turned into an oiled American black walnut saucer.',
      'The 177 KB 3D model separates the walnut saucer, stoneware bowl, hand-pulled ear handle, golden espresso crema disc, and sculpted 8-leaf microfoam rosetta into 5 inspectable layers.',
    ],
    outcome: [
      'Maintains optimal drinking temperature (62°C tapering to 54°C) for 14 minutes without scalding the fingers, while the unglazed stoneware foot locks cleanly into the walnut saucer recess.',
      'Available individually or in calibrated sets of four for specialty espresso bars.',
    ],
    deliverables: [
      '190 mL Reduction-Fired Mashiko Stoneware Cup',
      'Ø 148 mm Turned Walnut Recessed Saucer',
      'Food-Safe Shino & Feldspar Interior Glaze',
      'Interactive 177 KB 5-Part WebGL Vessel Twin',
    ],
    parts: [
      {
        index: '01',
        nodeName: 'part_01_base',
        code: 'WALNUT-SAUCER',
        label: 'Lathe-Turned Oiled Walnut Saucer with Recessed Foot Well (Ø 148mm)',
        material: 'Kiln-Dried American Black Walnut',
        finish: 'Satin Tung Oil & Raised Rim Lip',
        tolerance: '±0.080 mm',
        mass: '132 g',
        vector: [0, -0.75, 0],
        note: 'Recessed 64 mm center well prevents cup sliding during bar service without clattering ceramic-on-ceramic noise.',
      },
      {
        index: '02',
        nodeName: 'part_02_body',
        code: 'MASHIKO-BOWL',
        label: 'Wood-Fired Mashiko Iron-Speckled Stoneware Bowl (190mL, 7mm Thermal Wall)',
        material: 'Tochigi Iron-Bearing Stoneware Clay',
        finish: '1,260°C Reduction Speckled Shino Glaze',
        tolerance: '±0.180 mm',
        mass: '228 g',
        vector: [0, -0.1, 0],
        note: 'Parabolic interior floor promotes symmetric vortex roll when pouring microfoam.',
      },
      {
        index: '03',
        nodeName: 'part_03_top',
        code: 'STONEWARE-HANDLE',
        label: 'Hand-Pulled Stoneware Ear Loop Handle',
        material: 'Mashiko Stoneware Clay',
        finish: 'Ergonomic Single-Finger Counterbalance Loop',
        tolerance: '±0.200 mm',
        mass: '34 g',
        vector: [0.75, 0.05, 0],
        note: 'Thickened upper thumb rest balances the torque of a full 190 mL beverage.',
      },
      {
        index: '04',
        nodeName: 'part_04_accent',
        code: 'CREMA-MENISCUS',
        label: 'Double-Ristretto Golden Espresso Crema Base (TDS 9.8%, 38g Yield)',
        material: 'Emulsified Coffee Oils & CO2 Micro-Colloid',
        finish: 'Tiger-Flecked Hazelnut Meniscus',
        tolerance: '±0.500 mL',
        mass: '38 g',
        vector: [0, 0.52, 0],
        note: 'Pulled from Roast Batch #042 at 93.5°C to provide high surface tension for free-pour latte art contrast.',
      },
      {
        index: '05',
        nodeName: 'part_05_vessel',
        code: 'ROSETTA-FOAM',
        label: '62°C Silky Microfoam 8-Leaf Rosetta & Heart Relief',
        material: 'Aerated Whole Milk (< 120 µm Micro-Bubbles)',
        finish: 'Glossy Wet-Paint Lactose-Protein Emulsion',
        tolerance: '±0.5°C',
        mass: '135 g',
        vector: [0, 0.95, 0],
        note: 'Steamed to 62.0°C to maximize natural lactose sweetness before beta-lactoglobulin denaturation at 68°C.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 03.A',
        title: 'Mashiko Iron-Clay Thermal Retention Cross-Section',
        metric: '7.0 → 3.2 MM WALL',
        caption: 'Graduated wall thickness storing heat at the base while cooling the lip.',
      },
      {
        index: 'FIG 03.B',
        title: 'Parabolic Bowl Vortex & Crema Lift Vectors',
        metric: 'R 44.0 MM BOWL',
        caption: 'Fluid trajectory during initial high-pour penetration and low-pour rosetta draw.',
      },
      {
        index: 'FIG 03.C',
        title: 'Walnut Acoustic Damping Saucer Interface',
        metric: '-14 dB IMPACT',
        caption: 'Turned hardwood seat eliminating porcelain-on-porcelain service clatter.',
      },
    ],
  },
  {
    slug: 'gedeb-lot04',
    index: '04',
    specimenCode: 'KOBO-LOT04 // HARVEST 2025',
    title: 'KOBO LOT-04 Gedeb Worka Sakaro Reserve Pouch',
    shortTitle: 'Gedeb Pouch',
    client: 'Worka Sakaro Washing Station (Gedeo, Ethiopia)',
    sector: 'Nitrogen-Flushed Barrier Packaging & Light-Roast Lot',
    year: '2025',
    modelUrl: '/models/kobo-coffee-pouch.glb',
    sheetImage: '/images/sheet-cup-and-pouch.jpg',
    sheetAlt: 'Studio turnaround and material board for the KOBO LOT-04 Gedeb Worka Sakaro Reserve Pouch with brass degassing valve',
    glbSize: '98 KB',
    triangleCount: '2,680 tris',
    datumTolerance: '±0.050 mm',
    axialTravelMm: 72,
    priceUsd: '$24',
    summary:
      '250 g compostable matte white-kraft barrier pouch with blind-debossed 2,150 MASL topographic contours, CNC-turned brass one-way CO2 degassing valve, and nitrogen-flushed Ethiopian Heirloom whole beans.',
    heroCaption:
      'Active on 3D Bar: KOBO LOT-04 Gedeb Worka Sakaro Reserve Pouch. Inspect the topographic embossing, brass CO2 valve, and whole-bean Agtron 68.4 roast.',
    brewTelemetry: {
      doseG: 15.5,
      yieldG: 255.0,
      tempC: 94.0,
      pressureBar: '1.0 ATM',
      timeSec: '2m 28s',
      tdsPct: '1.44%',
      extractionPct: '21.5%',
      grindUm: '610 µm',
    },
    context: [
      'Light-roast specialty coffee continues to release trapped intracellular carbon dioxide for 14 to 21 days after roasting, while ambient oxygen rapidly stales delicate volatile aromatics like linalool and jasmine benzyl acetate if headspace O2 exceeds 1.0%.',
      'We engineered the KOBO LOT-04 Reserve Pouch using a high-barrier plant-based PLA/white-kraft laminate flushed with food-grade nitrogen to < 0.4% residual oxygen immediately at the Loring cooling tray.',
    ],
    decision: [
      'Instead of disposable plastic valves, we press-fit a reusable CNC-turned brass one-way diaphragm valve calibrated to crack at +3.8 mbar internal CO2 pressure while blocking external oxygen ingress.',
      'The front face is blind-debossed with the 2,150 MASL elevation contours of the Worka Sakaro ridge in Gedeb, Yirgacheffe, and sealed with a terracotta origin stamp.',
    ],
    outcome: [
      'Headspace gas chromatography confirms volatile terpene retention above 94% at day 35 post-roast, allowing international shipments from Kyoto and Portland to peak naturally during transit.',
      'Every pouch prints the exact FOB Djibouti price ($6.40/lb), Loring roast log ID, and water chemistry recommendation on the rear ledger.',
    ],
    deliverables: [
      '250 g Whole-Bean LOT-04 Gedeb (Roast Batch #042)',
      'Nitrogen-Flushed (< 0.4% O2) White-Kraft Barrier Pouch',
      'CNC-Turned Brass 3.8 mbar One-Way Aroma Valve',
      'QR Telemetry Link to Loring S15 Roast Batch #042',
    ],
    parts: [
      {
        index: '01',
        nodeName: 'part_01_base',
        code: 'KRAFT-POUCH',
        label: '250g Biodegradable Matte White-Kraft Gusseted Stand-Up Pouch',
        material: 'FSC Bleached Japanese Washi-Kraft + PLA Barrier',
        finish: 'Unbleached Natural Kraft Side Gussets',
        tolerance: '±0.250 mm',
        mass: '18 g',
        vector: [0, -0.2, -0.25],
        note: 'Triple-layer oxygen and moisture barrier (< 0.05 cc/m²/24h O2 transmission rate).',
      },
      {
        index: '02',
        nodeName: 'part_02_body',
        code: 'TOPO-RELIEF',
        label: 'Blind-Debossed 2,150 MASL Topographic Ridge Relief & Terracotta Origin Seal',
        material: 'Die-Struck Cotton Rag & Terracotta Foil Stamp',
        finish: '1.2 mm High-Relief Blind Embossing',
        tolerance: '±0.080 mm',
        mass: '4 g',
        vector: [0, -0.15, 0.65],
        note: 'Maps the exact topographic ridge of the Worka Sakaro washing station in Gedeb, Ethiopia.',
      },
      {
        index: '03',
        nodeName: 'part_03_top',
        code: 'CRIMP-ZIPPER',
        label: 'Ultrasonic Heat-Sealed Crimp Header & Brass Pull-Tab Zipper',
        material: 'PLA Thermal Seal + Micro-Track Pocket Lock',
        finish: 'Ribbed Ultrasonic Crimp & Brass Tab',
        tolerance: '±0.100 mm',
        mass: '5 g',
        vector: [0, 0.85, 0],
        note: 'Hermetic top seal before opening, converting to a dual-track resealable aroma lock.',
      },
      {
        index: '04',
        nodeName: 'part_04_accent',
        code: 'BRASS-VALVE',
        label: 'CNC-Turned Brass One-Way CO2 Degassing Aroma Valve',
        material: 'C36000 Brass Housing + Silicone Fluorosilicone Disc',
        finish: 'Micro-Knurled Perimeter Ring',
        tolerance: '±0.015 mm',
        mass: '9 g',
        vector: [0, 0.35, 0.85],
        note: 'Vents post-roast CO2 above 3.8 mbar while maintaining zero atmospheric oxygen backflow.',
      },
      {
        index: '05',
        nodeName: 'part_05_vessel',
        code: 'HEIRLOOM-BEANS',
        label: 'Whole-Bean Light-Roast Ethiopian Heirloom Arabica (Agtron 68.4)',
        material: 'Washed Dega & Kurume Landrace (11.2% Moisture)',
        finish: 'Convective Loring S15 Light Roast (14.8% DTR)',
        tolerance: '±0.3 Agtron',
        mass: '250 g',
        vector: [0, 0.45, 0.35],
        note: 'Roasted to First Crack at 196.4°C and dropped at 204.2°C for vibrant bergamot and white peach clarity.',
      },
    ],
    craftPlates: [
      {
        index: 'FIG 04.A',
        title: '3.8 mbar Brass One-Way Degassing Valve Section',
        metric: '< 0.4% O2 HEADSPACE',
        caption: 'Fluorosilicone membrane cracking pressure vs. post-roast CO2 outgassing.',
      },
      {
        index: 'FIG 04.B',
        title: 'Worka Sakaro 2,150 MASL Topographic Die Plate',
        metric: '1.2 MM RELIEF',
        caption: 'Brass engraving die transferring Gedeo elevation contours onto white kraft.',
      },
      {
        index: 'FIG 04.C',
        title: 'Agtron 68.4 / 76.2 Convective Cell Structure',
        metric: 'Δ 7.8 AGTRON SPREAD',
        caption: 'Minimal bean-to-core color delta verified via VST spectrophotometry.',
      },
    ],
  },
];

export const originLots: OriginLot[] = [
  {
    id: 'lot-01-ethiopia',
    lotCode: 'LOT 01 // NOV-JAN HARVEST',
    title: 'ETHIOPIA GEDEB WORKA SAKARO',
    region: 'Gedeb, Gedeo Zone (Yirgacheffe)',
    producer: 'Worka Sakaro Smallholder Cluster (380 Farmers)',
    altitude: '2,150 MASL',
    varietal: 'Washed Dega & Kurume Heirloom',
    process: '48h Underwater Spring Fermentation · 14d Raised African Beds',
    agtron: '68.4 Bean / 76.2 Ground',
    cuppingScore: '90.75 SCA',
    fobPrice: '$6.40 / lb FOB Djibouti',
    bagPrice: '$24 / 250g',
    orderCta: 'Order 250g Pouch ($24) →',
    orderHref: '/work/gedeb-lot04',
    image: '/images/origin-ethiopia.jpg',
    imageAlt: 'Ethiopian coffee producer sorting ripe red coffee cherries on sunlit raised drying beds in the highlands of Gedeb',
    tastingNotes: ['Bergamot Citrus', 'Night-Blooming Jasmine', 'White Peach'],
    linkedSpecimen: 'gedeb-lot04',
    brewTemp: '93.5°C',
    pressure: '1.0 ATM',
    extraction: '21.4%',
    tds: '1.42%',
    recipeSummary: '15g dose : 250g water at 93.5°C · 45g bloom (40s) · 2:32 total drawdown on KOBO V-60.',
  },
  {
    id: 'lot-02-colombia',
    lotCode: 'LOT 02 // MAY-JUL MITACA HARVEST',
    title: 'COLOMBIA HUILA FINCA EL PARAISO',
    region: 'Piendamo, Cauca & Acevedo, Huila',
    producer: 'Diego Samuel Bermudez · Finca El Paraiso',
    altitude: '1,980 MASL',
    varietal: 'Castillo & Pink Bourbon Selection',
    process: '96h Double Anaerobic Bioreactor + 60°C/12°C Thermal Shock Wash',
    agtron: '69.8 Bean / 77.4 Ground',
    cuppingScore: '91.25 SCA',
    fobPrice: '$8.10 / lb FOB Buenaventura',
    bagPrice: '$28 / 250g',
    orderCta: 'Order 250g Pouch ($28) →',
    orderHref: '/work/pourover-v60',
    image: '/images/origin-colombia.jpg',
    imageAlt: 'Sunlit mountain slopes and shade-grown coffee trees at Finca El Paraiso in Huila, Colombia',
    tastingNotes: ['White Peach', 'Damask Rosehip', 'Raw Cane Panela'],
    linkedSpecimen: 'pourover-v60',
    brewTemp: '91.5°C',
    pressure: '1.0 ATM',
    extraction: '21.1%',
    tds: '1.39%',
    recipeSummary: '15g dose : 245g water at 91.5°C · Gentle 3-pour laminar pulse on KOBO V-60 Porcelain.',
  },
  {
    id: 'lot-03-kenya',
    lotCode: 'LOT 03 // NOV-DEC MAIN HARVEST',
    title: 'KENYA NYERI OTHAYA KARUTHI AA',
    region: 'Othaya, Nyeri County (Mt. Kenya Slopes)',
    producer: 'Chinga Farmers Cooperative Society · Karuthi Factory',
    altitude: '1,850 MASL',
    varietal: 'SL28 & SL34 Screen 18 AA Selection',
    process: '72h Kenya Double-Washed Fermentation + Gathuthi River Soak',
    agtron: '67.2 Bean / 74.8 Ground',
    cuppingScore: '90.50 SCA',
    fobPrice: '$6.85 / lb FOB Mombasa',
    bagPrice: '$25 / 250g',
    orderCta: 'Order 250g Pouch ($25) →',
    orderHref: '/work/lever-l01',
    image: '/images/origin-kenya.jpg',
    imageAlt: 'Washed Kenyan SL28 coffee parchment drying in golden morning light on raised mesh tables in Nyeri',
    tastingNotes: ['Crushed Blackcurrant', 'Blood Orange Zest', 'Criollo Cacao Nib'],
    linkedSpecimen: 'lever-l01',
    brewTemp: '94.0°C',
    pressure: '9.0 → 5.2 BAR',
    extraction: '21.8%',
    tds: '9.92%',
    recipeSummary: '18g dose : 38g yield at 94.0°C · 7s pre-infusion at 2.0 bar + 24s lever pull on KOBO L-01.',
  },
];

export const tastingNotes: TastingNoteCard[] = [
  {
    id: 'note-bergamot',
    code: 'AROMA 01 // MONOTERPENE',
    title: 'Bergamot Citrus',
    botanicalLatin: 'Citrus bergamia · Calabria & Gedeo',
    compound: 'Linalool & Linalyl Acetate (18.4 µg/L)',
    volatility: 'High Volatility · Peak Release at 72°C Cup Temp',
    foundInLot: 'LOT 01: Ethiopia Gedeb Worka Sakaro',
    image: '/images/note-bergamot.jpg',
    imageAlt: 'Botanical watercolor illustration of a fresh green bergamot citrus fruit with cross-section and leaves',
    summary:
      'Crisp Earl Grey citrus rind brightness driven by high-altitude nighttime maturation at 2,150 MASL and preserved through a 14.8% convective development time ratio.',
  },
  {
    id: 'note-white-peach',
    code: 'AROMA 02 // LACTONE ESTER',
    title: 'Sun-Ripened White Peach',
    botanicalLatin: 'Prunus persica · Okayama & Huila',
    compound: 'Gamma-Decalactone & Delta-Octalactone',
    volatility: 'Medium Volatility · Peak Perception at 60°C to 52°C',
    foundInLot: 'LOT 01 & LOT 02: Gedeb & Finca El Paraiso',
    image: '/images/note-white-peach.jpg',
    imageAlt: 'Botanical watercolor illustration of a halved sun-ripened white peach with stone and green leaf',
    summary:
      'Nectar-like stone-fruit juiciness synthesized during controlled anaerobic lactic fermentation and expressed cleanly in 38 ppm magnesium-buffered water.',
  },
  {
    id: 'note-cacao-nib',
    code: 'AROMA 03 // MAILLARD ALKALOID',
    title: 'Criollo Cacao Nib',
    botanicalLatin: 'Theobroma cacao · Roasted Nib Structure',
    compound: 'Theobromine & 2,5-Dimethylpyrazine',
    volatility: 'Low Volatility · Anchors Aftertaste & Crema Body',
    foundInLot: 'LOT 03: Kenya Nyeri Othaya Karuthi AA',
    image: '/images/note-cacao-nib.jpg',
    imageAlt: 'Botanical watercolor illustration of a split Criollo cacao pod with roasted cacao nibs and leaves',
    summary:
      'Bittersweet 85% dark cacao structure formed during the 160°C to 194°C Maillard phase, providing velvety mid-palate weight under a 9-bar lever extraction.',
  },
  {
    id: 'note-jasmine',
    code: 'AROMA 04 // BENZYL ESTER',
    title: 'Night-Blooming Jasmine',
    botanicalLatin: 'Jasminum sambac · Highland Blossom',
    compound: 'Benzyl Acetate & Cis-Jasmone (9.2 µg/L)',
    volatility: 'Ultra-High Volatility · Bloom & Wet Aroma',
    foundInLot: 'LOT 01: Worka Sakaro Washed Heirloom',
    image: '/images/note-jasmine.jpg',
    imageAlt: 'Botanical watercolor illustration of blooming white jasmine flowers and green buds on a sprig',
    summary:
      'High-volatility white-floral aromatics released during the 45-second V60 bloom and lingering on the retro-nasal finish as the cup cools below 55°C.',
  },
];

export const roastCurvePhases: RoastPhase[] = [
  {
    id: '01',
    step: 'PHASE 01',
    name: 'Charge & Equilibrium',
    timestamp: '00:00',
    beanTempC: '205.0°C → 92.4°C',
    rorCMin: '+0.0°C/min',
    burnerKpa: '1.8 kPa (35% Recirc)',
    agtronTarget: 'Raw Green (11.2% H2O)',
    svgX: 60,
    svgTempY: 64,
    svgRorY: 165,
    summary:
      'A 12.0 kg batch of high-density washed Gedeb green coffee (742 g/L bulk density, Screen 15+) drops into the pre-stabilized Loring S15 Falcon drum at 205.0°C.',
    specs: [
      'CHARGE TEMP: 205.0°C Convective Air Stream',
      'DRUM RPM: 52 RPM (Gentle Conductive Contact)',
      'BEAN MOISTURE: 11.2% Wile-55 Readout',
    ],
  },
  {
    id: '02',
    step: 'PHASE 02',
    name: 'Turning Point & Endothermic Soak',
    timestamp: '01:24',
    beanTempC: '92.4°C → 128.0°C',
    rorCMin: '+18.4°C/min Peak',
    burnerKpa: '4.6 kPa (82% Burner)',
    agtronTarget: 'Endothermic Vapor Phase',
    svgX: 168,
    svgTempY: 176,
    svgRorY: 54,
    summary:
      'Probe reaches thermal equilibrium at 92.4°C before convective heat transfer drives free moisture out of the dense 2,150 MASL cellular matrix at a peak Rate of Rise of 18.4°C/min.',
    specs: [
      'TURNING POINT: 92.4°C at 01:24',
      'PEAK ROR: +18.4°C/min at 02:35',
      'AIRFLOW: 68 Hz Blower VFD Frequency',
    ],
  },
  {
    id: '03',
    step: 'PHASE 03',
    name: 'Dry End & Maillard Onset',
    timestamp: '04:18',
    beanTempC: '152.0°C',
    rorCMin: '+13.2°C/min',
    burnerKpa: '3.4 kPa (64% Burner)',
    agtronTarget: 'Yellowing & Strecker Synthesis',
    svgX: 332,
    svgTempY: 122,
    svgRorY: 96,
    summary:
      'Chlorophyll degrades into warm hay and toasted brioche aromatics at 152.0°C as reducing sugars and amino acids initiate Maillard browning and pyrazine formation.',
    specs: [
      'DRY END: 152.0°C at 04:18 (46.2% Time Ratio)',
      'ROR SLOPE: Smoothly Declining +13.2°C/min',
      'AROMA MARKER: Toasted Oat & Sweet Hay',
    ],
  },
  {
    id: '04',
    step: 'PHASE 04',
    name: 'First Crack Exothermic Release',
    timestamp: '07:54',
    beanTempC: '196.4°C',
    rorCMin: '+7.6°C/min',
    burnerKpa: '1.6 kPa (28% Burner)',
    agtronTarget: 'Agtron 74.0 (Initial Crack)',
    svgX: 520,
    svgTempY: 78,
    svgRorY: 138,
    summary:
      'Intracellular steam pressure fractures the cellulose cell walls at 196.4°C. Burner modulation anticipates the exothermic moisture release so Rate of Rise never flicks or stalls.',
    specs: [
      'FIRST CRACK: 196.4°C at 07:54',
      'BURNER STEP-DOWN: 28% Output Pre-Crack',
      'CELL POROSITY: Optimal Micro-Fracture for 21.4% EXT',
    ],
  },
  {
    id: '05',
    step: 'PHASE 05',
    name: 'Drop & High-CFM Cooling',
    timestamp: '09:16',
    beanTempC: '204.2°C',
    rorCMin: '+4.8°C/min',
    burnerKpa: '0.0 kPa (Cooling Tray)',
    agtronTarget: 'Agtron 68.4 Bean / 76.2 Ground',
    svgX: 620,
    svgTempY: 66,
    svgRorY: 162,
    summary:
      'After 1 minute 22 seconds of post-crack development (14.8% DTR), the batch drops at 204.2°C into the high-CFM downdraft cooling sieve, reaching 24°C in 140 seconds.',
    specs: [
      'DROP TEMP: 204.2°C at 09:16 (14.8% DTR)',
      'ROAST WEIGHT LOSS: 13.4% Moisture/Volatiles',
      'FINAL COLOR: Agtron 68.4 Whole / 76.2 Ground',
    ],
  },
];

export const labEquipment = [
  {
    category: 'Convective Roasting & Colorimetry',
    items: [
      'Loring S15 Falcon Smokeless Convective Roaster',
      'Lighttells CM-100+ NIR Bean/Ground Agtron Analyzer',
      'Ikawa Pro100X Sample Roaster (Kyoto & Portland)',
      'Sinar BeanPro 6070 Moisture & Bulk Density Meter',
    ],
  },
  {
    category: 'Extraction & Refractometry Lab',
    items: [
      'KOBO L-01 Direct-Piston 9-Bar Lever Test Bench',
      'Mahlkönig EK43S with SSP 98mm High-Uniformity Burrs',
      'VST Lab Coffee III Digital Refractometer (±0.01% TDS)',
      'Pentair Reverse-Osmosis + MgSO4 / NaHCO3 Dosing Rig',
    ],
  },
  {
    category: 'Ceramic Kiln & CNC Brass Works',
    items: [
      'Citizen Cincom L20 Swiss-Type CNC Lathe (C36000 Brass)',
      'Arita 1,300°C Gas Reduction Porcelain Kiln Partner',
      'Mashiko Wood-Fired Stoneware Wheel Studio',
      'Blender 4.2 + glTF 2.0 Procedural PBR Pipeline',
    ],
  },
];

export const engagementModels = [
  {
    code: 'ALLOCATION 01 // SINGLE-ORIGIN',
    duration: '$46 · BI-WEEKLY DISPATCH',
    title: 'Roaster Reserve Subscription (2 x 250g)',
    ctaLabel: 'Subscribe Roaster Reserve ($46) →',
    ctaHref: 'mailto:lab@kobo-roast.studio?subject=Roaster%20Reserve%20Subscription%20(%2446)',
    summary:
      'Two 250 g nitrogen-flushed pouches of our current seasonal micro-lots roasted every Monday in Kyoto and Portland, complete with Loring S15 telemetry cards and water recipes.',
    includes: [
      'Lot 01 Gedeb Worka Sakaro + Lot 02 Finca El Paraiso',
      'Printed VST Extraction & Grind Target Card',
      '2 Sachets of KOBO 38 ppm GH Remineralization Salts',
      'Priority Access to Geisha & Competition Auctions',
    ],
  },
  {
    code: 'ALLOCATION 02 // VESSEL KIT',
    duration: '$340 · IN STOCK (SHIPS 48H)',
    title: 'KOBO V-60 Porcelain & Copper Pour-Over Suite',
    ctaLabel: 'Order V-60 Porcelain Suite ($340) →',
    ctaHref: '/work/pourover-v60',
    summary:
      'Complete manual percolation kit combining our 16-rib Arita porcelain dripper, 600 mL borosilicate carafe, walnut collar, and Tsubame rose-copper gooseneck kettle.',
    includes: [
      'KOBO V-60 02 Arita Porcelain Dripper',
      '600 mL Borosilicate Server + Turned Walnut Collar',
      '700 mL Tsubame Rose-Copper Laminar Kettle',
      '100 Abaca High-Flow Oxygen-Bleached Paper Filters',
    ],
  },
  {
    code: 'ALLOCATION 03 // BESPOKE HARDWARE',
    duration: '$2,480 · BUILT TO ORDER (4 WKS)',
    title: 'KOBO L-01 Lever Espresso Commission',
    ctaLabel: 'Commission L-01 Build ($2,480) →',
    ctaHref: '/work/lever-l01',
    summary:
      'Serialized C36000 brass and American black walnut manual lever espresso machine calibrated on our Higashiyama test bench to your preferred pressure profile.',
    includes: [
      'Serialized KOBO L-01 Lever Machine (110V or 230V)',
      '58 mm Bottomless Walnut Portafilter + 20g Basket',
      '2x KOBO S-08 Mashiko Stoneware Cappuccino Cups',
      '1-on-1 Remote or In-Lab Extraction Calibration Session',
    ],
  },
];

export const tastingRooms = [
  {
    city: 'KYOTO // HIGASHIYAMA ROASTERY & BAR',
    code: 'LAB 01 · JP',
    address: '482 Minamimachi, Higashiyama-ku, Kyoto 605-0001',
    coordinates: '35.0037° N, 135.7785° E',
    hours: 'Wed to Mon · 08:00 to 17:30 JST (Roasting Tue)',
    waterSpec: 'GH 36 ppm · KH 16 ppm · pH 6.8 · 93.5°C',
    ctaLabel: 'Reserve Kyoto Tasting Flight (¥3,200) →',
    ctaHref: 'mailto:lab@kobo-roast.studio?subject=Kyoto%20Tasting%20Flight%20Reservation',
    note: 'Housed in a restored 1928 cedar machiya with a sunlit courtyard travertine bar, Loring S15 Falcon roastery, and 4-group KOBO L-01 lever station.',
  },
  {
    city: 'PORTLAND // SE DIVISION SENSORY LAB',
    code: 'LAB 02 · US',
    address: '3418 SE Division St, Portland, OR 97202',
    coordinates: '45.5048° N, 122.6305° W',
    hours: 'Daily · 07:30 to 16:30 PST (Cupping Fri 10:00)',
    waterSpec: 'GH 38 ppm · KH 18 ppm · pH 6.8 · 93.5°C',
    ctaLabel: 'RSVP Friday 10:00 Cupping / Bar Seat →',
    ctaHref: 'mailto:lab@kobo-roast.studio?subject=Portland%20Friday%20Cupping%20RSVP',
    note: 'South-facing glass corner studio featuring custom white-oak communal tables, public Friday SCA cupping flights, and hardware calibration pick-up.',
  },
];
