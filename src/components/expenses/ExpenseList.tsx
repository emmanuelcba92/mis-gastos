"use client";

import { Expense } from "@/types";
import type { PaymentMethod } from "@/types";
import { ExpenseCard } from "./ExpenseCard";
import { Inbox } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-zinc-600" />
        </div>
        <h3 className="text-base font-semibold text-zinc-400 mb-1">Sin gastos este mes</h3>
        <p className="text-sm text-zinc-600 max-w-xs">
          Tocá el botón <span className="text-violet-400">+</span> para agregar tu primer gasto o suscripción
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          paymentMethod={getPaymentMethod(expense.payment_method_id)}
          month={month}
          year={year}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
