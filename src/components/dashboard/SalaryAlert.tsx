"use client";

import { SALARY_STATUS_CONFIG, getSalaryStatus } from "@/types";

interface SalaryAlertProps {
  monthlyTotal: number;
  monthlySalary: number;
}

export function SalaryAlert({ monthlyTotal, monthlySalary }: SalaryAlertProps) {
  const status = getSalaryStatus(monthlyTotal, monthlySalary);
  const config = SALARY_STATUS_CONFIG[status];
  const percentage = monthlySalary > 0 ? Math.min((monthlyTotal / monthlySalary) * 100, 100) : 0;

  if (monthlySalary <= 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm p-4">
        <p className="text-sm text-zinc-400 text-center">
          Configurá tu sueldo mensual en{" "}
          <span className="text-violet-400 font-medium">Ajustes</span> para ver alertas de gasto
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-white/5 ${config.bgColor} backdrop-blur-sm p-5 transition-all duration-500`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.emoji}</span>
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
        </div>
        <span className={`text-sm font-mono font-bold ${config.color}`}>
          {percentage.toFixed(1)}% del sueldo
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            status === "green"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
              : status === "yellow"
              ? "bg-gradient-to-r from-amber-500 to-amber-400"
              : "bg-gradient-to-r from-rose-500 to-rose-400"
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-xs text-zinc-400">
        <span>
          ${monthlyTotal.toLocaleString("es-AR")} gastado
        </span>
        <span>
          ${monthlySalary.toLocaleString("es-AR")} sueldo
        </span>
      </div>
    </div>
  );
}
