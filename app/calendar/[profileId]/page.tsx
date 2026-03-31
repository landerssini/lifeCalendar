"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LifeCalendar } from "@/components/LifeCalendar";
import {
  PROFILES_STORAGE_KEY,
  parseStoredProfiles,
  type LifeProfile,
} from "@/lib/profiles";

type CalendarPageProps = {
  params: {
    profileId: string;
  };
};

export default function CalendarPage({ params }: CalendarPageProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<LifeProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProfiles = parseStoredProfiles(
      window.localStorage.getItem(PROFILES_STORAGE_KEY),
    );

    setProfiles(storedProfiles);
    setLoading(false);
  }, []);

  const profile = useMemo(() => {
    return profiles.find((candidate) => candidate.id === params.profileId) ?? null;
  }, [params.profileId, profiles]);

  const handleDeleteProfile = () => {
    if (!profile) {
      return;
    }

    const shouldDelete = window.confirm(
      `Se borrará el perfil "${profile.name}" de este navegador. Esta acción no se puede deshacer.`,
    );

    if (!shouldDelete) {
      return;
    }

    const nextProfiles = profiles.filter((candidate) => candidate.id !== profile.id);
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(nextProfiles));
    router.push("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-poster text-paperWhite">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">Life Calendar</p>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border border-paperWhite/20 border-t-paperWhite" />
          <p className="text-lg text-paperWhite/85">Cargando el calendario…</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="bg-poster flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl rounded-[2rem] border border-paperWhite/20 bg-black/10 p-8 text-center text-paperWhite shadow-poster backdrop-blur">
          <p className="text-xs uppercase tracking-[0.45em] text-paperWhite/60">Life Calendar</p>
          <h1 className="mt-4 text-3xl font-semibold">No hemos encontrado ese perfil</h1>
          <p className="mt-4 text-base leading-relaxed text-paperWhite/75">
            Puede que se haya borrado o que este navegador no tenga guardado ese calendario.
          </p>
          <button
            className="mt-8 rounded-full border border-paperWhite/25 bg-paperWhite px-6 py-3 text-sm font-medium text-ink transition hover:bg-white"
            onClick={() => router.push("/")}
            type="button"
          >
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <LifeCalendar
      onBackToProfiles={() => router.push("/")}
      onDeleteProfile={handleDeleteProfile}
      onEditProfile={() => router.push(`/?edit=${profile.id}`)}
      profile={profile}
    />
  );
}
