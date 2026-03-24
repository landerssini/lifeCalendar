"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type LoginProps = {
  authError: string | null;
  supabaseConfigured: boolean;
};

export function Login({ authError, supabaseConfigured }: LoginProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleMagicLinkLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabaseConfigured) {
      setLocalError("Configura Supabase en .env.local antes de iniciar sesión.");
      return;
    }

    if (!email.trim()) {
      setLocalError("Introduce tu email para recibir el magic link.");
      return;
    }

    try {
      setLoading(true);
      setLocalError(null);
      setSuccessMessage(null);

      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Te hemos enviado un enlace mágico. Abre tu email para continuar.");
    } catch (error) {
      const nextMessage =
        error instanceof Error ? error.message : "No se pudo enviar el magic link.";

      setLocalError(nextMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-poster flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-paperWhite/20 bg-black/10 p-8 shadow-poster backdrop-blur">
        <div className="space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.45em] text-paperWhite/65">Life Calendar</p>
          <h1 className="text-balance text-5xl font-semibold leading-none md:text-7xl">
            Mira tu vida,
            <br />
            semana a semana.
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-paperWhite/80">
            Entra con un magic link, guarda tu fecha de nacimiento y deja que el poster se
            actualice solo cada vez que vuelvas.
          </p>
        </div>

        <form
          className="mt-10 space-y-4"
          onSubmit={handleMagicLinkLogin}
        >
          <label className="block space-y-2">
            <span className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">Email</span>
            <input
              autoComplete="email"
              className="w-full rounded-2xl border border-paperWhite/20 bg-black/20 px-5 py-4 text-lg text-paperWhite outline-none transition placeholder:text-paperWhite/35 focus:border-paperWhite/55 focus:bg-black/30"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              type="email"
              value={email}
            />
          </label>

          <button
            className="flex w-full items-center justify-center rounded-full border border-paperWhite/30 bg-paperWhite px-6 py-4 text-lg font-medium text-ink transition hover:scale-[1.01] hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "Enviando enlace…" : "Enviar magic link"}
          </button>

          {!supabaseConfigured ? (
            <p className="rounded-2xl border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-sm text-amber-50/90">
              Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en
              `.env.local`.
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-2xl border border-emerald-200/20 bg-emerald-100/10 px-4 py-3 text-sm text-emerald-50/90">
              {successMessage}
            </p>
          ) : null}

          {authError || localError ? (
            <p className="rounded-2xl border border-red-200/20 bg-red-100/10 px-4 py-3 text-sm text-red-50/90">
              {localError ?? authError}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
