import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Expense, ExpenseInput } from "@/types";

const COLLECTION = "expenses";

// ── Calcular fecha de finalización ──
function calculateEndDate(startDate: Timestamp, installmentsTotal: number): Timestamp | null {
  if (installmentsTotal <= 1) return null; // pago único, sin end_date
  const start = startDate.toDate();
  const end = new Date(start);
  end.setMonth(end.getMonth() + installmentsTotal - 1);
  return Timestamp.fromDate(end);
}

// ── Crear gasto ──
export async function addExpense(data: ExpenseInput): Promise<string> {
  const db = getFirebaseDb();
  const now = Timestamp.now();
  const end_date = data.is_subscription
    ? null // suscripciones no tienen fecha de fin
    : calculateEndDate(data.start_date, data.installments_total);

  // Clean up undefined values for Firestore
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );

  const docRef = await addDoc(collection(db, COLLECTION), {
    ...cleanData,
    end_date,
    created_at: now,
    updated_at: now,
  });

  return docRef.id;
}

// ── Actualizar gasto ──
export async function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "created_at">>
): Promise<void> {
  const db = getFirebaseDb();

  // Recalcular end_date si se cambiaron las cuotas o start_date
  const updateData: Record<string, unknown> = {
    ...data,
    updated_at: Timestamp.now(),
  };

  if (data.start_date && data.installments_total !== undefined) {
    updateData.end_date = data.is_subscription
      ? null
      : calculateEndDate(data.start_date, data.installments_total);
  }

  await updateDoc(doc(db, COLLECTION, id), updateData);
}

// ── Eliminar gasto ──
export async function deleteExpense(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COLLECTION, id));
}

// ── Eliminar TODOS los gastos de un usuario ──
export async function deleteAllExpensesForUser(userId: string): Promise<void> {
  const db = getFirebaseDb();
  const q = query(collection(db, COLLECTION), where("userId", "==", userId));
  const { getDocs, writeBatch } = await import("firebase/firestore");
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

// ── Escuchar gastos en tiempo real ──
export function subscribeToExpenses(
  userId: string,
  callback: (expenses: Expense[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
    orderBy("start_date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const expenses: Expense[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Expense[];
    callback(expenses);
  });
}

// ── Calcular monto mensual de un gasto para un mes/año dado ──
export function getMonthlyAmount(expense: Expense, month: number, year: number): number {
  const targetDate = new Date(year, month);
  const startDate = expense.billing_start_date ? expense.billing_start_date.toDate() : expense.start_date.toDate();

  // Suscripciones: siempre el monto completo si están activas
  if (expense.is_subscription) {
    // Si la suscripción empezó antes o durante este mes, está activa
    if (startDate <= new Date(year, month + 1, 0)) {
      return expense.amount / (expense.split_count || 1);
    }
    return 0;
  }

  // Pago único: solo el mes de la compra (o de facturación)
  if (expense.installments_total <= 1) {
    if (startDate.getMonth() === month && startDate.getFullYear() === year) {
      return expense.amount / (expense.split_count || 1);
    }
    return 0;
  }

  // Cuotas: verificar si este mes cae dentro del rango
  const startMonth = startDate.getMonth() + startDate.getFullYear() * 12;
  const targetMonth = month + year * 12;
  const endMonth = startMonth + expense.installments_total - 1;

  if (targetMonth >= startMonth && targetMonth <= endMonth) {
    const monthlyInstallment = expense.amount / expense.installments_total;
    return monthlyInstallment / (expense.split_count || 1);
  }

  return 0;
}

// ── Calcular cuota actual para un mes/año dado ──
export function getCurrentInstallment(
  expense: Expense,
  month: number,
  year: number
): number | null {
  if (expense.installments_total <= 1 || expense.is_subscription) return null;

  const startDate = expense.billing_start_date ? expense.billing_start_date.toDate() : expense.start_date.toDate();
  const startMonth = startDate.getMonth() + startDate.getFullYear() * 12;
  const targetMonth = month + year * 12;

  const installment = targetMonth - startMonth + 1;
  if (installment < 1 || installment > expense.installments_total) return null;
  return installment;
}
