"use client";

import { useMemo, useState } from "react";

type BirthDateFormProps = {
  onSave: (birthDate: string) => void;
  userLabel: string;
};

const formatTodayForInput = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split("T")[0];
};

export function BirthDateForm({ onSave, userLabel }: BirthDateFormProps) {
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const maxDate = useMemo(() => formatTodayForInput(), []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!birthDate) {
      setError("Introduce tu fecha de nacimiento para construir el calendario.");
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
    onSave(birthDate);
  };

  return (
    <main className="bg-poster flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-paperWhite/20 bg-black/10 p-8 shadow-poster backdrop-blur">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-paperWhite/65">Life Calendar</p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Tu punto de partida</h1>
          <p className="text-lg leading-relaxed text-paperWhite/80">
            Hola, {userLabel}. Guarda tu fecha de nacimiento para pintar automáticamente cada
            semana que ya has vivido.
          </p>
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={handleSubmit}
        >
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

          <button
            className="w-full rounded-full border border-paperWhite/25 bg-paperWhite px-6 py-4 text-lg font-medium text-ink transition hover:scale-[1.01] hover:bg-white"
            type="submit"
          >
            Crear mi calendario
          </button>
        </form>
      </div>
    </main>
  );
}
