"use client";

import { DollarSign, RefreshCw, CreditCard, Users } from "lucide-react";

interface SummaryCardsProps {
  monthlyTotal: number;
  monthlyTotalUSD?: number;
  subscriptionTotal: number;
  subscriptionTotalUSD?: number;
  subscriptionCount: number;
  installmentsTotal: number;
  installmentsTotalUSD?: number;
  installmentsCount: number;
  sharedCount: number;
}

export function SummaryCards({
  monthlyTotal,
  monthlyTotalUSD = 0,
  subscriptionTotal,
  subscriptionTotalUSD = 0,
  subscriptionCount,
  installmentsTotal,
  installmentsTotalUSD = 0,
  installmentsCount,
  sharedCount,
}: SummaryCardsProps) {
  const cards = [
    {
      label: "Total del Mes",
      value: monthlyTotal,
      valueUSD: monthlyTotalUSD,
      icon: DollarSign,
      gradient: "from-violet-500/20 to-indigo-500/20",
      iconColor: "text-violet-400",
      borderColor: "border-violet-500/20",
    },
    {
      label: "Suscripciones",
      value: subscriptionTotal,
      valueUSD: subscriptionTotalUSD,
      count: subscriptionCount,
      icon: RefreshCw,
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/20",
    },
    {
      label: "Cuotas Vigentes",
      value: installmentsTotal,
      valueUSD: installmentsTotalUSD,
      count: installmentsCount,
      icon: CreditCard,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Compartidos",
      value: null,
      valueUSD: 0,
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
            className={`rounded-2xl border ${card.borderColor} bg-gradient-to-br ${card.gradient} backdrop-blur-sm p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 flex flex-col`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 rounded-lg bg-white/5 ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-zinc-400 font-medium">{card.label}</span>
            </div>

            <div className="flex flex-col gap-1 mt-auto">
              {card.value !== null ? (
                <p className="text-xl font-bold text-zinc-100 font-mono">
                  ${card.value.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </p>
              ) : null}

              {card.valueUSD > 0 && (
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  u$s {card.valueUSD.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}

              {card.count !== undefined && (
                <p className={`text-sm ${card.value !== null || card.valueUSD > 0 ? "text-zinc-500 mt-0.5" : "text-2xl font-bold text-zinc-100"}`}>
                  {card.value !== null || card.valueUSD > 0 ? `${card.count} activos` : card.count}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
