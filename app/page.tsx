"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BirthDateForm } from "@/components/BirthDateForm";
import { LifeCalendar } from "@/components/LifeCalendar";
import { Login } from "@/components/Login";
import { getSupabaseBrowserClient, hasSupabaseEnv } from "@/lib/supabase";

const getBirthDateStorageKey = (userId: string) => `life-calendar:birthDate:${userId}`;

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [birthDateLoading, setBirthDateLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setAuthLoading(false);
      setBirthDateLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setBirthDate(null);
      setBirthDateLoading(false);
      return;
    }

    setBirthDateLoading(true);

    const storageKey = getBirthDateStorageKey(session.user.id);
    const storedBirthDate = window.localStorage.getItem(storageKey);

    setBirthDate(storedBirthDate);
    setBirthDateLoading(false);
  }, [session?.user]);

  const userLabel = useMemo(() => {
    return session?.user.user_metadata.full_name ?? session?.user.email ?? "tu cuenta";
  }, [session]);

  const handleBirthDateSave = (nextBirthDate: string) => {
    if (!session?.user) {
      return;
    }

    const storageKey = getBirthDateStorageKey(session.user.id);
    window.localStorage.setItem(storageKey, nextBirthDate);
    setBirthDate(nextBirthDate);
  };

  const handleBirthDateReset = () => {
    if (!session?.user) {
      return;
    }

    const storageKey = getBirthDateStorageKey(session.user.id);
    window.localStorage.removeItem(storageKey);
    setBirthDate(null);
  };

  if (authLoading || birthDateLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-poster text-paperWhite">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">Life Calendar</p>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border border-paperWhite/20 border-t-paperWhite" />
          <p className="text-lg text-paperWhite/85">Preparando tu calendario de vida…</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <Login
        authError={authError}
        supabaseConfigured={hasSupabaseEnv}
      />
    );
  }

  if (!birthDate) {
    return (
      <BirthDateForm
        userLabel={userLabel}
        onSave={handleBirthDateSave}
      />
    );
  }

  return (
    <LifeCalendar
      birthDate={birthDate}
      onResetBirthDate={handleBirthDateReset}
      session={session}
    />
  );
}
