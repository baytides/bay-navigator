import { motion } from 'motion/react';

interface AnimatedLoaderProps {
  className?: string;
}

export default function AnimatedLoader({ className = '' }: AnimatedLoaderProps) {
  return (
    <motion.svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" strokeOpacity="0.25" />
      <motion.path d="M12 2a10 10 0 0 1 10 10" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
}
