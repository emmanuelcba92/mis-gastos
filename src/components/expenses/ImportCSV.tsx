"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, FileSpreadsheet, Trash2, Save, X, Calendar } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import * as XLSX from "xlsx";
import { addExpense, deleteAllExpensesForUser } from "@/lib/services/expense-service";
import { addPaymentMethod } from "@/lib/services/payment-method-service";
import type { PaymentMethod } from "@/types";
import { format } from "date-fns";

interface ImportCSVProps {
  userId: string;
  paymentMethods: PaymentMethod[];
  onSuccess: () => void;
}

interface PreviewExpense {
  id: string; // temp ID
  title: string;
  category: string;
  amount: number;
  currency: "ARS" | "USD";
  is_subscription: boolean;
  installments_total: number;
  installments_paid: number;
  start_date: Date;
  billing_start_date: Date | undefined;
  payment_method_name: string;
  payment_method_id?: string;
  is_credit_card: boolean;
}

export function ImportCSV({ userId, paymentMethods, onSuccess }: ImportCSVProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [showConfig, setShowConfig] = useState(false);
  const [nxClosingDay, setNxClosingDay] = useState<number>(27);
  const [bankClosingDay, setBankClosingDay] = useState<number>(25);
  
  // Preview State
  const [parsedData, setParsedData] = useState<PreviewExpense[] | null>(null);

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

  const handleImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
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
        const previewItems: PreviewExpense[] = [];

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

          let currency: "ARS" | "USD" = "ARS";
          const totalStr = String(totalVal).toLowerCase();
          if (totalStr.includes("u$s") || totalStr.includes("usd") || totalStr.includes("us$")) {
            currency = "USD";
          }

          let pmId = "";
          let isCreditCard = true;
          let existingPm = localPaymentMethods.find(
            (p) => p.name.toLowerCase() === pagoStr.toLowerCase()
          );

          if (existingPm) {
            pmId = existingPm.id;
            isCreditCard = existingPm.type === "credit_card";
          } else if (pagoStr) {
            // Generar ID temporal para pagos nuevos (se crean en Firebase al confirmar)
            pmId = "NEW_" + pagoStr; 
            localPaymentMethods.push({ id: pmId, userId, name: pagoStr, type: "credit_card", created_at: Timestamp.now() });
          }

          let billingStartDate: Date | undefined = undefined;
          if (isCreditCard) {
            const isNX = pagoStr.toLowerCase().includes("nx") || pagoStr.toLowerCase().includes("naranja");
            const closingDay = isNX ? nxClosingDay : bankClosingDay;
            
            let billingMonth = startDate.getMonth();
            let billingYear = startDate.getFullYear();

            if (startDate.getDate() >= closingDay) {
              billingMonth += 2;
            } else {
              billingMonth += 1;
            }

            if (nombreStr.toLowerCase().includes("opcion") || nombreStr.toLowerCase().includes("pago digi") || nombreStr.toLowerCase().includes("opción")) {
              billingMonth -= 1;
            }

            if (billingMonth > 11) {
              billingMonth -= 12;
              billingYear += 1;
            }
            billingStartDate = new Date(billingYear, billingMonth, 1);
          }

          previewItems.push({
            id: i.toString() + "_" + Date.now(),
            title: nombreStr,
            category: catStr,
            amount,
            currency,
            is_subscription: catStr.toLowerCase().includes("suscrip"),
            installments_total: installmentsTotal,
            installments_paid: installmentsPaid,
            start_date: startDate,
            billing_start_date: billingStartDate,
            payment_method_name: pagoStr,
            payment_method_id: pmId,
            is_credit_card: isCreditCard,
          });
        }

        setParsedData(previewItems);

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error al procesar el archivo Excel/CSV.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpdateBillingMonth = (id: string, value: string) => {
    setParsedData(prev => prev ? prev.map(item => {
      if (item.id === id) {
        if (!value) {
          return { ...item, billing_start_date: undefined };
        }
        const [year, month] = value.split("-");
        return { ...item, billing_start_date: new Date(Number(year), Number(month) - 1, 1) };
      }
      return item;
    }) : null);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    setLoading(true);

    try {
      const pmMap = new Map<string, string>(); // newPmName -> pmId

      for (const item of parsedData) {
        let finalPmId = item.payment_method_id;

        if (finalPmId?.startsWith("NEW_")) {
          const pmName = item.payment_method_name;
          if (pmMap.has(pmName)) {
            finalPmId = pmMap.get(pmName)!;
          } else {
            finalPmId = await addPaymentMethod({
              userId,
              name: pmName,
              type: "credit_card",
            });
            pmMap.set(pmName, finalPmId);
          }
        }

        await addExpense({
          userId,
          title: item.title,
          category: item.category,
          amount: item.amount,
          currency: item.currency,
          is_subscription: item.is_subscription,
          installments_total: item.installments_total,
          installments_paid: item.installments_paid,
          start_date: Timestamp.fromDate(item.start_date),
          billing_start_date: item.billing_start_date ? Timestamp.fromDate(item.billing_start_date) : undefined,
          is_shared: false,
          split_count: 1,
          payment_method_id: finalPmId!,
        });
      }

      onSuccess();
      setParsedData(null);
      setShowConfig(false);
      alert("¡Gastos guardados con éxito!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al guardar en la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // MODO PREVIEW
  if (parsedData && mounted) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95">
          {/* Encabezado */}
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/50">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Revisión de Gastos ({parsedData.length})
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Ajustá el mes de cobro (Primera Cuota) si es necesario antes de guardar.
              </p>
            </div>
            <button 
              onClick={() => setParsedData(null)}
              className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabla de Preview */}
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="sticky top-0 bg-zinc-900 shadow-sm border-b border-white/10 z-10 text-xs font-semibold text-zinc-500 uppercase">
                <tr>
                  <th className="px-6 py-4">Gasto</th>
                  <th className="px-6 py-4">Pago</th>
                  <th className="px-6 py-4">Original</th>
                  <th className="px-6 py-4">Cuotas</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 border-l border-white/5 bg-emerald-500/5">Primera Cuota En</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-200">{item.title}</p>
                      <p className="text-xs text-zinc-500">{item.category}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{item.payment_method_name}</td>
                    <td className="px-6 py-4 font-mono text-zinc-400">
                      {format(item.start_date, "dd/MM/yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_subscription ? (
                        <span className="text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded text-xs">Suscripción</span>
                      ) : (
                        <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded text-xs font-mono">{item.installments_paid}/{item.installments_total}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-zinc-200">
                      {item.currency === "USD" ? "u$s" : "$"} {item.amount.toLocaleString("es-AR")}
                    </td>
                    <td className="px-6 py-4 border-l border-white/5 bg-emerald-500/5">
                      {item.is_credit_card || item.billing_start_date ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <input 
                            type="month"
                            value={item.billing_start_date ? format(item.billing_start_date, "yyyy-MM") : ""}
                            onChange={(e) => handleUpdateBillingMonth(item.id, e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-emerald-300 focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">Mismo mes</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer de Acciones */}
          <div className="p-4 border-t border-white/10 bg-zinc-900 flex justify-between items-center">
            <span className="text-sm text-zinc-400">
              Total a importar: <strong className="text-white">{parsedData.length} gastos</strong>
            </span>
            <div className="flex gap-3">
              <button 
                onClick={() => setParsedData(null)}
                disabled={loading}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmImport}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Importación
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex gap-2 w-full sm:w-auto">
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImportClick}
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
