"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  /** Pull distance in px to trigger refresh (default 72) */
  threshold?: number;
}

interface UsePullToRefreshResult {
  isPulling: boolean;
  /** 0 – 1 progress toward threshold */
  pullProgress: number;
  isRefreshing: boolean;
}

/**
 * Detects a downward pull gesture when the page is already scrolled to the top,
 * then calls onRefresh and shows a spinner.
 *
 * Attach nothing to the DOM — the hook uses window-level touch events.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 72,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const [isPulling, setIsPulling]       = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startY    = useRef(0);
  const pulling   = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY !== 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) { setIsPulling(false); setPullProgress(0); return; }
    // Prevent native scroll bounce on iOS while pulling
    if (window.scrollY === 0 && delta > 4) {
      e.preventDefault();
    }
    setIsPulling(true);
    setPullProgress(Math.min(delta / threshold, 1));
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullProgress >= 1) {
      setIsRefreshing(true);
      setIsPulling(false);
      setPullProgress(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setIsPulling(false);
      setPullProgress(0);
    }
  }, [pullProgress, onRefresh]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove",  handleTouchMove,  { passive: false });
    window.addEventListener("touchend",   handleTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove",  handleTouchMove);
      window.removeEventListener("touchend",   handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isPulling, pullProgress, isRefreshing };
}
