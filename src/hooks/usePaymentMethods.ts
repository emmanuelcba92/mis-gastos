"use client";

import { useState, useEffect } from "react";
import type { PaymentMethod } from "@/types";
import { subscribeToPaymentMethods } from "@/lib/services/payment-method-service";
import { useAuth } from "@/contexts/AuthContext";

export function usePaymentMethods() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPaymentMethods([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToPaymentMethods(user.uid, (methods) => {
      setPaymentMethods(methods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Helpers
  const getMethodById = (id: string) => paymentMethods.find((m) => m.id === id);
  const creditCards = paymentMethods.filter((m) => m.type === "credit_card");

  return {
    paymentMethods,
    creditCards,
    getMethodById,
    loading,
  };
}
