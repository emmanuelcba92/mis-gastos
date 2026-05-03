"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const handlePrev = () => {
    if (month === 0) {
      onChange(11, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      onChange(0, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return month === now.getMonth() && year === now.getFullYear();
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handlePrev}
        className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-all duration-300 active:scale-95 text-zinc-400 hover:text-violet-300 shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative group flex items-center justify-center min-w-[200px] py-2.5 px-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.02)] transition-all duration-300 gap-2 overflow-hidden">
        {/* Subtle hover glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <select
          value={month}
          onChange={(e) => onChange(parseInt(e.target.value, 10), year)}
          className="relative z-10 appearance-none bg-transparent text-lg font-bold text-zinc-100 focus:outline-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-base text-right tracking-tight"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        
        <select
          value={year}
          onChange={(e) => onChange(month, parseInt(e.target.value, 10))}
          className="relative z-10 appearance-none bg-transparent text-sm font-medium text-zinc-400 focus:outline-none cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-base"
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const y = 2024 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>

        {isCurrentMonth() && (
          <span className="relative z-10 ml-2 text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-violet-500/30">
            Hoy
          </span>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/10 border border-white/10 transition-all duration-300 active:scale-95 text-zinc-400 hover:text-violet-300 shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_15px_rgba(139,92,246,0.15)]"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
