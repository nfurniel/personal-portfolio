import { motion, useReducedMotion } from 'motion/react';

const DEFAULT_VARIANTS = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)' }
};

export const Reveal = ({
  children,
  as: Tag = 'div',
  delay = 0,
  y = 40,
  duration = 0.7,
  once = true,
  amount = 0.25,
  className,
  style
}) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag] || motion.div;

  if (reduce) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, amount }}
      transition={{ duration, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  );
};

export const StaggerGroup = ({
  children,
  as: Tag = 'div',
  className,
  style,
  staggerChildren = 0.08,
  delayChildren = 0.1,
  once = true,
  amount = 0.2
}) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag] || motion.div;

  if (reduce) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren, delayChildren } }
      }}
    >
      {children}
    </MotionTag>
  );
};

export const StaggerItem = ({ children, as: Tag = 'div', className, style, y = 32 }) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[Tag] || motion.div;

  if (reduce) {
    return (
      <Tag className={className} style={style}>
        {children}
      </Tag>
    );
  }

  const variants = {
    hidden: { opacity: 0, y, filter: 'blur(6px)' },
    show: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <MotionTag className={className} style={style} variants={variants}>
      {children}
    </MotionTag>
  );
};

export default Reveal;
