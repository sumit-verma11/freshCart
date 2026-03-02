"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Side = "top" | "bottom" | "left" | "right";

interface Props {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: Side;
  maxWidth?: number;
}

const POS: Record<Side, string> = {
  top:    "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left:   "right-full top-1/2 -translate-y-1/2 mr-2",
  right:  "left-full top-1/2 -translate-y-1/2 ml-2",
};

const ARROW: Record<Side, string> = {
  top:    "top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900 dark:border-t-gray-700",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900 dark:border-b-gray-700",
  left:   "left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900 dark:border-l-gray-700",
  right:  "right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900 dark:border-r-gray-700",
};

const Y_OFFSET: Record<Side, number> = { top: 4, bottom: -4, left: 0, right: 0 };
const X_OFFSET: Record<Side, number> = { top: 0, bottom: 0, left: 4, right: -4 };

export default function Tooltip({ content, children, side = "top", maxWidth = 200 }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: Y_OFFSET[side], x: X_OFFSET[side] }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: Y_OFFSET[side], x: X_OFFSET[side] }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            style={{ maxWidth }}
            className={`pointer-events-none absolute z-[70] whitespace-normal
                        text-[11px] font-medium text-white
                        bg-gray-900/95 dark:bg-gray-700/95
                        rounded-xl px-2.5 py-1.5 shadow-xl leading-snug
                        backdrop-blur-sm ${POS[side]}`}
          >
            {content}
            {/* Arrow */}
            <span
              className={`absolute border-4 ${ARROW[side]}`}
              aria-hidden="true"
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
