import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, PackageCheck, Users, TrendingUp } from "lucide-react";

const ICONS = {
  sale: ShoppingCart,
  stock: PackageCheck,
  customer: Users,
  profit: TrendingUp,
};

const COLORS = {
  sale: { bg: "rgba(6,182,212,0.16)", fg: "#06b6d4" },
  stock: { bg: "rgba(245,158,11,0.16)", fg: "#f59e0b" },
  customer: { bg: "rgba(139,92,246,0.16)", fg: "#8b5cf6" },
  profit: { bg: "rgba(16,185,129,0.16)", fg: "#10b981" },
};

/**
 * LiveToasts — floating "live activity" notifications.
 * Cycles through the given items, popping each one in/out around the
 * hero mockup (alternating corners) to make the product feel alive.
 * Purely decorative: pointer-events are disabled and it is aria-hidden.
 *
 * item shape: { type: 'sale'|'stock'|'customer'|'profit', title, sub }
 */
export default function LiveToasts({ items = [], interval = 3400 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items.length, interval]);

  if (!items.length) return null;

  const item = items[index % items.length];
  const Icon = ICONS[item.type] || ShoppingCart;
  const c = COLORS[item.type] || COLORS.sale;

  const position =
    index % 2 === 0
      ? { top: "-1.1rem", insetInlineStart: "-0.75rem" }
      : { bottom: "1.4rem", insetInlineEnd: "-0.75rem" };

  return (
    <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.94 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", ...position }}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700/70 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3.5 py-2.5 shadow-lg shadow-slate-900/10 dark:shadow-black/40"
        >
          <span
            style={{ background: c.bg, color: c.fg }}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          >
            <Icon size={15} />
          </span>
          <span className="flex flex-col">
            <b className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">{item.title}</b>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{item.sub}</span>
          </span>
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 ms-1 shrink-0"
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
