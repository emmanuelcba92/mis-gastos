"use client";

import { useState, useEffect } from "react";
import { Save, DollarSign, Plus, X, Tags } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { updateUserProfile } from "@/lib/services/user-service";
import { useAuth } from "@/contexts/AuthContext";
import { DEFAULT_CATEGORIES } from "@/types";

export function ProfileSettings() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [salary, setSalary] = useState<number>(0);
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setSalary(profile.monthly_salary);
      setCurrency(profile.currency);
      setCustomCategories(profile.custom_categories || []);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        monthly_salary: salary,
        currency,
        custom_categories: customCategories,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error actualizando perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (DEFAULT_CATEGORIES.includes(trimmed as any) || customCategories.includes(trimmed)) {
      setNewCategory("");
      return;
    }
    setCustomCategories([...customCategories, trimmed]);
    setNewCategory("");
  };

  const handleRemoveCategory = (cat: string) => {
    setCustomCategories(customCategories.filter((c) => c !== cat));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Preferencias</h3>

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
            className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer [&>option]:bg-zinc-900"
          >
            <option value="ARS">ARS 🇦🇷</option>
            <option value="USD">USD 🇺🇸</option>
          </select>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          Se usa para calcular el porcentaje de tus gastos vs. tu ingreso
        </p>
      </div>

      {/* Categorías */}
      <div className="pt-4 border-t border-white/5">
        <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 mb-3">
          <Tags className="w-3.5 h-3.5" />
          Categorías personalizadas
        </label>

        <div className="flex flex-wrap gap-2 mb-3">
          {/* Default categories (read only) */}
          {DEFAULT_CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 text-zinc-400 text-sm rounded-lg border border-white/5"
            >
              {cat}
            </span>
          ))}

          {/* Custom categories */}
          {customCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-300 text-sm rounded-lg border border-violet-500/20 group"
            >
              {cat}
              <button
                onClick={() => handleRemoveCategory(cat)}
                className="opacity-50 hover:opacity-100 hover:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            placeholder="Ej: Viaje Brasil"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl font-medium transition-colors border border-white/10 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-1.5">
          Agregá categorías para organizar mejor tus gastos (enter para añadir).
        </p>
      </div>

      {/* Botón guardar */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center justify-center gap-2 w-full py-4 mt-6 rounded-xl font-bold text-sm transition-all duration-300 ${
          saved
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_20px_rgba(139,92,246,0.4)]"
        } disabled:opacity-50`}
      >
        <Save className="w-5 h-5" />
        {saving ? "GUARDANDO..." : saved ? "¡GUARDADO!" : "GUARDAR CAMBIOS"}
      </button>
    </div>
  );
}
