"use client";

import { useEffect, useMemo, useState } from "react";
import type { CalendarViewMode } from "@/lib/date";
import { WALLPAPER_DEVICE_OVERRIDES } from "@/lib/wallpaper";

function getTodayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

type PresetId =
  | "iphone-16-pro-max"
  | "iphone-16-pro"
  | "iphone-14-plus"
  | "iphone-13-14"
  | "iphone-se";

type Preset = {
  height: number;
  id: PresetId;
  key: keyof typeof WALLPAPER_DEVICE_OVERRIDES;
  label: string;
  width: number;
};

const PRESETS: Preset[] = [
  {
    id: "iphone-16-pro-max",
    key: "1290x2796",
    label: "iPhone 16 Pro Max / 15 Pro Max",
    width: 1290,
    height: 2796,
  },
  {
    id: "iphone-16-pro",
    key: "1179x2556",
    label: "iPhone 16 Pro / 15 Pro / 15 / 14 Pro",
    width: 1179,
    height: 2556,
  },
  {
    id: "iphone-14-plus",
    key: "1284x2778",
    label: "iPhone 14 Plus / 13 Pro Max / 12 Pro Max",
    width: 1284,
    height: 2778,
  },
  {
    id: "iphone-13-14",
    key: "1170x2532",
    label: "iPhone 14 / 13 / 13 Pro / 12 / 12 Pro",
    width: 1170,
    height: 2532,
  },
  {
    id: "iphone-se",
    key: "750x1334",
    label: "iPhone SE / modelos compactos",
    width: 750,
    height: 1334,
  },
];

export function LifeUrlTester() {
  const [birthday, setBirthday] = useState("1998-02-03");
  const [date, setDate] = useState(getTodayInputValue());
  const [mode, setMode] = useState<CalendarViewMode>("birthday");
  const [simulatePointDay, setSimulatePointDay] = useState(false);
  const [selectedPresetId, setSelectedPresetId] =
    useState<PresetId>("iphone-16-pro-max");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const selectedPreset = useMemo(
    () => PRESETS.find((preset) => preset.id === selectedPresetId) ?? PRESETS[0],
    [selectedPresetId],
  );

  const selectedOverride = WALLPAPER_DEVICE_OVERRIDES[selectedPreset.key];

  const lifeUrl = useMemo(() => {
    if (!origin) {
      return "";
    }

    const url = new URL("/life", origin);
    url.searchParams.set("birthday", birthday);
    url.searchParams.set("width", String(selectedPreset.width));
    url.searchParams.set("height", String(selectedPreset.height));
    url.searchParams.set("mode", mode);

    if (date) {
      url.searchParams.set("date", date);
    }

    if (simulatePointDay) {
      url.searchParams.set("forcePointDay", "1");
    }

    return url.toString();
  }, [birthday, date, mode, origin, selectedPreset, simulatePointDay]);

  const generatedCode = useMemo(
    () =>
      `export const WALLPAPER_DEVICE_OVERRIDES = ${JSON.stringify(
        WALLPAPER_DEVICE_OVERRIDES,
        null,
        2,
      )} as const;`,
    [],
  );

  return (
    <main className="min-h-screen bg-[#0a0a0d] px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/45">
              Test
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-5xl">
              Vista previa del wallpaper
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65 md:text-base">
              Selecciona una pantalla y comprueba el fondo final con los
              parámetros ya fijados en código.
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
                <span className="text-sm text-white/70">Cumpleaños</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setBirthday(event.target.value)}
                  type="date"
                  value={birthday}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Fecha de prueba</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Modo</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) => setMode(event.target.value as CalendarViewMode)}
                  value={mode}
                >
                  <option className="bg-[#101014]" value="birthday">
                    Visual por cumpleaños
                  </option>
                  <option className="bg-[#101014]" value="real">
                    Semanas reales
                  </option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Pantalla</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-white/30"
                  onChange={(event) =>
                    setSelectedPresetId(event.target.value as PresetId)
                  }
                  value={selectedPresetId}
                >
                  {PRESETS.map((preset) => (
                    <option className="bg-[#101014]" key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className={`w-full rounded-2xl border px-5 py-4 text-sm font-medium uppercase tracking-[0.2em] transition ${
                  simulatePointDay
                    ? "border-white bg-white text-[#0a0a0d]"
                    : "border-white/15 bg-white/[0.06] hover:bg-white/10"
                }`}
                onClick={() => setSimulatePointDay((current) => !current)}
                type="button"
              >
                {simulatePointDay
                  ? "Desactivar día de punto"
                  : "Simular día de punto"}
              </button>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                  Parámetros hardcodeados
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Padding izquierda: {selectedOverride.dotPaddingLeft}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Ancho retícula: {selectedOverride.dotAreaWidth}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Alto retícula: {selectedOverride.dotAreaHeight}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                  URL
                </p>
                <p className="mt-3 break-all text-sm leading-relaxed text-white/70">
                  {lifeUrl}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur md:p-6">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">
                Vista previa
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {selectedPreset.label}
              </h2>
            </div>

            <div className="flex min-h-[760px] items-center justify-center rounded-[2rem] border border-white/10 bg-black/30 p-4">
              {lifeUrl ? (
                <img
                  alt={`Preview ${selectedPreset.label}`}
                  className="h-auto max-h-[780px] rounded-[2.5rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
                  src={lifeUrl}
                />
              ) : (
                <p className="max-w-sm text-center text-sm leading-relaxed text-white/45">
                  Esperando a que se monte la URL local para renderizar la
                  vista previa.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            Constantes actuales
          </p>
          <textarea
            className="mt-4 min-h-[260px] w-full rounded-[1.5rem] border border-white/10 bg-black/30 p-4 font-mono text-sm leading-relaxed text-white/80 outline-none"
            readOnly
            value={generatedCode}
          />
        </section>
      </div>
    </main>
  );
}
