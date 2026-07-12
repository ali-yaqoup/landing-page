import React from "react";
import { Zap, AlertCircle, Sparkles, Star, ChevronRight, LayoutDashboard, Settings } from "lucide-react";

/**
 * Re-exporting standard lucide icons with unified look or custom brand icons
 */

export const BrandLogo = ({ size = 24, className = "" }) => (
  <div className={`flex items-center justify-center bg-neutral-950 text-[#D2FF26] rounded-none shadow-[2px_2px_0px_0px_rgba(210,255,38,1)] border border-neutral-800 ${className}`} style={{ width: size + 8, height: size + 8 }}>
    <Zap size={size} className="text-[#D2FF26] fill-current" strokeWidth={2} />
  </div>
);

export { Zap, AlertCircle, Sparkles, Star, ChevronRight, LayoutDashboard, Settings };
