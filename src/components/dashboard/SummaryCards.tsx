"use client";

import { DollarSign, RefreshCw, CreditCard, Users } from "lucide-react";

interface SummaryCardsProps {
  monthlyTotal: number;
  subscriptionTotal: number;
  subscriptionCount: number;
  installmentsTotal: number;
  installmentsCount: number;
  sharedCount: number;
}

export function SummaryCards({
  monthlyTotal,
  subscriptionTotal,
  subscriptionCount,
  installmentsTotal,
  installmentsCount,
  sharedCount,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Total del Mes",
      value: monthlyTotal,
      icon: DollarSign,
      gradient: "from-violet-500/20 to-indigo-500/20",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/20",
    },
    {
      label: "Suscripciones",
      value: subscriptionTotal,
      count: subscriptionCount,
      icon: RefreshCw,
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
    },
    {
      label: "Cuotas Vigentes",
      value: installmentsTotal,
      count: installmentsCount,
      icon: CreditCard,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Compartidos",
      value: null,
      count: sharedCount,
      icon: Users,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} backdrop-blur-sm p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg bg-white/5 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">{card.label}</span>
            </div>

            {card.value !== null ? (
              <p className="text-xl font-bold text-zinc-100 font-mono">
                ${card.value.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </p>
            ) : null}

            {card.count !== undefined && (
              <p className={`text-sm ${card.value !== null ? "text-zinc-500 mt-0.5" : "text-2xl font-bold text-zinc-100"}`}>
                {card.value !== null ? `${card.count} activos` : card.count}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
