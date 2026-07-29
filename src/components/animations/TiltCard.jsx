import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * TiltCard — interactive 3D tilt wrapper.
 * The card smoothly tilts toward the cursor (spring-damped) and gently
 * floats up & down while idle, giving mockups a "alive" premium feel.
 * Touch devices simply get the floating animation (mouse events no-op).
 */
export default function TiltCard({ children, max = 7, float = true, className = "" }) {
  const ref = useRef(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 160, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 160, damping: 18 });

  const handleMouseMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        animate={float ? { y: [0, -7, 0] } : undefined}
        transition={float ? { duration: 5.5, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}
