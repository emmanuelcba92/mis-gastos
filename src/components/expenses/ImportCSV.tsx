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

      // Detectar separador (coma o punto y coma)
      const separator = lines[0].includes(";") ? ";" : ",";
      
      // Función simple para parsear la línea respetando comillas
      const parseCsvLine = (line: string) => {
        const result = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === separator && !inQuotes) {
            result.push(current);
            current = "";
          } else {
            current += char;
          }
        }
        result.push(current);
        return result.map(s => s.trim().replace(/^"|"$/g, ''));
      };

      const headers = parseCsvLine(lines[0]).map((h) => h.toUpperCase());
      const col = {
        fecha: headers.indexOf("FECHA"),
        nombre: headers.indexOf("NOMBRE"),
        categoria: headers.indexOf("CATEGORIA") !== -1 ? headers.indexOf("CATEGORIA") : headers.indexOf("CATEGORÍA"),
        pago: headers.indexOf("PAGO"),
        cuotas: headers.indexOf("CUOTAS"),
        total: headers.indexOf("TOTAL"),
      };

      if (col.nombre === -1 || col.total === -1) {
        throw new Error("El archivo debe contener al menos las columnas NOMBRE y TOTAL (detectadas: " + headers.join(", ") + ")");
      }

      const localPaymentMethods = [...paymentMethods];

      // Función para limpiar montos como "$ 138.785,40" o "u$s 9,99" a número
      const parseAmount = (val: string) => {
        let clean = val.replace(/[^0-9,\.-]/g, ''); // Deja solo números, comas, puntos y signos menos
        if (clean.includes(',') && clean.includes('.')) {
          // Asume que el punto es de miles y la coma decimal (formato AR)
          clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.includes(',')) {
          // Asume coma decimal
          clean = clean.replace(',', '.');
        }
        return Number(clean) || 0;
      };

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = parseCsvLine(lines[i]);
        
        const fechaStr = col.fecha !== -1 ? row[col.fecha] : "";
        const nombreStr = col.nombre !== -1 ? row[col.nombre] : "";
        const catStr = col.categoria !== -1 && row[col.categoria] ? row[col.categoria] : "Compra";
        const pagoStr = col.pago !== -1 && row[col.pago] ? row[col.pago] : "Efectivo";
        const cuotasStr = col.cuotas !== -1 ? row[col.cuotas] : "";
        const totalStr = col.total !== -1 ? row[col.total] : "0";

        if (!nombreStr) continue;

        let startDate = new Date();
        if (fechaStr) {
          // Puede ser "04/05/2026" o "4/5/26"
          const parts = fechaStr.split(/[-/]/);
          if (parts.length >= 3) {
            const day = Number(parts[0]);
            const month = Number(parts[1]) - 1;
            let yearStr = parts[2].split(" ")[0]; // Por si tiene hora
            const year = yearStr.length === 2 ? 2000 + Number(yearStr) : Number(yearStr);
            startDate = new Date(year, month, day);
          }
        }

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

        const amount = parseAmount(totalStr);
        if (amount === 0) continue;

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
          amount: amount,
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
