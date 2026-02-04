import { motion } from 'motion/react';

interface AnimatedShareProps {
  className?: string;
}

export default function AnimatedShare({ className = '' }: AnimatedShareProps) {
  return (
    <motion.svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.circle
        cx="18"
        cy="5"
        r="3"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0 }}
      />
      <motion.circle
        cx="6"
        cy="12"
        r="3"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      />
      <motion.circle
        cx="18"
        cy="19"
        r="3"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      />
      <motion.line
        x1="8.59"
        y1="13.51"
        x2="15.42"
        y2="17.49"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      />
      <motion.line
        x1="15.41"
        y1="6.51"
        x2="8.59"
        y2="10.49"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />
    </motion.svg>
  );
}
