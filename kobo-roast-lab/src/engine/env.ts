export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isTouch = () => matchMedia('(hover: none), (pointer: coarse)').matches;
export const isMobile = () => matchMedia('(max-width: 767px)').matches;

// Shared easing vocabulary ("index and detent" mechanical precision).
export const ease = {
  out: 'expo.out', // default entrance & caliper snap
  inOut: 'expo.inOut', // shutter curtains, page transitions
  soft: 'power3.out', // micro-interactions & vernier detents
  spring: 'back.out(1.4)', // mechanical detent lock
} as const;
