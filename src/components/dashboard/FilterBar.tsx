"use client";

import { CATEGORIES, type Category, type ExpenseFilters } from "@/types";
import type { PaymentMethod } from "@/types";
import { CreditCard, Filter, X } from "lucide-react";

interface FilterBarProps {
  filters: ExpenseFilters;
  paymentMethods: PaymentMethod[];
  onFilterChange: (filters: Partial<ExpenseFilters>) => void;
}

export function FilterBar({ filters, paymentMethods, onFilterChange }: FilterBarProps) {
  const hasActiveFilters =
    filters.paymentMethodId || filters.category || (filters.type && filters.type !== "all");

  const clearFilters = () => {
    onFilterChange({
      paymentMethodId: undefined,
      category: undefined,
      type: "all",
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-zinc-500 text-xs mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Filtrar</span>
      </div>

      {/* Tipo de gasto */}
      <select
        value={filters.type || "all"}
        onChange={(e) =>
          onFilterChange({ type: e.target.value as ExpenseFilters["type"] })
        }
        className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-zinc-900"
      >
        <option value="all">Todos los tipos</option>
        <option value="subscription">🔄 Suscripciones</option>
        <option value="installments">💳 En cuotas</option>
        <option value="single">💵 Pago único</option>
      </select>

      {/* Método de pago */}
      <select
        value={filters.paymentMethodId || ""}
        onChange={(e) =>
          onFilterChange({ paymentMethodId: e.target.value || undefined })
        }
        className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-zinc-900"
      >
        <option value="">💳 Todos los medios</option>
        {paymentMethods.map((pm) => (
          <option key={pm.id} value={pm.id}>
            {pm.type === "credit_card" ? "💳" : pm.type === "debit" ? "🏧" : "💵"} {pm.name}
          </option>
        ))}
      </select>

      {/* Categoría */}
      <select
        value={filters.category || ""}
        onChange={(e) =>
          onFilterChange({ category: (e.target.value as Category) || undefined })
        }
        className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-colors [&>option]:bg-zinc-900"
      >
        <option value="">Todas las categorías</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Botón limpiar filtros */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1.5 rounded-lg transition-all duration-200"
        >
          <X className="w-3 h-3" />
          Limpiar
        </button>
      )}
    </div>
  );
}
