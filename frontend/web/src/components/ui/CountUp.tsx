import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { formatNumber } from "../../lib/format";

/**
 * Angka berhitung naik sekali saat terlihat. Menghormati prefers-reduced-motion
 * dan memakai requestAnimationFrame agar tidak memicu render berlebihan.
 */
export function CountUp({
  value,
  duration = 900,
  format = formatNumber,
  className,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const node = elementRef.current;
    if (!node) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let startedAt = 0;

    const animate = (timestamp: number) => {
      if (!startedAt) startedAt = timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      frame = window.requestAnimationFrame(animate);
    };

    if (!("IntersectionObserver" in window)) {
      start();
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [value, duration, reduceMotion]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {format(display)}
      {suffix}
    </span>
  );
}
