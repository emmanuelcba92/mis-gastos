"use client";

import { useState, useEffect, useMemo } from "react";
import type { Expense, ExpenseFilters } from "@/types";
import { subscribeToExpenses, getMonthlyAmount } from "@/lib/services/expense-service";
import { useAuth } from "@/contexts/AuthContext";

export function useExpenses(filters: ExpenseFilters) {
  const { user } = useAuth();
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Suscripción a todos los gastos del usuario
  useEffect(() => {
    if (!user) {
      setAllExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToExpenses(user.uid, (expenses) => {
      setAllExpenses(expenses);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [user]);

  // Filtrar gastos que aplican al mes/año seleccionado
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      // Filtro por método de pago
      if (filters.paymentMethodId && expense.payment_method_id !== filters.paymentMethodId) {
        return false;
      }

      // Filtro por categoría
      if (filters.category && expense.category !== filters.category) {
        return false;
      }

      // Filtro por tipo
      if (filters.type && filters.type !== "all") {
        if (filters.type === "subscription" && !expense.is_subscription) return false;
        if (filters.type === "installments" && (expense.is_subscription || expense.installments_total <= 1))
          return false;
        if (filters.type === "single" && (expense.is_subscription || expense.installments_total > 1))
          return false;
      }

      // Verificar si el gasto tiene impacto en este mes/año
      const monthlyAmount = getMonthlyAmount(expense, filters.month, filters.year);
      return monthlyAmount > 0;
    });
  }, [allExpenses, filters]);

  // Totales calculados ARS
  const monthlyTotal = useMemo(() => {
    return filteredExpenses
      .filter(e => e.currency !== "USD")
      .reduce((sum, exp) => sum + getMonthlyAmount(exp, filters.month, filters.year), 0);
  }, [filteredExpenses, filters.month, filters.year]);

  const monthlyTotalUSD = useMemo(() => {
    return filteredExpenses
      .filter(e => e.currency === "USD")
      .reduce((sum, exp) => sum + getMonthlyAmount(exp, filters.month, filters.year), 0);
  }, [filteredExpenses, filters.month, filters.year]);

  const subscriptionTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.is_subscription && e.currency !== "USD")
      .reduce((sum, exp) => sum + getMonthlyAmount(exp, filters.month, filters.year), 0);
  }, [filteredExpenses, filters.month, filters.year]);

  const subscriptionTotalUSD = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.is_subscription && e.currency === "USD")
      .reduce((sum, exp) => sum + getMonthlyAmount(exp, filters.month, filters.year), 0);
  }, [filteredExpenses, filters.month, filters.year]);

  const installmentsTotal = useMemo(() => {
    return filteredExpenses
      .filter((e) => !e.is_subscription && e.installments_total > 1 && e.currency !== "USD")
      .reduce((sum, exp) => sum + getMonthlyAmount(exp, filters.month, filters.year), 0);
  }, [filteredExpenses, filters.month, filters.year]);

  const installmentsTotalUSD = useMemo(() => {
    return filteredExpenses
      .filter((e) => !e.is_subscription && e.installments_total > 1 && e.currency === "USD")
      .reduce((sum, exp) => sum + getMonthlyAmount(exp, filters.month, filters.year), 0);
  }, [filteredExpenses, filters.month, filters.year]);

  const subscriptionCount = useMemo(() => {
    return filteredExpenses.filter((e) => e.is_subscription).length;
  }, [filteredExpenses]);

  const installmentsCount = useMemo(() => {
    return filteredExpenses.filter((e) => !e.is_subscription && e.installments_total > 1).length;
  }, [filteredExpenses]);

  const sharedCount = useMemo(() => {
    return filteredExpenses.filter((e) => e.is_shared).length;
  }, [filteredExpenses]);

  // Datos para gráficos: distribución por categoría
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredExpenses.forEach((exp) => {
      const amount = getMonthlyAmount(exp, filters.month, filters.year);
      breakdown[exp.category] = (breakdown[exp.category] || 0) + amount;
    });
    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, filters.month, filters.year]);

  return {
    expenses: filteredExpenses,
    allExpenses,
    monthlyTotal,
    monthlyTotalUSD,
    subscriptionTotal,
    subscriptionTotalUSD,
    installmentsTotal,
    installmentsTotalUSD,
    subscriptionCount,
    installmentsCount,
    sharedCount,
    categoryBreakdown,
    loading,
    error,
  };
}
