"use client";

import { useState, useEffect } from "react";

const PHRASES = [
  "in 2 Hours",
  "at Your Doorstep",
  "Fresh Every Day",
  "Across the City",
];

export default function AnimatedHeroText() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="text-secondary inline-block transition-all duration-300"
      style={{
        opacity:   visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
    >
      {PHRASES[idx]}
    </span>
  );
}
