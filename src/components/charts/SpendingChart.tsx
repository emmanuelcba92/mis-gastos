"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CATEGORY_COLORS } from "@/types";

interface SpendingChartProps {
  categoryBreakdown: { category: string; amount: number }[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-white/10 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-xs text-zinc-400">{payload[0].name}</p>
        <p className="text-sm font-bold text-zinc-100 font-mono">
          ${payload[0].value.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </p>
      </div>
    );
  }
  return null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLegend = ({ payload }: any) => {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[11px] text-zinc-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// Generador de colores consistentes para categorías personalizadas
const getCategoryColor = (category: string) => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  
  // Hash string to number
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color (keeping saturation and lightness for dark mode theme)
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
};

export function SpendingChart({ categoryBreakdown }: SpendingChartProps) {
  const data = useMemo(() => {
    return categoryBreakdown.map((item) => ({
      name: item.category,
      value: Math.round(item.amount * 100) / 100,
      color: getCategoryColor(item.category),
    }));
  }, [categoryBreakdown]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-zinc-600 text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
