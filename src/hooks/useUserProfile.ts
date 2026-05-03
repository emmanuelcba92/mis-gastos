"use client";

import { useState, useEffect } from "react";
import type { UserProfile, SalaryStatus } from "@/types";
import { getSalaryStatus } from "@/types";
import { subscribeToUserProfile } from "@/lib/services/user-service";
import { useAuth } from "@/contexts/AuthContext";

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserProfile(user.uid, (p) => {
      setProfile(p);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const checkSalaryStatus = (totalExpenses: number): SalaryStatus => {
    return getSalaryStatus(totalExpenses, profile?.monthly_salary || 0);
  };

  return {
    profile,
    loading,
    checkSalaryStatus,
  };
}
