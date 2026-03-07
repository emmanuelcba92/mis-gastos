import { Timestamp } from "firebase/firestore";

// ── Participante de un gasto compartido ──
export interface Participante {
  nombre: string;
  porcentaje?: number; // 0-100
  monto?: number; // monto fijo
  pagado: boolean;
}

// ── Cuotas ──
export interface Cuotas {
  actual: number; // cuota actual al momento del ingreso
  total: number; // total de cuotas (1 = pago único)
}

// ── Documento principal de la colección "gastos" ──
export interface Gasto {
  id: string; // Firestore doc ID
  userId: string; // Firebase Auth UID (dueño)
  comercio: string; // Nombre del comercio
  descripcion?: string; // Descripción opcional
  categoria: string; // Ej: "Supermercado", "Electrónica"
  montoTotal: number; // Monto total de la compra
  montoCuota: number; // Monto por cuota (montoTotal / cuotas.total)

  cuotas: Cuotas;
  fechaCompra: Timestamp; // Fecha de compra
  fechaInicio: Timestamp; // Fecha de la primera cuota

  participantes?: Participante[];

  ticketUrl?: string; // URL del ticket en Firebase Storage
  ticketPath?: string; // Path en Storage (para eliminación)

  esFijo: boolean; // ¿Es un gasto fijo recurrente?
  metodoIA: boolean; // ¿Fue pre-llenado por Gemini?

  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// ── Categorías predefinidas ──
export const CATEGORIAS = [
  "Supermercado",
  "Electrónica",
  "Ropa",
  "Entretenimiento",
  "Salud",
  "Transporte",
  "Restaurante",
  "Servicios",
  "Educación",
  "Hogar",
  "Mascotas",
  "Viajes",
  "Otro",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
