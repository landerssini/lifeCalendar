"use client";

import { useEffect, useMemo, useState } from "react";
import type { LifeProfile } from "@/lib/profiles";

type BirthDateFormProps = {
  editingProfile: LifeProfile | null;
  onCancelEdit: () => void;
  onDeleteProfile: (profileId: string) => void;
  onOpenProfile: (profileId: string) => void;
  onSave: (values: { birthDate: string; name: string }) => void;
  onStartEdit: (profileId: string) => void;
  profiles: LifeProfile[];
};

const formatTodayForInput = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split("T")[0];
};

const formatBirthDateLabel = (birthDate: string) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${birthDate}T00:00:00`));
};

export function BirthDateForm({
  editingProfile,
  onCancelEdit,
  onDeleteProfile,
  onOpenProfile,
  onSave,
  onStartEdit,
  profiles,
}: BirthDateFormProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const maxDate = useMemo(() => formatTodayForInput(), []);

  useEffect(() => {
    if (editingProfile) {
      setName(editingProfile.name);
      setBirthDate(editingProfile.birthDate);
      setError(null);
      return;
    }

    setName("");
    setBirthDate("");
    setError(null);
  }, [editingProfile]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Pon un nombre para distinguir este calendario.");
      return;
    }

    if (!birthDate) {
      setError("Introduce la fecha de nacimiento para construir el calendario.");
      return;
    }

    const selectedDate = new Date(`${birthDate}T00:00:00`);
    const today = new Date();

    if (Number.isNaN(selectedDate.getTime())) {
      setError("La fecha no es válida.");
      return;
    }

    if (selectedDate > today) {
      setError("La fecha de nacimiento no puede estar en el futuro.");
      return;
    }

    setError(null);
    onSave({
      birthDate,
      name: name.trim(),
    });
  };

  return (
    <main className="bg-poster min-h-screen px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-8 shadow-poster backdrop-blur">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.45em] text-paperWhite/65">
                Life Calendar
              </p>
              <h1 className="text-balance text-4xl font-semibold leading-tight md:text-6xl">
                Un calendario por persona,
                <br />
                todo guardado en este navegador.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-paperWhite/80">
                No hace falta cuenta ni login. Guarda nombre y fecha de nacimiento para crear
                varios calendarios en el mismo dispositivo, abrirlos cuando quieras y editarlos
                o borrarlos más tarde.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-paperWhite/70">
                <span className="rounded-full border border-paperWhite/15 px-4 py-2">
                  Sin registro
                </span>
                <span className="rounded-full border border-paperWhite/15 px-4 py-2">
                  Datos solo en localStorage
                </span>
                <span className="rounded-full border border-paperWhite/15 px-4 py-2">
                  Varios perfiles por navegador
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-paperWhite/15 bg-black/20 p-6">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                  {editingProfile ? "Editar perfil" : "Nuevo perfil"}
                </p>
                <h2 className="text-2xl font-semibold text-paperWhite">
                  {editingProfile ? `Actualiza a ${editingProfile.name}` : "Crea un calendario"}
                </h2>
                <p className="text-sm leading-relaxed text-paperWhite/75">
                  El nombre se usa para distinguir calendarios guardados en este mismo navegador.
                </p>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">
                    Nombre
                  </span>
                  <input
                    className="w-full rounded-2xl border border-paperWhite/20 bg-black/20 px-5 py-4 text-lg text-paperWhite outline-none transition placeholder:text-paperWhite/35 focus:border-paperWhite/55 focus:bg-black/30"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Por ejemplo: Daniel"
                    type="text"
                    value={name}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm uppercase tracking-[0.35em] text-paperWhite/70">
                    Fecha de nacimiento
                  </span>
                  <input
                    className="w-full rounded-2xl border border-paperWhite/20 bg-black/20 px-5 py-4 text-lg text-paperWhite outline-none transition placeholder:text-paperWhite/35 focus:border-paperWhite/55 focus:bg-black/30"
                    max={maxDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                    type="date"
                    value={birthDate}
                  />
                </label>

                {error ? (
                  <p className="rounded-2xl border border-red-200/20 bg-red-100/10 px-4 py-3 text-sm text-red-50/90">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    className="flex-1 rounded-full border border-paperWhite/25 bg-paperWhite px-6 py-4 text-lg font-medium text-ink transition hover:scale-[1.01] hover:bg-white"
                    type="submit"
                  >
                    {editingProfile ? "Guardar cambios" : "Crear calendario"}
                  </button>

                  {editingProfile ? (
                    <button
                      className="rounded-full border border-paperWhite/25 px-6 py-4 text-sm font-medium text-paperWhite transition hover:bg-paperWhite/10"
                      onClick={onCancelEdit}
                      type="button"
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-8 shadow-poster backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                Perfiles guardados
              </p>
              <h2 className="text-2xl font-semibold text-paperWhite md:text-3xl">
                {profiles.length > 0
                  ? `${profiles.length} calendario${profiles.length === 1 ? "" : "s"} en este navegador`
                  : "Todavía no hay calendarios guardados"}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-paperWhite/75">
                Puedes abrir cualquier perfil, editar su nombre o fecha y borrarlo cuando ya no lo
                necesites.
              </p>
            </div>
          </div>

          {profiles.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {profiles.map((profile) => (
                <article
                  key={profile.id}
                  className="rounded-[1.5rem] border border-paperWhite/15 bg-black/20 p-5"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.28em] text-paperWhite/50">
                      Perfil local
                    </p>
                    <h3 className="text-2xl font-semibold text-paperWhite">{profile.name}</h3>
                    <p className="text-sm text-paperWhite/75">
                      Nacimiento: {formatBirthDateLabel(profile.birthDate)}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-paperWhite/25 bg-paperWhite px-4 py-2 text-sm font-medium text-ink transition hover:bg-white"
                      onClick={() => onOpenProfile(profile.id)}
                      type="button"
                    >
                      Abrir calendario
                    </button>
                    <button
                      className="rounded-full border border-paperWhite/20 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
                      onClick={() => onStartEdit(profile.id)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-full border border-red-200/25 px-4 py-2 text-sm text-red-50 transition hover:bg-red-100/10"
                      onClick={() => onDeleteProfile(profile.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-paperWhite/15 bg-black/15 p-6 text-sm leading-relaxed text-paperWhite/70">
              Crea el primer perfil para empezar. Todo se guarda solo en este navegador, así que
              puedes tener varios calendarios personales sin depender de cuentas ni servicios
              externos.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
