import { motion } from 'motion/react';

interface AnimatedInfoProps {
  className?: string;
}

export default function AnimatedInfo({ className = '' }: AnimatedInfoProps) {
  return (
    <motion.svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 15,
      }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      <motion.line
        x1="12"
        y1="16"
        x2="12"
        y2="12"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      />
      <motion.circle
        cx="12"
        cy="8"
        r="0.5"
        fill="currentColor"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.4 }}
      />
    </motion.svg>
  );
}
