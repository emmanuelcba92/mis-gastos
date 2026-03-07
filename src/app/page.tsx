"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  const currentDate = new Date();
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-100">Mis Gastos</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-200">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Avatar className="h-9 w-9 border-2 border-slate-700">
              <AvatarImage
                src={user.photoURL || undefined}
                alt={user.displayName || "Usuario"}
              />
              <AvatarFallback className="bg-emerald-600 text-white text-sm">
                {user.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-4 py-8">
        {/* Month indicator */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-100">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <p className="text-slate-400 mt-1">Resumen de gastos proyectados</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Gasto Total del Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-400">$0</p>
              <p className="text-xs text-slate-500 mt-1">
                Fijos + cuotas activas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Gastos Fijos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">$0</p>
              <p className="text-xs text-slate-500 mt-1">Recurrentes</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 backdrop-blur-xl border-slate-800/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Cuotas Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-400">0</p>
              <p className="text-xs text-slate-500 mt-1">
                Compras en cuotas vigentes
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="bg-slate-800/60 mb-8" />

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-slate-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            No hay gastos registrados
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Cargá tu primer gasto escaneando un ticket o ingresándolo
            manualmente. ¡Empezá a controlar tus finanzas!
          </p>
        </div>
      </main>
    </div>
  );
}
