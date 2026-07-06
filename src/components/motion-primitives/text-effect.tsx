/**
 * TextEffect — Motion Primitives (https://motion-primitives.com/docs/text-effect).
 *
 * Hand-placed on `motion` (the library's own engine) because the motion-primitives
 * registry was rate-limiting (HTTP 429) at build time; the public API is kept
 * identical so it can be swapped for the registry version later without changes.
 */
"use client";

import React from "react";
import {
  AnimatePresence,
  motion,
  type Transition,
  type Variants,
} from "motion/react";

export type PresetType = "blur" | "fade-in-blur" | "scale" | "fade" | "slide";
export type PerType = "word" | "char" | "line";

type TextEffectProps = {
  children: string;
  per?: PerType;
  as?: keyof React.JSX.IntrinsicElements;
  variants?: { container?: Variants; item?: Variants };
  className?: string;
  preset?: PresetType;
  delay?: number;
  speedReveal?: number;
  speedSegment?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  segmentWrapperClassName?: string;
  containerTransition?: Transition;
  segmentTransition?: Transition;
  style?: React.CSSProperties;
};

const defaultStaggerTimes: Record<PerType, number> = {
  char: 0.03,
  word: 0.05,
  line: 0.1,
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(12px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
      exit: { opacity: 0, filter: "blur(12px)" },
    },
  },
  "fade-in-blur": {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20, filter: "blur(12px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, y: 20, filter: "blur(12px)" },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  },
};

const AnimationComponent = React.memo(function AnimationComponent({
  segment,
  variants,
  per,
  segmentWrapperClassName,
}: {
  segment: string;
  variants: Variants;
  per: PerType;
  segmentWrapperClassName?: string;
}) {
  const content =
    per === "line" ? (
      <motion.span variants={variants} className="block">
        {segment}
      </motion.span>
    ) : per === "word" ? (
      <motion.span variants={variants} className="inline-block whitespace-pre">
        {segment}
      </motion.span>
    ) : (
      <motion.span className="inline-block whitespace-pre">
        {segment.split("").map((char, i) => (
          <motion.span key={`char-${i}`} variants={variants} className="inline-block whitespace-pre">
            {char}
          </motion.span>
        ))}
      </motion.span>
    );

  if (!segmentWrapperClassName) return content;
  const defaultWrapperClassName = per === "line" ? "block" : "inline-block";
  return <span className={`${defaultWrapperClassName} ${segmentWrapperClassName}`}>{content}</span>;
});

export function TextEffect({
  children,
  per = "word",
  as = "p",
  variants,
  className,
  preset = "fade",
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  trigger = true,
  onAnimationComplete,
  segmentWrapperClassName,
  containerTransition,
  segmentTransition,
  style,
}: TextEffectProps) {
  const segments = per === "line" ? children.split("\n") : children.split(/(\s+)/);

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  const baseVariants = preset ? presetVariants[preset] : { container: defaultContainerVariants, item: defaultItemVariants };
  const stagger = defaultStaggerTimes[per] / speedReveal;

  const baseDuration = 0.3 / speedSegment;

  const customStagger = variants?.container?.visible && "transition" in variants.container.visible ? undefined : stagger;

  const computedContainer: Variants = {
    ...baseVariants.container,
    visible: {
      ...baseVariants.container.visible,
      transition: {
        ...(customStagger !== undefined ? { staggerChildren: customStagger, delayChildren: delay } : {}),
        ...containerTransition,
        ...(typeof variants?.container?.visible === "object" && "transition" in variants.container.visible
          ? variants.container.visible.transition
          : {}),
      },
    },
    ...variants?.container,
  };

  const computedItem: Variants = {
    ...baseVariants.item,
    ...variants?.item,
    visible: {
      ...baseVariants.item.visible,
      ...variants?.item?.visible,
      transition: {
        duration: baseDuration,
        ...segmentTransition,
      },
    },
  };

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={computedContainer}
          className={className}
          onAnimationComplete={onAnimationComplete}
          style={style}
        >
          {segments.map((segment, index) => (
            <AnimationComponent
              key={`${per}-${index}-${segment}`}
              segment={segment}
              variants={computedItem}
              per={per}
              segmentWrapperClassName={segmentWrapperClassName}
            />
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}

export default TextEffect;
