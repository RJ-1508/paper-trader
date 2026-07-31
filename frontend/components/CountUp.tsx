"use client";
import { useEffect, useRef, useState } from "react";

const DURATION_MS = 600;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

type CountUpProps = {
  value: number;
  format?: (value: number) => string;
};

export default function CountUp({ value, format = (v) => v.toLocaleString() }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const from = displayRef.current;
    let frame: number;

    const tick = (now: number) => {
      const next = reduceMotion ? value : from + (value - from) * easeOut(Math.min((now - start) / DURATION_MS, 1));
      setDisplay(next);
      displayRef.current = next;
      if (!reduceMotion && now - start < DURATION_MS) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="font-mono tabular-nums">{format(display)}</span>;
}
