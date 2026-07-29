import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

/**
 * CountUp — animated number.
 * Whenever `value` changes, the displayed number rolls smoothly from the
 * previous value to the new one (odometer feel). Pass a `format` function
 * to control rendering (e.g. currency formatting).
 */
export default function CountUp({ value, format, duration = 0.9, className = "" }) {
  const fmt = format || ((v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{fmt(display)}</span>;
}
