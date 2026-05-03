import {
  collection,
  addDoc,
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
import type { PaymentMethod } from "@/types";

const COLLECTION = "payment_methods";

// ── Crear método de pago ──
export async function addPaymentMethod(
  data: Omit<PaymentMethod, "id" | "created_at">
): Promise<string> {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    created_at: Timestamp.now(),
  });
  return docRef.id;
}

// ── Eliminar método de pago ──
export async function deletePaymentMethod(id: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COLLECTION, id));
}

// ── Escuchar métodos de pago en tiempo real ──
export function subscribeToPaymentMethods(
  userId: string,
  callback: (methods: PaymentMethod[]) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(
    collection(db, COLLECTION),
    where("userId", "==", userId)
  );

  return onSnapshot(q, (snapshot) => {
    let methods: PaymentMethod[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as PaymentMethod[];
    
    // Client side sort to bypass composite index requirement
    methods.sort((a, b) => b.created_at.toMillis() - a.created_at.toMillis());
    callback(methods);
  });
}
