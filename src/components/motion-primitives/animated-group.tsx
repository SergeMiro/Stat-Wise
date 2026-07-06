/**
 * AnimatedGroup — Motion Primitives (https://motion-primitives.com/docs/animated-group).
 *
 * Hand-placed on `motion` because the motion-primitives registry was rate-limiting
 * (HTTP 429) at build time; the public API matches the registry component so it can
 * be swapped later without call-site changes.
 */
"use client";

import React from "react";
import { motion, type Variants } from "motion/react";

export type PresetType =
  | "fade"
  | "slide"
  | "scale"
  | "blur"
  | "blur-slide"
  | "zoom"
  | "flip";

type AnimatedGroupProps = {
  children: React.ReactNode;
  className?: string;
  variants?: { container?: Variants; item?: Variants };
  preset?: PresetType;
  as?: keyof React.JSX.IntrinsicElements;
  asChild?: keyof React.JSX.IntrinsicElements;
};

const defaultContainerVariants: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const presetVariants: Record<PresetType, Variants> = {
  fade: {},
  slide: {
    hidden: { y: 20 },
    visible: { y: 0 },
  },
  scale: {
    hidden: { scale: 0.8 },
    visible: { scale: 1 },
  },
  blur: {
    hidden: { filter: "blur(4px)" },
    visible: { filter: "blur(0px)" },
  },
  "blur-slide": {
    hidden: { filter: "blur(4px)", y: 20 },
    visible: { filter: "blur(0px)", y: 0 },
  },
  zoom: {
    hidden: { scale: 0.5 },
    visible: { scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } },
  },
  flip: {
    hidden: { rotateX: -90 },
    visible: { rotateX: 0, transition: { type: "spring", stiffness: 300, damping: 20 } },
  },
};

const addDefaultVariants = (variants: Variants): Variants => ({
  hidden: { ...defaultItemVariants.hidden, ...variants.hidden },
  visible: { ...defaultItemVariants.visible, ...variants.visible },
});

export function AnimatedGroup({
  children,
  className,
  variants,
  preset,
  as = "div",
  asChild = "div",
}: AnimatedGroupProps) {
  const selectedVariants = {
    item: addDefaultVariants(preset ? presetVariants[preset] : {}),
    container: addDefaultVariants(defaultContainerVariants),
  };
  const containerVariants = variants?.container || selectedVariants.container;
  const itemVariants = variants?.item || selectedVariants.item;

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  const MotionChild = motion[asChild as keyof typeof motion] as typeof motion.div;

  return (
    <MotionTag
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <MotionChild key={index} variants={itemVariants}>
          {child}
        </MotionChild>
      ))}
    </MotionTag>
  );
}

export default AnimatedGroup;
