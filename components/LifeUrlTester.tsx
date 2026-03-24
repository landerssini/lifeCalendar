"use client";

import { useEffect, useMemo, useState } from "react";

function getTodayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

type RequestState = "idle" | "loading" | "success" | "error";

export function LifeUrlTester() {
  const [birthday, setBirthday] = useState("1998-02-03");
  const [width, setWidth] = useState("1290");
  const [height, setHeight] = useState("2796");
  const [date, setDate] = useState(getTodayInputValue());
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [statusText, setStatusText] = useState("Todavia no se ha lanzado ninguna prueba.");
  const [imageUrl, setImageUrl] = useState("");
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const lifeUrl = useMemo(() => {
    if (!origin) {
      return "";
    }

    const url = new URL("/life", origin);
    url.searchParams.set("birthday", birthday);
    url.searchParams.set("width", width || "1290");
    url.searchParams.set("height", height || "2796");

    if (date) {
      url.searchParams.set("date", date);
    }

    return url.toString();
  }, [birthday, date, height, origin, width]);

  const runTest = async () => {
    if (!lifeUrl) {
      return;
    }

    setRequestState("loading");
    setStatusText("Cargando imagen...");
    setResponseTime(null);

    const startedAt = performance.now();

    try {
      const response = await fetch(lifeUrl, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const elapsed = Math.round(performance.now() - startedAt);

      setImageUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return objectUrl;
      });
      setResponseTime(elapsed);
      setRequestState("success");
      setStatusText(`Imagen generada correctamente en ${elapsed} ms.`);
    } catch (error) {
      const elapsed = Math.round(performance.now() - startedAt);
      const message = error instanceof Error ? error.message : "Error desconocido";
      setResponseTime(elapsed);
      setRequestState("error");
      setStatusText(`Fallo tras ${elapsed} ms: ${message}`);
    }
  };

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <main className="min-h-screen bg-[#0a0a0d] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">Test</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Life URL Tester</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
              Comprueba si la ruta de imagen `/life` está generando bien el wallpaper y cuánto
              tarda en responder.
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
            <div className="space-y-5">
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Birthday</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setBirthday(event.target.value)}
                  type="date"
                  value={birthday}
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

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Date de prueba</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </label>

              <button
                className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-sm font-medium uppercase tracking-[0.2em] transition hover:bg-white/10"
                onClick={runTest}
                type="button"
              >
                Lanzar prueba
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Estado</p>
                <p className="mt-3 text-sm leading-relaxed text-white/80">{statusText}</p>
                {responseTime !== null ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/45">
                    {requestState === "success" ? "Tiempo de respuesta" : "Tiempo hasta error"}:{" "}
                    {responseTime} ms
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">URL</p>
                <p className="mt-3 break-all text-sm leading-relaxed text-white/70">{lifeUrl}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">Preview</p>
              <h2 className="mt-2 text-2xl font-semibold">Respuesta de la ruta</h2>
            </div>

            <div className="flex min-h-[760px] items-center justify-center rounded-[2rem] border border-white/10 bg-black/30 p-4">
              {requestState === "loading" ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border border-white/15 border-t-white" />
                  <p className="text-sm text-white/65">Generando wallpaper...</p>
                </div>
              ) : null}

              {requestState === "error" ? (
                <p className="max-w-md text-center text-sm leading-relaxed text-red-200/80">
                  La ruta ha fallado. Mira el estado de la izquierda y la consola del servidor.
                </p>
              ) : null}

              {requestState === "success" && imageUrl ? (
                <img
                  alt="Life route preview"
                  className="h-auto max-h-[780px] rounded-[2.5rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                  src={imageUrl}
                />
              ) : null}

              {requestState === "idle" ? (
                <p className="max-w-sm text-center text-sm leading-relaxed text-white/45">
                  Pulsa `Lanzar prueba` para comprobar si la ruta `/life` está respondiendo bien.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
