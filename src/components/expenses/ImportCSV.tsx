"use client";

import { useState, useRef } from "react";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import * as XLSX from "xlsx";
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
      // Leemos el archivo como ArrayBuffer para soportar XLSX
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // raw: true (default) devuelve los tipos originales (Date, Number, String)
      // cellDates: true en la lectura convierte las fechas de Excel a Date de JS
      const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: true });
      const validRows = rows.filter(row => row && row.length > 0);

      if (validRows.length < 2) {
        throw new Error("El archivo está vacío o no tiene datos válidos.");
      }

      const headers = validRows[0].map((h) => String(h).trim().toUpperCase());
      const col = {
        fecha: headers.indexOf("FECHA"),
        nombre: headers.indexOf("NOMBRE"),
        categoria: headers.indexOf("CATEGORIA") !== -1 ? headers.indexOf("CATEGORIA") : headers.indexOf("CATEGORÍA"),
        pago: headers.indexOf("PAGO"),
        cuotas: headers.indexOf("CUOTAS"),
        total: headers.indexOf("TOTAL"),
      };

      if (col.nombre === -1 || col.total === -1) {
        throw new Error(
          "El archivo debe contener al menos las columnas NOMBRE y TOTAL (detectadas: " + headers.join(", ") + ")"
        );
      }

      const localPaymentMethods = [...paymentMethods];

      const parseAmount = (val: any) => {
        if (typeof val === "number") return val;
        if (!val) return 0;
        let clean = String(val).replace(/[^0-9,\.-]/g, ''); 
        if (clean.includes(',') && clean.includes('.')) {
          clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.includes(',')) {
          clean = clean.replace(',', '.');
        }
        return Number(clean) || 0;
      };

      for (let i = 1; i < validRows.length; i++) {
        const row = validRows[i];
        
        const fechaVal = col.fecha !== -1 ? row[col.fecha] : null;
        const nombreStr = col.nombre !== -1 ? String(row[col.nombre] || "") : "";
        const catStr = col.categoria !== -1 && row[col.categoria] ? String(row[col.categoria]) : "Compra";
        const pagoStr = col.pago !== -1 && row[col.pago] ? String(row[col.pago]) : "Efectivo";
        const cuotasStr = col.cuotas !== -1 ? String(row[col.cuotas] || "") : "";
        const totalVal = col.total !== -1 ? row[col.total] : 0;

        if (!nombreStr) continue;

        let startDate = new Date();
        if (fechaVal instanceof Date) {
          startDate = fechaVal;
        } else if (typeof fechaVal === "number") {
          // Por si falla cellDates, calculamos desde número serial de Excel
          startDate = new Date(Math.round((fechaVal - 25569) * 86400 * 1000));
        } else if (typeof fechaVal === "string" && fechaVal.trim()) {
          const parts = fechaVal.split(/[-/]/);
          if (parts.length >= 3) {
            const day = Number(parts[0]);
            const month = Number(parts[1]) - 1;
            let yearStr = parts[2].split(" ")[0]; 
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

        const amount = parseAmount(totalVal);
        if (amount === 0) continue;

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
            type: "credit_card",
          });
          localPaymentMethods.push({ id: pmId, userId, name: pagoStr, type: "credit_card", created_at: Timestamp.now() });
        }

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
      setError(err.message || "Error al procesar el archivo Excel/CSV.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
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
        <span>Importar Excel</span>
      </button>
      {error && <p className="text-red-400 text-xs mt-2 max-w-xs">{error}</p>}
    </div>
  );
}
