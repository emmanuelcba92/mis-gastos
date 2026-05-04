"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";
import { X, Calculator, Users, RefreshCw, CreditCard } from "lucide-react";
import { DEFAULT_CATEGORIES, type Expense } from "@/types";
import type { PaymentMethod } from "@/types";
import { addExpense, updateExpense } from "@/lib/services/expense-service";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

const expenseSchema = z.object({
  title: z.string().min(1, "Ingresá un título"),
  category: z.string().min(1, "Elegí una categoría"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  is_subscription: z.boolean(),
  installments_total: z.number().int().min(1),
  installments_paid: z.number().int().min(0),
  is_shared: z.boolean(),
  split_count: z.number().int().min(1),
  payment_method_id: z.string().min(1, "Elegí un método de pago"),
  start_date: z.string().min(1, "Ingresá una fecha"),
  currency: z.enum(["ARS", "USD"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  expense?: Expense | null;
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseForm({ expense, paymentMethods, onClose, onSuccess }: ExpenseFormProps) {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [saving, setSaving] = useState(false);

  const availableCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...(profile?.custom_categories || [])])
  );

  const defaultDate = expense
    ? expense.start_date.toDate().toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: expense?.title || "",
      category: expense?.category || "",
      amount: expense?.amount || 0,
      is_subscription: expense?.is_subscription || false,
      installments_total: expense?.installments_total || 1,
      installments_paid: expense?.installments_paid || 0,
      is_shared: expense?.is_shared || false,
      split_count: expense?.split_count || 1,
      payment_method_id: expense?.payment_method_id || "",
      start_date: defaultDate,
      currency: expense?.currency || "ARS",
      notes: expense?.notes || "",
    },
  });

  const watchSubscription = watch("is_subscription");
  const watchShared = watch("is_shared");
  const watchAmount = watch("amount");
  const watchCurrency = watch("currency");
  const watchInstallments = watch("installments_total");
  const watchSplitCount = watch("split_count");

  const monthlyAmount = watchSubscription
    ? watchAmount
    : watchInstallments > 1
    ? watchAmount / watchInstallments
    : watchAmount;

  const perPersonAmount = watchShared && watchSplitCount > 1
    ? monthlyAmount / watchSplitCount
    : monthlyAmount;

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSaving(true);

    try {
      const startDate = Timestamp.fromDate(new Date(data.start_date + "T12:00:00"));

      const pm = paymentMethods.find((p) => p.id === data.payment_method_id);
      let billingStartDate: Timestamp | undefined = undefined;

      if (pm && pm.type === "credit_card") {
        const isNX = pm.name.toLowerCase().includes("nx") || pm.name.toLowerCase().includes("naranja");
        const nxClosingDay = 27;
        const bankClosingDay = 25;
        const closingDay = isNX ? nxClosingDay : bankClosingDay;
        
        const dateObj = new Date(data.start_date + "T12:00:00");
        let billingMonth = dateObj.getMonth();
        let billingYear = dateObj.getFullYear();

        if (dateObj.getDate() >= closingDay) {
          billingMonth += 2;
        } else {
          billingMonth += 1;
        }

        const titleLower = data.title.toLowerCase();
        if (titleLower.includes("opcion") || titleLower.includes("opción") || titleLower.includes("pago digi")) {
          billingMonth -= 1;
        }

        if (billingMonth > 11) {
          billingMonth -= 12;
          billingYear += 1;
        }

        billingStartDate = Timestamp.fromDate(new Date(billingYear, billingMonth, 1));
      }

      if (expense) {
        await updateExpense(expense.id, {
          title: data.title,
          category: data.category as Expense["category"],
          amount: data.amount,
          is_subscription: data.is_subscription,
          installments_total: data.is_subscription ? 1 : data.installments_total,
          installments_paid: data.installments_paid,
          is_shared: data.is_shared,
          split_count: data.is_shared ? data.split_count : 1,
          payment_method_id: data.payment_method_id,
          start_date: startDate,
          billing_start_date: billingStartDate,
          currency: data.currency,
          notes: data.notes,
        });
      } else {
        await addExpense({
          userId: user.uid,
          title: data.title,
          category: data.category as Expense["category"],
          amount: data.amount,
          is_subscription: data.is_subscription,
          installments_total: data.is_subscription ? 1 : data.installments_total,
          installments_paid: data.installments_paid,
          is_shared: data.is_shared,
          split_count: data.is_shared ? data.split_count : 1,
          payment_method_id: data.payment_method_id,
          start_date: startDate,
          billing_start_date: billingStartDate,
          currency: data.currency,
          notes: data.notes,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error guardando gasto:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/50 animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-zinc-900/90 backdrop-blur-md border-b border-white/5">
          <h2 className="text-lg font-semibold text-zinc-100">
            {expense ? "Editar Gasto" : "Nuevo Gasto"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Título</label>
            <input
              {...register("title")}
              placeholder="Ej: ChatGPT Plus, Netflix, Compra Garbarino..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-sm"
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>

          {/* Categoría + Método de pago */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoría</label>
              <select
                {...register("category")}
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer [&>option]:bg-zinc-900"
              >
                <option value="">Seleccionar...</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-rose-400 mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Método de pago</label>
              <select
                {...register("payment_method_id")}
                className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer [&>option]:bg-zinc-900"
              >
                <option value="">Seleccionar...</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.type === "credit_card" ? "💳" : "💵"} {pm.name}
                  </option>
                ))}
              </select>
              {errors.payment_method_id && (
                <p className="text-xs text-rose-400 mt-1">{errors.payment_method_id.message}</p>
              )}
            </div>
          </div>

          {/* Monto + Moneda + Fecha */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-7 sm:col-span-5">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Monto Total</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <select
                    {...register("currency")}
                    className="h-full py-0 pl-3 pr-7 bg-transparent text-zinc-400 text-sm focus:outline-none focus:ring-0 border-r border-white/10 appearance-none cursor-pointer [&>option]:bg-zinc-900"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <input
                  {...register("amount", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-[4.5rem] pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
                />
              </div>
              {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
            </div>

            <div className="col-span-5 sm:col-span-7">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fecha</label>
              <input
                {...register("start_date")}
                type="date"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              {errors.start_date && <p className="text-xs text-rose-400 mt-1">{errors.start_date.message}</p>}
            </div>
          </div>

          {/* Suscripción toggle */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <RefreshCw className={`w-5 h-5 ${watchSubscription ? "text-cyan-400" : "text-zinc-500"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">¿Es una suscripción?</p>
              <p className="text-xs text-zinc-500">Se cobra todos los meses automáticamente</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input {...register("is_subscription")} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-violet-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
            </label>
          </div>

          {/* Cuotas (si no es suscripción) */}
          {!watchSubscription && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Cuotas totales
                </label>
                <input
                  {...register("installments_total", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="60"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Cuotas pagadas</label>
                <input
                  {...register("installments_paid", { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
                />
              </div>
            </div>
          )}

          {/* Compartido toggle */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
            <Users className={`w-5 h-5 ${watchShared ? "text-emerald-400" : "text-zinc-500"}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">¿Gasto compartido?</p>
              <p className="text-xs text-zinc-500">Dividir entre varias personas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input {...register("is_shared")} type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-violet-500/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {watchShared && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                ¿Entre cuántas personas?
              </label>
              <input
                {...register("split_count", { valueAsNumber: true })}
                type="number"
                min="2"
                max="20"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
              />
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Notas (opcional)</label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Detalles adicionales..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder-zinc-600 resize-none"
            />
          </div>

          {/* Resumen de cálculo en vivo */}
          {watchAmount > 0 && (
            <div className="p-4 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs text-violet-300 font-medium mb-2">
                <Calculator className="w-3.5 h-3.5" />
                Resumen
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Monto por mes:</span>
                <span className="text-zinc-100 font-mono font-semibold">
                  {watchCurrency === "USD" ? "u$s" : "$"} {monthlyAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {watchShared && watchSplitCount > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Tu parte ({watchSplitCount} personas):</span>
                  <span className="text-emerald-400 font-mono font-semibold">
                    {watchCurrency === "USD" ? "u$s" : "$"} {perPersonAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {!watchSubscription && watchInstallments > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Finaliza en:</span>
                  <span className="text-zinc-300 text-xs">
                    {(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + watchInstallments - 1);
                      return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
                    })()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </span>
            ) : expense ? (
              "Guardar Cambios"
            ) : (
              "Agregar Gasto"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
