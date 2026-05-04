"use client";

import { useState, useRef } from "react";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import * as XLSX from "xlsx";
import { addExpense, deleteAllExpensesForUser } from "@/lib/services/expense-service";
import { addPaymentMethod } from "@/lib/services/payment-method-service";
import type { PaymentMethod } from "@/types";
import { Trash2 } from "lucide-react";

interface ImportCSVProps {
  userId: string;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

export function ImportCSV({ userId, paymentMethods, onSuccess }: ImportCSVProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [nxClosingDay, setNxClosingDay] = useState<number>(27);
  const [bankClosingDay, setBankClosingDay] = useState<number>(25);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDeleteAll = async () => {
    if (confirm("🚨 ¿ESTÁS SEGURO? Esto borrará TODOS tus gastos actuales. No se puede deshacer.")) {
      setLoading(true);
      try {
        await deleteAllExpensesForUser(userId);
        onSuccess();
        alert("Todos los gastos fueron eliminados.");
      } catch (err: any) {
        alert("Error al borrar: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

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

        // Buscar o crear método de pago
        let pmId = "";
        let isCreditCard = true; // Por defecto creamos como crédito
        let existingPm = localPaymentMethods.find(
          (p) => p.name.toLowerCase() === pagoStr.toLowerCase()
        );

        if (existingPm) {
          pmId = existingPm.id;
          isCreditCard = existingPm.type === "credit_card";
        } else if (pagoStr) {
          pmId = await addPaymentMethod({
            userId,
            name: pagoStr,
            type: "credit_card",
          });
          localPaymentMethods.push({ id: pmId, userId, name: pagoStr, type: "credit_card", created_at: Timestamp.now() });
        }

        // Lógica de fecha de facturación (mes siguiente) para Tarjetas de Crédito
        let billingStartDate: Date | undefined = undefined;
        if (isCreditCard) {
          const isNX = pagoStr.toLowerCase().includes("nx") || pagoStr.toLowerCase().includes("naranja");
          const closingDay = isNX ? nxClosingDay : bankClosingDay;
          
          let billingMonth = startDate.getMonth();
          let billingYear = startDate.getFullYear();

          if (startDate.getDate() > closingDay) {
            // Pasó el cierre, entra al mes siguiente
            billingMonth += 1;
          } else {
            // Antes del cierre, entra en el mismo mes
            billingMonth += 0;
          }

          if (billingMonth > 11) {
            billingMonth -= 12;
            billingYear += 1;
          }
          // Lo seteamos al 1er día del mes de cobro para que getMonthlyAmount lo tome fácil
          billingStartDate = new Date(billingYear, billingMonth, 1);
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
          billing_start_date: billingStartDate ? Timestamp.fromDate(billingStartDate) : undefined,
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
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex gap-2 w-full sm:w-auto">
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImport}
        />
        
        {/* Botón de Importar */}
        <button
          onClick={() => {
            if (!showConfig) {
              setShowConfig(true);
            } else {
              fileInputRef.current?.click();
            }
          }}
          disabled={loading}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          <span>Importar Excel</span>
        </button>

        {/* Botón de Borrar Todo */}
        <button
          onClick={handleDeleteAll}
          disabled={loading}
          title="Borrar todos los gastos"
          className="flex items-center justify-center p-2 rounded-xl text-rose-400 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Configuración de Cierres de Tarjeta */}
      {showConfig && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs flex flex-col gap-2 mt-2 w-full animate-in fade-in slide-in-from-top-2">
          <p className="text-white/70 font-medium">Configurar días de cierre de tarjetas (para diferir pagos):</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-white/90">
              Cierre Naranja (NX):
              <input 
                type="number" 
                min={1} max={31} 
                value={nxClosingDay} 
                onChange={(e) => setNxClosingDay(Number(e.target.value))}
                className="w-12 bg-white/10 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>
            <label className="flex items-center gap-2 text-white/90">
              Cierre Bancarias:
              <input 
                type="number" 
                min={1} max={31} 
                value={bankClosingDay} 
                onChange={(e) => setBankClosingDay(Number(e.target.value))}
                className="w-12 bg-white/10 rounded px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </label>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full mt-1 bg-emerald-500 text-black font-semibold py-1.5 rounded-lg hover:bg-emerald-400 transition-colors"
          >
            Continuar con la importación
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2 w-full">{error}</p>}
    </div>
  );
}
