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
import { ImportCSV } from "@/components/expenses/ImportCSV";
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
    monthlyTotalUSD,
    subscriptionTotal,
    subscriptionTotalUSD,
    subscriptionCount,
    installmentsTotal,
    installmentsTotalUSD,
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
        <Loader2 className="w-10 h-10 text-violet-500 animate-spin drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-violet-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
      </div>

      {/* Header & Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#050505]/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent drop-shadow-sm">
              MIS<span className="text-violet-400">GASTOS</span>
            </h1>
            
            {/* Tabs at the top */}
            <nav className="flex items-center gap-1.5 p-1.5 bg-white/[0.03] rounded-2xl border border-white/10 backdrop-blur-md shadow-inner shadow-black/50">
              {[
                { key: "dashboard" as Tab, label: "Inicio", icon: LayoutDashboard },
                { key: "charts" as Tab, label: "Gráficos", icon: BarChart3 },
                { key: "settings" as Tab, label: "Ajustes", icon: Settings },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]" 
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Month Selector exactly below tabs */}
          {(activeTab === "dashboard" || activeTab === "charts") && (
            <div className="flex justify-center">
              <MonthSelector
                month={filters.month}
                year={filters.year}
                onChange={(m, y) => handleFilterChange({ month: m, year: y })}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Tab: Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Salary Alert */}
            <SalaryAlert
              monthlyTotal={monthlyTotal}
              monthlySalary={profile?.monthly_salary || 0}
            />

            {/* Summary Cards */}
            <SummaryCards
              monthlyTotal={monthlyTotal}
              monthlyTotalUSD={monthlyTotalUSD}
              subscriptionTotal={subscriptionTotal}
              subscriptionTotalUSD={subscriptionTotalUSD}
              subscriptionCount={subscriptionCount}
              installmentsTotal={installmentsTotal}
              installmentsTotalUSD={installmentsTotalUSD}
              installmentsCount={installmentsCount}
              sharedCount={sharedCount}
            />

            {/* Filter Bar & Import */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                <FilterBar
                  filters={filters}
                  paymentMethods={paymentMethods}
                  onFilterChange={handleFilterChange}
                />
              </div>
              <div className="flex items-center justify-center bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                <ImportCSV 
                  userId={user.uid} 
                  paymentMethods={paymentMethods} 
                  onSuccess={() => {}} 
                />
              </div>
            </div>

            {/* Expense List */}
            {expensesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
            ) : (
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                <ExpenseList
                  expenses={expenses}
                  paymentMethods={paymentMethods}
                  month={filters.month}
                  year={filters.year}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab: Charts */}
        {activeTab === "charts" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-xl font-bold text-zinc-100 mb-2">
                Distribución por Categoría
              </h2>
              <p className="text-sm text-zinc-400 mb-8">
                Análisis visual de tus consumos para el mes actual
              </p>
              <SpendingChart categoryBreakdown={categoryBreakdown} />
            </div>

            {/* Top categorías */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-zinc-200 ml-1">Top Categorías</h3>
              {categoryBreakdown.slice(0, 5).map((item, i) => (
                <div
                  key={item.category}
                  className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-colors rounded-2xl"
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 font-bold text-sm">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-base font-medium text-zinc-300">{item.category}</span>
                  <span className="text-lg font-bold text-zinc-100 tracking-tight">
                    ${item.amount.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === "settings" && (
          <SettingsContent user={user} onLogout={handleLogout} />
        )}
      </main>

      {/* FAB - Agregar gasto */}
      {activeTab === "dashboard" && (
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowExpenseForm(true);
          }}
          className="fixed bottom-8 right-6 lg:right-12 z-50 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold tracking-wide">NUEVO GASTO</span>
        </button>
      )}

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

// Settings content inline
function SettingsContent({ user, onLogout }: { user: any, onLogout: () => void }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      {/* Account Info Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full" />
        
        <div className="flex items-center gap-5 relative z-10">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="w-20 h-20 rounded-full ring-4 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-violet-600/20 flex items-center justify-center ring-4 ring-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
              <span className="text-3xl font-bold text-violet-400">
                {user?.displayName?.[0] || "U"}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">{user?.displayName}</h2>
            <p className="text-sm text-zinc-400 mt-1">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl font-bold transition-all border border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
        <ProfileSettings />
      </div>
      
      <div className="bg-white/[0.02] border border-white/5 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
        <PaymentMethodForm />
      </div>
    </div>
  );
}

