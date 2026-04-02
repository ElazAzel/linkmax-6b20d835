'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getLucideIcon } from '@/lib/utils/icon-utils';
import type { BlockType } from '@/types/page';
import { cn } from '@/lib/utils/utils';

interface AnimatedBlockIconProps {
  type: BlockType | string;
  icon: string;
  className?: string;
  delayOffset?: number; // For organic feel
}

export const AnimatedBlockIcon = ({ 
  type, 
  icon, 
  className,
  delayOffset = Math.random() * 0.5 
}: AnimatedBlockIconProps) => {
  const IconComponent = useMemo(() => getLucideIcon(icon), [icon]);

  // Specific animations for certain block types
  switch (type) {
    case 'text':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: delayOffset }}
            className="flex items-baseline font-black text-2xl"
          >
            <span>T</span>
            <motion.span
              style={{ fontSize: '0.6em', marginLeft: '1px' }}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: [0, 1, 1, 0] }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                times: [0, 0.2, 0.8, 1],
                delay: delayOffset 
              }}
              className="overflow-hidden whitespace-nowrap"
            >
              ext
            </motion.span>
          </motion.div>
        </div>
      );

    case 'pricing':
    case 'product':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full relative z-10" />
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute text-white/40 font-bold"
              style={{ fontSize: '0.8rem' }}
              initial={{ y: 0, x: 0, opacity: 0, scale: 0.5 }}
              animate={{ 
                y: [-10, -30], 
                x: [0, (i - 2) * 15], 
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.8]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: delayOffset + (i * 0.4),
                ease: "easeOut"
              }}
            >
              $
            </motion.div>
          ))}
        </div>
      );

    case 'countdown':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-full w-full"
          >
            <circle cx="12" cy="12" r="10" />
            <motion.line
              x1="12" y1="12" x2="12" y2="6"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: delayOffset }}
              style={{ originX: "12px", originY: "12px" }}
            />
            <motion.line
              x1="12" y1="12" x2="16" y2="12"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear", delay: delayOffset }}
              style={{ originX: "12px", originY: "12px" }}
            />
          </svg>
        </div>
      );

    case 'video':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full" />
          <motion.div
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "steps(1)", delay: delayOffset }}
          />
        </div>
      );

    case 'messenger':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full" />
          <div className="absolute inset-0 flex items-center justify-center gap-0.5 mt-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-white"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: delayOffset + (i * 0.2) 
                }}
              />
            ))}
          </div>
        </div>
      );

    case 'map':
      return (
        <motion.div 
          className={cn("flex items-center justify-center", className)}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: delayOffset }}
        >
          <IconComponent className="h-full w-full" />
        </motion.div>
      );

    case 'form':
      return (
        <div className={cn("relative flex flex-col items-center justify-center p-1", className)}>
          <IconComponent className="h-full w-full opacity-40" />
          <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-4 pt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1 rounded-full bg-white/80"
                initial={{ width: "20%" }}
                animate={{ width: ["20%", "80%", "20%"] }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: delayOffset + (i * 0.5),
                  ease: "easeInOut" 
                }}
              />
            ))}
          </div>
        </div>
      );

    case 'separator':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <motion.div
            className="h-0.5 bg-white rounded-full"
            initial={{ width: "40%" }}
            animate={{ width: ["40%", "80%", "40%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: delayOffset }}
          />
        </div>
      );

    case 'socials':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: delayOffset }}
          >
            <IconComponent className="h-full w-full" />
          </motion.div>
        </div>
      );

    case 'image':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: delayOffset }}
          />
        </div>
      );

    case 'carousel':
      return (
        <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
          <motion.div
            className="flex gap-1"
            animate={{ x: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: delayOffset }}
          >
            <IconComponent className="h-full w-full shrink-0" />
            <IconComponent className="h-full w-full shrink-0 opacity-50" />
          </motion.div>
        </div>
      );

    case 'faq':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: delayOffset }}
          >
            <IconComponent className="h-full w-full" />
          </motion.div>
        </div>
      );

    case 'shoutout':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full relative z-10" />
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 border-2 border-white/40 rounded-full"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 2], opacity: [0.5, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: delayOffset + (i * 0.7),
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      );

    case 'community':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full" />
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ 
                top: i === 1 ? '-20%' : '10%', 
                right: i === 1 ? '0%' : '-20%',
                fontSize: '0.6rem'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1, 0.8], opacity: [0, 1, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                delay: delayOffset + (i * 1),
                ease: "backOut"
              }}
            >
              👤
            </motion.div>
          ))}
        </div>
      );

    case 'scratch':
      return (
        <motion.div
          className={cn("flex items-center justify-center", className)}
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 0.3, repeat: Infinity, delay: delayOffset }}
        >
          <IconComponent className="h-full w-full" />
        </motion.div>
      );

    case 'calendar':
    case 'event':
    case 'booking':
      return (
        <div className={cn("relative flex items-center justify-center", className)}>
          <IconComponent className="h-full w-full" />
          <motion.div
            className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-sm"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              repeatDelay: 1,
              delay: delayOffset 
            }}
          />
        </div>
      );

    // Default fallback case with subtle floating/breathing
    default:
      return (
        <motion.div
          className={cn("flex items-center justify-center", className)}
          animate={{ 
            y: [0, -2, 0],
            rotate: [0, 1, -1, 0],
            scale: [1, 1.03, 1]
          }}
          transition={{ 
            duration: 4 + Math.random() * 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: delayOffset
          }}
        >
          <IconComponent className="h-full w-full" />
        </motion.div>
      );
  }
};
