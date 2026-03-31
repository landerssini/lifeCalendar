"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BirthDateForm } from "@/components/BirthDateForm";
import {
  PROFILES_STORAGE_KEY,
  createProfileId,
  parseStoredProfiles,
  sortProfiles,
  type LifeProfile,
} from "@/lib/profiles";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-poster text-paperWhite">
          <div className="space-y-4 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">Life Calendar</p>
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border border-paperWhite/20 border-t-paperWhite" />
          </div>
        </main>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editProfileId = searchParams.get("edit");
  const [profiles, setProfiles] = useState<LifeProfile[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedProfiles = parseStoredProfiles(
      window.localStorage.getItem(PROFILES_STORAGE_KEY),
    );

    setProfiles(storedProfiles);
    setLoading(false);
  }, []);

  useEffect(() => {
    setEditingProfileId(editProfileId);
  }, [editProfileId]);

  const persistProfiles = (nextProfiles: LifeProfile[]) => {
    const sortedProfiles = sortProfiles(nextProfiles);
    setProfiles(sortedProfiles);
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(sortedProfiles));
  };

  const editingProfile = useMemo(() => {
    return profiles.find((profile) => profile.id === editingProfileId) ?? null;
  }, [editingProfileId, profiles]);

  const handleSaveProfile = ({
    birthDate,
    name,
  }: {
    birthDate: string;
    name: string;
  }) => {
    const now = new Date().toISOString();

    if (editingProfile) {
      const nextProfiles = profiles.map((profile) =>
        profile.id === editingProfile.id
          ? {
              ...profile,
              birthDate,
              name,
              updatedAt: now,
            }
          : profile,
      );

      persistProfiles(nextProfiles);
      setEditingProfileId(null);
      router.push(`/calendar/${editingProfile.id}`);
      return;
    }

    const nextProfile: LifeProfile = {
      birthDate,
      createdAt: now,
      id: createProfileId(),
      name,
      updatedAt: now,
    };

    persistProfiles([nextProfile, ...profiles]);
    router.push(`/calendar/${nextProfile.id}`);
  };

  const handleDeleteProfile = (profileId: string) => {
    const profile = profiles.find((candidate) => candidate.id === profileId);

    if (!profile) {
      return;
    }

    const shouldDelete = window.confirm(
      `Se borrará el perfil "${profile.name}" de este navegador. Esta acción no se puede deshacer.`,
    );

    if (!shouldDelete) {
      return;
    }

    const nextProfiles = profiles.filter((candidate) => candidate.id !== profileId);
    persistProfiles(nextProfiles);

    if (editingProfileId === profileId) {
      setEditingProfileId(null);
      router.replace("/");
    }
  };

  const handleStartEdit = (profileId: string) => {
    setEditingProfileId(profileId);
    router.push(`/?edit=${profileId}`);
  };

  const handleOpenProfile = (profileId: string) => {
    router.push(`/calendar/${profileId}`);
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    router.replace("/");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-poster text-paperWhite">
        <div className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">Life Calendar</p>
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border border-paperWhite/20 border-t-paperWhite" />
          <p className="text-lg text-paperWhite/85">Preparando tus calendarios guardados…</p>
        </div>
      </main>
    );
  }

  return (
    <BirthDateForm
      editingProfile={editingProfile}
      onCancelEdit={handleCancelEdit}
      onDeleteProfile={handleDeleteProfile}
      onOpenProfile={handleOpenProfile}
      onSave={handleSaveProfile}
      onStartEdit={handleStartEdit}
      profiles={profiles}
    />
  );
}
