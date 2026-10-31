import type { Transition, Variants } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

export const duration = {
  micro: 0.15,
  standard: 0.3,
  entrance: 0.6,
} as const;

export const springSoft: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export const transitions = {
  micro: { duration: duration.micro, ease: EASE } satisfies Transition,
  standard: { duration: duration.standard, ease: EASE } satisfies Transition,
  entrance: { duration: duration.entrance, ease: EASE } satisfies Transition,
  spring: springSoft,
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: EASE } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.entrance },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.standard },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.entrance },
};

export const viewportOnce = { once: true, margin: "-10%" } as const;

export const hoverLift = {
  y: -4,
  transition: transitions.micro,
} as const;
