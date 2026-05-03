import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mis Gastos — Control de Suscripciones & Tarjetas",
  description:
    "Control inteligente de suscripciones de Software/IA, cuotas con tarjeta de crédito y gastos compartidos. Adaptado para Argentina.",
  keywords: ["gastos", "suscripciones", "tarjetas", "cuotas", "argentina", "finanzas personales"],
  openGraph: {
    title: "Mis Gastos",
    description: "Control inteligente de suscripciones y gastos con tarjeta",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
