"use client";

import { Expense, CATEGORY_ICONS } from "@/types";
import type { PaymentMethod } from "@/types";
import { getMonthlyAmount, getCurrentInstallment } from "@/lib/services/expense-service";
import { Inbox, Pencil, Trash2, Users, RefreshCw, CreditCard } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  paymentMethods: PaymentMethod[];
  month: number;
  year: number;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseList({
  expenses,
  paymentMethods,
  month,
  year,
  onEdit,
  onDelete,
}: ExpenseListProps) {
  const getPaymentMethod = (id: string) => paymentMethods.find((pm) => pm.id === id);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-inner">
          <Inbox className="w-10 h-10 text-zinc-600" />
        </div>
        <h3 className="text-xl font-bold text-zinc-300 mb-2">Sin gastos este mes</h3>
        <p className="text-zinc-500 max-w-sm mx-auto">
          Tocá el botón <strong className="text-violet-400">NUEVO GASTO</strong> para empezar a organizar tu dinero.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="border-b border-white/10 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-black/20">
            <th className="px-6 py-4 rounded-tl-3xl">Fecha</th>
            <th className="px-6 py-4">Nombre</th>
            <th className="px-6 py-4">Categoría</th>
            <th className="px-6 py-4">Pago</th>
            <th className="px-6 py-4">Cuotas</th>
            <th className="px-6 py-4 text-right">Monto Cuota</th>
            <th className="px-6 py-4 text-right">Total</th>
            <th className="px-6 py-4 text-right rounded-tr-3xl">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {expenses.map((expense) => {
            const pm = getPaymentMethod(expense.payment_method_id);
            const monthlyAmount = getMonthlyAmount(expense, month, year);
            const currentInstallment = getCurrentInstallment(expense, month, year);
            const icon = CATEGORY_ICONS[expense.category] || "📦";
            const dateStr = expense.start_date.toDate().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });

            return (
              <tr key={expense.id} className="hover:bg-white/[0.04] transition-colors group">
                {/* Fecha */}
                <td className="px-6 py-4 text-sm text-zinc-400 font-mono">
                  {dateStr}
                </td>

                {/* Nombre */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-100">{expense.title}</span>
                    {expense.is_shared && (
                      <span className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" /> Compartido: {expense.split_count} personas
                      </span>
                    )}
                  </div>
                </td>

                {/* Categoría */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    <span className="text-sm text-zinc-300">{expense.category}</span>
                  </div>
                </td>

                {/* Método de Pago */}
                <td className="px-6 py-4">
                  <span className="text-sm text-zinc-400">
                    {pm ? pm.name : "—"}
                  </span>
                </td>

                {/* Cuotas */}
                <td className="px-6 py-4">
                  {expense.is_subscription ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                      <RefreshCw className="w-3 h-3" /> Suscripción
                    </span>
                  ) : currentInstallment !== null ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium font-mono">
                      <CreditCard className="w-3 h-3" /> {currentInstallment}/{expense.installments_total}
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-600">—</span>
                  )}
                </td>

                {/* Monto Cuota (Mensual) */}
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-zinc-100 font-mono">
                      ${monthlyAmount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                    </span>
                    {expense.is_shared && expense.split_count > 1 && (
                      <span className="text-[10px] text-zinc-500">tu parte</span>
                    )}
                  </div>
                </td>

                {/* Monto Total */}
                <td className="px-6 py-4 text-right text-sm text-zinc-500 font-mono">
                  ${expense.amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                </td>

                {/* Acciones */}
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(expense)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-300 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(expense.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
