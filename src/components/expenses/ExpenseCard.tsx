"use client";

import { Pencil, Trash2, Users, RefreshCw, CreditCard } from "lucide-react";
import { CATEGORY_ICONS, type Expense } from "@/types";
import type { PaymentMethod } from "@/types";
import { getMonthlyAmount, getCurrentInstallment } from "@/lib/services/expense-service";

interface ExpenseCardProps {
  expense: Expense;
  paymentMethod?: PaymentMethod;
  month: number;
  year: number;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCard({
  expense,
  paymentMethod,
  month,
  year,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const monthlyAmount = getMonthlyAmount(expense, month, year);
  const currentInstallment = getCurrentInstallment(expense, month, year);
  const icon = CATEGORY_ICONS[expense.category] || "📦";
  const perPerson = expense.is_shared && expense.split_count > 1
    ? monthlyAmount
    : null;

  return (
    <div className="group flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-2xl transition-all duration-200">
      {/* Ícono de categoría */}
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl">
        {icon}
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-100 truncate">{expense.title}</p>
          {/* Badges */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {expense.is_subscription && (
              <span className="flex items-center gap-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full">
                <RefreshCw className="w-2.5 h-2.5" />
                Suscripción
              </span>
            )}
            {currentInstallment !== null && (
              <span className="flex items-center gap-0.5 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                <CreditCard className="w-2.5 h-2.5" />
                {currentInstallment}/{expense.installments_total}
              </span>
            )}
            {expense.is_shared && (
              <span className="flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                <Users className="w-2.5 h-2.5" />
                x{expense.split_count}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-500">{expense.category}</span>
          {paymentMethod && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-500">{paymentMethod.name}</span>
            </>
          )}
        </div>
      </div>

      {/* Monto */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-zinc-100 font-mono">
          ${monthlyAmount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
        </p>
        {perPerson !== null && (
          <p className="text-[10px] text-emerald-400 font-mono">
            tu parte
          </p>
        )}
        {expense.installments_total > 1 && !expense.is_subscription && (
          <p className="text-[10px] text-zinc-500 font-mono">
            total: ${expense.amount.toLocaleString("es-AR")}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(expense)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5 text-zinc-400 hover:text-violet-400" />
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="p-2 rounded-lg hover:bg-rose-500/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-rose-400" />
        </button>
      </div>
    </div>
  );
}
