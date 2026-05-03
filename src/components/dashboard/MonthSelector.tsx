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

  const goToToday = () => {
    const now = new Date();
    onChange(now.getMonth(), now.getFullYear());
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrev}
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200 active:scale-95"
      >
        <ChevronLeft className="w-4 h-4 text-zinc-400" />
      </button>

      <div className="flex items-center justify-center min-w-[180px] py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200 gap-1">
        <select
          value={month}
          onChange={(e) => onChange(parseInt(e.target.value, 10), year)}
          className="appearance-none bg-transparent text-base font-semibold text-zinc-100 focus:outline-none cursor-pointer [&>option]:bg-zinc-900 text-right"
        >
          {MONTH_NAMES.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        
        <select
          value={year}
          onChange={(e) => onChange(month, parseInt(e.target.value, 10))}
          className="appearance-none bg-transparent text-sm text-zinc-500 focus:outline-none cursor-pointer [&>option]:bg-zinc-900"
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const y = 2024 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>

        {isCurrentMonth() && (
          <span className="ml-1 text-[10px] bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full font-medium">
            HOY
          </span>
        )}
      </div>

      <button
        onClick={handleNext}
        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-200 active:scale-95"
      >
        <ChevronRight className="w-4 h-4 text-zinc-400" />
      </button>
    </div>
  );
}
