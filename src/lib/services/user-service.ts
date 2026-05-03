import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import type { User } from "firebase/auth";

const COLLECTION = "users";

// ── Crear perfil de usuario (primer login) ──
export async function createUserProfile(firebaseUser: User): Promise<void> {
  const db = getFirebaseDb();
  const userRef = doc(db, COLLECTION, firebaseUser.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    const now = Timestamp.now();
    await setDoc(userRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      display_name: firebaseUser.displayName || "Usuario",
      photo_url: firebaseUser.photoURL || "",
      monthly_salary: 0,
      currency: "ARS",
      created_at: now,
      updated_at: now,
    } satisfies UserProfile);
  }
}

// ── Actualizar perfil ──
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, "display_name" | "monthly_salary" | "currency">>
): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, COLLECTION, uid), {
    ...data,
    updated_at: Timestamp.now(),
  });
}

// ── Escuchar perfil en tiempo real ──
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onSnapshot(doc(db, COLLECTION, uid), (snap) => {
    if (snap.exists()) {
      callback({ ...snap.data(), uid: snap.id } as UserProfile);
    } else {
      callback(null);
    }
  });
}
