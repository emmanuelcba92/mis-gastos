"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, FileSpreadsheet } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { addExpense } from "@/lib/services/expense-service";
import { addPaymentMethod } from "@/lib/services/payment-method-service";
import type { PaymentMethod } from "@/types";

interface ImportCSVProps {
  userId: string;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

export function ImportCSV({ userId, paymentMethods, onSuccess }: ImportCSVProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      
      if (lines.length < 2) {
        throw new Error("El archivo está vacío o no tiene datos válidos.");
      }

      // Obtener índices de las columnas según la cabecera
      const headers = lines[0].split(",").map((h) => h.trim().toUpperCase());
      const col = {
        fecha: headers.indexOf("FECHA"),
        nombre: headers.indexOf("NOMBRE"),
        categoria: headers.indexOf("CATEGORIA"),
        pago: headers.indexOf("PAGO"),
        cuotas: headers.indexOf("CUOTAS"),
        total: headers.indexOf("TOTAL"),
      };

      // Si falta alguna columna importante, advertimos, pero intentamos seguir
      if (col.nombre === -1 || col.total === -1) {
        throw new Error("El archivo debe contener al menos las columnas NOMBRE y TOTAL.");
      }

      // Cache local para métodos de pago que vamos creando
      const localPaymentMethods = [...paymentMethods];

      for (let i = 1; i < lines.length; i++) {
        // Separa por comas (no soporta comas dentro de comillas por ahora, hay que armarlo simple)
        const row = lines[i].split(",");
        
        const fechaStr = col.fecha !== -1 ? row[col.fecha]?.trim() : "";
        const nombreStr = col.nombre !== -1 ? row[col.nombre]?.trim() : "";
        const catStr = col.categoria !== -1 ? row[col.categoria]?.trim() : "Compra";
        const pagoStr = col.pago !== -1 ? row[col.pago]?.trim() : "Efectivo";
        const cuotasStr = col.cuotas !== -1 ? row[col.cuotas]?.trim() : "";
        const totalStr = col.total !== -1 ? row[col.total]?.trim() : "0";

        if (!nombreStr || !totalStr) continue;

        // Parse Fecha (DD/MM/AA o DD/MM/AAAA)
        let startDate = new Date();
        if (fechaStr) {
          const parts = fechaStr.split("/");
          if (parts.length === 3) {
            const day = Number(parts[0]);
            const month = Number(parts[1]) - 1;
            const yearStr = parts[2];
            const year = yearStr.length === 2 ? 2000 + Number(yearStr) : Number(yearStr);
            startDate = new Date(year, month, day);
          }
        }

        // Parse Cuotas (ej: "5/12" o "12")
        let installmentsTotal = 1;
        let installmentsPaid = 1;
        if (cuotasStr) {
          if (cuotasStr.includes("/")) {
            const parts = cuotasStr.split("/");
            installmentsPaid = Number(parts[0]) || 1;
            installmentsTotal = Number(parts[1]) || 1;
          } else {
            installmentsTotal = Number(cuotasStr) || 1;
          }
        }

        // Método de pago
        let pmId = "";
        let existingPm = localPaymentMethods.find(
          (p) => p.name.toLowerCase() === pagoStr.toLowerCase()
        );

        if (existingPm) {
          pmId = existingPm.id;
        } else if (pagoStr) {
          pmId = await addPaymentMethod({
            userId,
            name: pagoStr,
            type: "credit_card", // asume crédito por defecto si no existía
          });
          localPaymentMethods.push({ id: pmId, userId, name: pagoStr, type: "credit_card", created_at: Timestamp.now() });
        }

        // Crear gasto
        await addExpense({
          userId,
          title: nombreStr,
          category: catStr,
          amount: Number(totalStr),
          is_subscription: catStr.toLowerCase().includes("suscrip"),
          installments_total: installmentsTotal,
          installments_paid: installmentsPaid,
          start_date: Timestamp.fromDate(startDate),
          is_shared: false,
          split_count: 1,
          payment_method_id: pmId,
        });
      }

      onSuccess();
      if (fileInputRef.current) fileInputRef.current.value = "";
      alert("¡Gastos importados con éxito!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al procesar el archivo CSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImport}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        <span>Importar CSV</span>
      </button>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
