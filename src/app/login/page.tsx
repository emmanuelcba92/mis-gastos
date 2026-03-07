"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoginButton } from "@/components/auth/LoginButton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
            {/* Background glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative bg-slate-900/80 backdrop-blur-xl border-slate-800/60 shadow-2xl shadow-emerald-500/5">
                <CardHeader className="text-center space-y-4 pb-2">
                    {/* Logo / Icon */}
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                        <svg
                            className="w-8 h-8 text-white"
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

                    <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                            Mis Gastos
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-2 text-sm">
                            Control inteligente de gastos proyectados.
                            <br />
                            Cuotas, tickets y más — todo en un solo lugar.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-6 pt-4 pb-8">
                    <LoginButton />

                    <p className="text-xs text-slate-500 text-center max-w-[280px]">
                        Iniciá sesión con tu cuenta de Google para acceder a tu panel de
                        gastos personales.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
