import { motion } from 'motion/react';

interface AnimatedSearchProps {
  isActive?: boolean;
  className?: string;
}

export default function AnimatedSearch({ isActive = false, className = '' }: AnimatedSearchProps) {
  return (
    <motion.svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
    >
      <motion.circle
        cx="11"
        cy="11"
        r="8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.path
        d="M21 21l-4.35-4.35"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
      />
    </motion.svg>
  );
}
