"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useUserProfile } from "@/hooks/useUserProfile";
import { deleteExpense } from "@/lib/services/expense-service";
import type { Expense, ExpenseFilters } from "@/types";

import { SalaryAlert } from "@/components/dashboard/SalaryAlert";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { SpendingChart } from "@/components/charts/SpendingChart";

import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { PaymentMethodForm } from "@/components/settings/PaymentMethodForm";

import {
  LogOut,
  Plus,
  Settings,
  BarChart3,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

type Tab = "dashboard" | "charts" | "settings";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { profile } = useUserProfile();
  const { paymentMethods } = usePaymentMethods();

  const now = new Date();
  const [filters, setFilters] = useState<ExpenseFilters>({
    month: now.getMonth(),
    year: now.getFullYear(),
    type: "all",
  });

  const {
    expenses,
    monthlyTotal,
    subscriptionTotal,
    subscriptionCount,
    installmentsTotal,
    installmentsCount,
    sharedCount,
    categoryBreakdown,
    loading: expensesLoading,
  } = useExpenses(filters);

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    try {
      await deleteExpense(id);
    } catch (err) {
      console.error("Error eliminando gasto:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-8 h-8 rounded-full ring-2 ring-violet-500/30"
              />
            )}
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Mis Gastos
              </h1>
              <p className="text-[11px] text-zinc-500">{user.displayName}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-28">
        {/* Tab: Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-5 py-5">
            {/* Month selector */}
            <div className="flex justify-center">
              <MonthSelector
                month={filters.month}
                year={filters.year}
                onChange={(m, y) => handleFilterChange({ month: m, year: y })}
              />
            </div>

            {/* Salary Alert */}
            <SalaryAlert
              monthlyTotal={monthlyTotal}
              monthlySalary={profile?.monthly_salary || 0}
            />

            {/* Summary Cards */}
            <SummaryCards
              monthlyTotal={monthlyTotal}
              subscriptionTotal={subscriptionTotal}
              subscriptionCount={subscriptionCount}
              installmentsTotal={installmentsTotal}
              installmentsCount={installmentsCount}
              sharedCount={sharedCount}
            />

            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              paymentMethods={paymentMethods}
              onFilterChange={handleFilterChange}
            />

            {/* Expense List */}
            {expensesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              </div>
            ) : (
              <ExpenseList
                expenses={expenses}
                paymentMethods={paymentMethods}
                month={filters.month}
                year={filters.year}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}

        {/* Tab: Charts */}
        {activeTab === "charts" && (
          <div className="space-y-5 py-5">
            <div className="flex justify-center">
              <MonthSelector
                month={filters.month}
                year={filters.year}
                onChange={(m, y) => handleFilterChange({ month: m, year: y })}
              />
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h2 className="text-base font-semibold text-zinc-200 mb-1">
                Distribución por Categoría
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Porcentaje de tus gastos mensuales por categoría
              </p>
              <SpendingChart categoryBreakdown={categoryBreakdown} />
            </div>

            {/* Top categorías */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-300">Top Categorías</h3>
              {categoryBreakdown.slice(0, 5).map((item, i) => (
                <div
                  key={item.category}
                  className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl"
                >
                  <span className="text-sm font-mono text-zinc-500 w-5">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-sm text-zinc-300">{item.category}</span>
                  <span className="text-sm font-bold text-zinc-100 font-mono">
                    ${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === "settings" && (
          <div className="space-y-6 py-5">
            {/* Lazy import de settings */}
            <SettingsContent />
          </div>
        )}
      </main>

      {/* FAB - Agregar gasto */}
      {activeTab === "dashboard" && (
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowExpenseForm(true);
          }}
          className="fixed bottom-24 right-4 sm:right-[calc(50%-320px+16px)] z-30 w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl shadow-2xl shadow-violet-500/30 flex items-center justify-center transition-all duration-200 active:scale-90"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
          {[
            { key: "dashboard" as Tab, icon: LayoutDashboard, label: "Inicio" },
            { key: "charts" as Tab, icon: BarChart3, label: "Gráficos" },
            { key: "settings" as Tab, icon: Settings, label: "Ajustes" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-violet-400"
                    : "text-zinc-500 hover:text-zinc-400"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" : ""}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense}
          paymentMethods={paymentMethods}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}

// Settings content inline (to avoid extra routing)
function SettingsContent() {
  return (
    <>
      <ProfileSettings />
      <div className="border-t border-white/5 pt-6">
        <PaymentMethodForm />
      </div>
    </>
  );
}

