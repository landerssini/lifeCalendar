"use client";

import { useEffect, useMemo, useState } from "react";

type WallpaperBuilderProps = {
  birthDateStorageKeyPrefix: string;
};

function getTodayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export function WallpaperBuilder({ birthDateStorageKeyPrefix }: WallpaperBuilderProps) {
  const [birthDate, setBirthDate] = useState("");
  const [previewDate, setPreviewDate] = useState(getTodayInputValue());
  const [width, setWidth] = useState("1290");
  const [height, setHeight] = useState("2796");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const keys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(birthDateStorageKeyPrefix)
    );

    if (keys.length === 0) {
      return;
    }

    const storedBirthDate = window.localStorage.getItem(keys[0]);

    if (storedBirthDate) {
      setBirthDate(storedBirthDate);
    }
  }, [birthDateStorageKeyPrefix]);

  const wallpaperUrl = useMemo(() => {
    if (!birthDate) {
      return "";
    }

    const url = new URL("/life", window.location.origin);
    url.searchParams.set("birthday", birthDate);
    url.searchParams.set("width", width || "1290");
    url.searchParams.set("height", height || "2796");

    if (previewDate) {
      url.searchParams.set("date", previewDate);
    }

    return url.toString();
  }, [birthDate, height, previewDate, width]);

  const handleCopy = async () => {
    if (!wallpaperUrl) {
      return;
    }

    await navigator.clipboard.writeText(wallpaperUrl);
    setCopied(true);

    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-screen bg-[#09090b] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">Wallpaper</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Life Calendar Lock Screen</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
              Genera una URL de imagen que puedes usar en Atajos o en tu automatización para crear
              un wallpaper que se rellena solo con la lógica de tu calendario.
            </p>
          </div>

          <a
            className="rounded-full border border-white/15 px-5 py-3 text-sm uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/8"
            href="/"
          >
            Volver
          </a>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">1</p>
                <h2 className="mt-2 text-2xl font-semibold">Configura el wallpaper</h2>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Fecha de nacimiento</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setBirthDate(event.target.value)}
                  type="date"
                  value={birthDate}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Fecha para la preview</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setPreviewDate(event.target.value)}
                  type="date"
                  value={previewDate}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-white/70">Width</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                    onChange={(event) => setWidth(event.target.value)}
                    type="number"
                    value={width}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm text-white/70">Height</span>
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                    onChange={(event) => setHeight(event.target.value)}
                    type="number"
                    value={height}
                  />
                </label>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">2</p>
                <h3 className="mt-2 text-lg font-semibold">Usa esta URL en Atajos</h3>
                <div className="mt-3 flex items-stretch gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75 outline-none"
                    readOnly
                    value={wallpaperUrl || "Completa primero la fecha de nacimiento"}
                  />
                  <button
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/8"
                    disabled={!wallpaperUrl}
                    onClick={handleCopy}
                    type="button"
                  >
                    {copied ? "Copiada" : "Copiar"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-300/8 p-4 text-sm leading-relaxed text-amber-50/85">
                En Atajos usa `Obtener contenido de URL` con esta dirección y luego `Establecer
                fondo de pantalla`. La imagen saldrá directamente desde `/life` con tu progreso y
                el tamaño que indiques.
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Preview</p>
                <h2 className="mt-2 text-2xl font-semibold">Wallpaper generado por URL</h2>
              </div>

              <a
                className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:bg-white/8"
                href={wallpaperUrl || "#"}
                rel="noreferrer"
                target="_blank"
              >
                Abrir imagen
              </a>
            </div>

            <div className="flex min-h-[720px] items-center justify-center rounded-[2rem] border border-white/10 bg-black/30 p-4">
              {wallpaperUrl ? (
                <img
                  alt="Wallpaper preview"
                  className="h-auto max-h-[760px] rounded-[2.5rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                  src={wallpaperUrl}
                />
              ) : (
                <p className="max-w-sm text-center text-sm leading-relaxed text-white/45">
                  Introduce tu fecha de nacimiento para generar la preview y la URL del wallpaper.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
