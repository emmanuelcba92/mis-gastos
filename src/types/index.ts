import { Timestamp } from "firebase/firestore";

// ── User Profile (colección: users) ──
export interface UserProfile {
  uid: string;
  email: string;
  display_name: string;
  photo_url?: string;
  monthly_salary: number;
  currency: "ARS" | "USD";
  custom_categories?: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ── Payment Method (colección: payment_methods) ──
export interface PaymentMethod {
  id: string;
  userId: string;
  name: string; // "Visa Banco Nación", "Mercado Pago", etc.
  type: PaymentMethodType;
  brand?: string; // "Visa", "Mastercard", "Amex"
  last_four?: string; // "4532"
  created_at: Timestamp;
}

export type PaymentMethodType = "credit_card" | "debit" | "cash" | "digital_wallet";

// ── Expense (colección: expenses) ──
export interface Expense {
  id: string;
  userId: string;
  title: string;
  category: string;
  amount: number; // Monto total del gasto
  is_subscription: boolean; // true = gasto recurrente mensual (ej: ChatGPT, Spotify)
  installments_total: number; // Total de cuotas (1 = pago único)
  installments_paid: number; // Cuotas ya pagadas
  start_date: Timestamp; // Fecha de inicio / compra
  end_date: Timestamp | null; // Fecha de última cuota (calculada automáticamente)
  is_shared: boolean; // ¿Se comparte entre personas?
  split_count: number; // Cantidad de personas (1 = no compartido)
  payment_method_id: string; // FK a payment_methods
  notes?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ── Expense sin ID (para crear nuevos) ──
export type ExpenseInput = Omit<Expense, "id" | "created_at" | "updated_at" | "end_date">;

// ── Categorías ──
export const DEFAULT_CATEGORIES = [
  "Suscripción",
  "Compra",
] as const;

// ── Mapeo de íconos por categoría ──
export const CATEGORY_ICONS: Record<string, string> = {
  "Suscripción": "🔄",
  "Compra": "🛍️",
};

// ── Colores por categoría (para gráficos) ──
export const CATEGORY_COLORS: Record<string, string> = {
  "Suscripción": "#8B5CF6",
  "Compra": "#EC4899",
};

// ── Tipo para el estado del sueldo ──
export type SalaryStatus = "green" | "yellow" | "red";

// ── Helper: calcular estado del sueldo ──
export function getSalaryStatus(totalExpenses: number, monthlySalary: number): SalaryStatus {
  if (monthlySalary <= 0) return "green";
  const ratio = totalExpenses / monthlySalary;
  if (ratio < 0.3) return "green";
  if (ratio <= 0.6) return "yellow";
  return "red";
}

// ── Helper: color del estado ──
export const SALARY_STATUS_CONFIG: Record<
  SalaryStatus,
  { color: string; bgColor: string; label: string; emoji: string }
> = {
  green: {
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    label: "Bajo control",
    emoji: "✅",
  },
  yellow: {
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    label: "Precaución",
    emoji: "⚠️",
  },
  red: {
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    label: "Excedido",
    emoji: "🚨",
  },
};

// ── Tipos de filtro ──
export interface ExpenseFilters {
  month: number; // 0-11
  year: number;
  paymentMethodId?: string;
  category?: string;
  type?: "all" | "subscription" | "installments" | "single";
}
