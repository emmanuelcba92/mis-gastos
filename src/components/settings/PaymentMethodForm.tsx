"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useAuth } from "@/contexts/AuthContext";
import {
  addPaymentMethod,
  deletePaymentMethod,
} from "@/lib/services/payment-method-service";
import type { PaymentMethodType } from "@/types";

export function PaymentMethodForm() {
  const { user } = useAuth();
  const { paymentMethods } = usePaymentMethods();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethodType>("credit_card");
  const [brand, setBrand] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await addPaymentMethod({
        userId: user.uid,
        name: name.trim(),
        type,
        brand: brand.trim() || undefined,
        last_four: lastFour.trim() || undefined,
      });
      setName("");
      setBrand("");
      setLastFour("");
      setShowForm(false);
    } catch (err) {
      console.error("Error agregando método de pago:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este método de pago?")) return;
    try {
      await deletePaymentMethod(id);
    } catch (err) {
      console.error("Error eliminando método de pago:", err);
    }
  };

  const typeIcons: Record<PaymentMethodType, string> = {
    credit_card: "💳",
    debit: "🏧",
    cash: "💵",
    digital_wallet: "📱",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-200">Métodos de Pago</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-3 py-1.5 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar
        </button>
      </div>

      {/* Lista existente */}
      <div className="space-y-2">
        {paymentMethods.map((pm) => (
          <div
            key={pm.id}
            className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl group"
          >
            <span className="text-lg">{typeIcons[pm.type]}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">{pm.name}</p>
              <p className="text-xs text-zinc-500">
                {pm.brand && `${pm.brand} `}
                {pm.last_four && `•••• ${pm.last_four}`}
              </p>
            </div>
            <button
              onClick={() => handleDelete(pm.id)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-rose-400" />
            </button>
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-4">
            Agregá tu primer método de pago
          </p>
        )}
      </div>

      {/* Formulario agregar */}
      {showForm && (
        <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre (ej: Visa Banco Nación)"
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value as PaymentMethodType)}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500/50 appearance-none cursor-pointer [&>option]:bg-zinc-900"
          >
            <option value="credit_card">💳 Tarjeta de crédito</option>
            <option value="debit">🏧 Tarjeta de débito</option>
            <option value="cash">💵 Efectivo</option>
            <option value="digital_wallet">📱 Billetera digital</option>
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Marca (ej: Visa)"
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            <input
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.slice(0, 4))}
              placeholder="Últimos 4 dígitos"
              maxLength={4}
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Agregar"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 text-sm rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
