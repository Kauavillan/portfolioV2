"use client";

import {
  motion,
  type HTMLMotionProps,
  type Transition,
  type ViewportOptions,
} from "framer-motion";

export const DEFAULT_VIEWPORT: ViewportOptions = {
  once: true,
  amount: 0.4,
};

export const DEFAULT_TRANSITION: Transition = {
  duration: 0.6,
  ease: "easeOut",
};

function mergeTransition(transition?: Transition): Transition {
  if (!transition) return DEFAULT_TRANSITION;
  return { ...DEFAULT_TRANSITION, ...transition };
}

function mergeViewport(viewport?: ViewportOptions): ViewportOptions {
  if (!viewport) return DEFAULT_VIEWPORT;
  return { ...DEFAULT_VIEWPORT, ...viewport };
}

export type MotionDivProps = HTMLMotionProps<"div">;
export type MotionH2Props = HTMLMotionProps<"h2">;
export type MotionSpanProps = HTMLMotionProps<"span">;
export type MotionH3Props = HTMLMotionProps<"h3">;
export type MotionStrongProps = HTMLMotionProps<"strong">;

function MotionDiv({ transition, viewport, ...rest }: MotionDivProps) {
  return (
    <motion.div
      {...rest}
      transition={mergeTransition(transition)}
      viewport={mergeViewport(viewport)}
    />
  );
}

function MotionH2({ transition, viewport, ...rest }: MotionH2Props) {
  return (
    <motion.h2
      {...rest}
      transition={mergeTransition(transition)}
      viewport={mergeViewport(viewport)}
    />
  );
}

function MotionSpan({ transition, viewport, ...rest }: MotionSpanProps) {
  return (
    <motion.span
      {...rest}
      transition={mergeTransition(transition)}
      viewport={mergeViewport(viewport)}
    />
  );
}

function MotionH3({ transition, viewport, ...rest }: MotionH3Props) {
  return (
    <motion.h3
      {...rest}
      transition={mergeTransition(transition)}
      viewport={mergeViewport(viewport)}
    />
  );
}

function MotionStrong({ transition, viewport, ...rest }: MotionStrongProps) {
  return (
    <motion.strong
      {...rest}
      transition={mergeTransition(transition)}
      viewport={mergeViewport(viewport)}
    />
  );
}

const Motion = {
  div: MotionDiv,
  h2: MotionH2,
  span: MotionSpan,
  h3: MotionH3,
  strong: MotionStrong,
} as const;

export default Motion;

export { MotionDiv, MotionH2, MotionSpan, MotionH3, MotionStrong };
