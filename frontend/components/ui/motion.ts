import { Variants } from 'framer-motion';

export const springTransition = {
  type: "spring" as const,
  damping: 25,
  stiffness: 200,
};

export const smoothTransition = {
  type: "tween" as const,
  ease: [0.25, 0.1, 0.25, 1] as const,
  duration: 0.3,
};

export const hoverVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, transition: springTransition },
  tap: { scale: 0.98, transition: springTransition },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: smoothTransition },
  exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.2 } },
};

export const drawerVariants: Variants = {
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: springTransition },
  exit: { x: '100%', opacity: 0, transition: springTransition },
};

export const tooltipVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 5 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.9, y: 5, transition: { duration: 0.1 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};
