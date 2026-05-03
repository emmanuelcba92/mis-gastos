"use client";

import { useState, useEffect } from "react";
import { Save, DollarSign } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { updateUserProfile } from "@/lib/services/user-service";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileSettings() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [salary, setSalary] = useState<number>(0);
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setSalary(profile.monthly_salary);
      setCurrency(profile.currency);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        monthly_salary: salary,
        currency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error actualizando perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-zinc-200">Perfil</h3>

      {/* Info del usuario */}
      <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-xl">
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt="Avatar"
            className="w-10 h-10 rounded-full"
          />
        )}
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {user?.displayName || "Usuario"}
          </p>
          <p className="text-xs text-zinc-500">{user?.email}</p>
        </div>
      </div>

      {/* Sueldo */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-1.5">
          <DollarSign className="w-3.5 h-3.5" />
          Sueldo mensual
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={salary || ""}
            onChange={(e) => setSalary(Number(e.target.value))}
            placeholder="0"
            min="0"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 font-mono"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "ARS" | "USD")}
            className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="ARS">ARS 🇦🇷</option>
            <option value="USD">USD 🇺🇸</option>
          </select>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">
          Se usa para calcular el porcentaje de tus gastos vs. tu ingreso
        </p>
      </div>

      {/* Botón guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
          saved
            ? "bg-emerald-600 text-white"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
        } disabled:opacity-50`}
      >
        <Save className="w-4 h-4" />
        {saving ? "Guardando..." : saved ? "¡Guardado!" : "Guardar Perfil"}
      </button>
    </div>
  );
}
