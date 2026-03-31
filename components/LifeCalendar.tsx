"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getBirthdayRowWeeksLived,
  getDisplayedNextMarkDate,
  getDisplayedWeekDateLabel,
  getDisplayedWeeksLived,
  formatLongDate,
  getHundredthBirthday,
  getDaysLived,
  getWeeksLived,
  getYearsLived,
  isDisplayedPointMarkDay,
  type CalendarViewMode,
} from "@/lib/date";
import { downloadIcsCalendar } from "@/lib/calendar";
import type { LifeProfile } from "@/lib/profiles";

type LifeCalendarProps = {
  onBackToProfiles: () => void;
  onDeleteProfile: () => void;
  onEditProfile: () => void;
  profile: LifeProfile;
};

type HoveredWeek = {
  x: number;
  y: number;
  weekIndex: number;
};

type Calibration = {
  startX: number;
  startY: number;
  dotGapX: number;
  dotGapY: number;
  horizontalBlockGaps: [number, number, number, number];
  verticalBlockGaps: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  tailGapX: number;
  tailOffsetY: number;
  pointRadius: number;
  pointStyle: "clean" | "handmade";
  handmadeJitter: number;
  handmadeRadiusJitter: number;
  handmadeStroke: number;
  livedColor: string;
  futureColor: string;
  livedOpacity: number;
  futureOpacity: number;
};

type WallpaperPreset = {
  height: number;
  id:
    | "iphone-16-pro-max"
    | "iphone-16-pro"
    | "iphone-14-plus"
    | "iphone-13-14"
    | "iphone-se"
    | "custom";
  label: string;
  width: number;
};

const TOTAL_WEEKS = 52 * 100;
const WEEKS_PER_ROW = 52;
const DESIGN_WIDTH = 1866;
const DESIGN_HEIGHT = 2596;

// Approximate calibration for the current poster artwork.
const DEFAULT_CALIBRATION: Calibration = {
  startX: 554,
  startY: 160,
  dotGapX: 21.3,
  dotGapY: 21.4,
  horizontalBlockGaps: [18.7, 18, 19.7, 19.4],
  verticalBlockGaps: [19.9, 15, 18, 18.4, 16.4, 17.7, 18.3, 18, 17.4],
  tailGapX: 229.4,
  tailOffsetY: 0,
  pointRadius: 6,
  pointStyle: "handmade",
  handmadeJitter: 1.4,
  handmadeRadiusJitter: 0.9,
  handmadeStroke: 0.8,
  livedColor: "#000000",
  futureColor: "#ffffff",
  livedOpacity: 0.98,
  futureOpacity: 1,
} as const;

const hoverRadius = 11;
const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: "iphone-16-pro-max",
    label: "iPhone 16 Pro Max / 15 Pro Max",
    width: 1290,
    height: 2796,
  },
  {
    id: "iphone-16-pro",
    label: "iPhone 16 Pro / 15 Pro / 15 / 14 Pro",
    width: 1179,
    height: 2556,
  },
  {
    id: "iphone-14-plus",
    label: "iPhone 14 Plus / 13 Pro Max / 12 Pro Max",
    width: 1284,
    height: 2778,
  },
  {
    id: "iphone-13-14",
    label: "iPhone 14 / 13 / 13 Pro / 12 / 12 Pro",
    width: 1170,
    height: 2532,
  },
  {
    id: "iphone-se",
    label: "iPhone SE / modelos compactos",
    width: 750,
    height: 1334,
  },
  {
    id: "custom",
    label: "Personalizado",
    width: 1290,
    height: 2796,
  },
];

const sumUntil = (values: number[], count: number) =>
  values
    .slice(0, Math.max(0, count))
    .reduce((total, value) => total + value, 0);

function normalizeWallpaperDimension(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 320) {
    return fallback;
  }

  return parsed;
}

export function LifeCalendar({
  onBackToProfiles,
  onDeleteProfile,
  onEditProfile,
  profile,
}: LifeCalendarProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const stampFrameRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredWeek, setHoveredWeek] = useState<HoveredWeek | null>(null);
  const [stampingWeekIndex, setStampingWeekIndex] = useState<number | null>(
    null,
  );
  const [stampScale, setStampScale] = useState(1);
  const [pageFlashActive, setPageFlashActive] = useState(false);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("birthday");
  const [origin, setOrigin] = useState("");
  const [copiedWallpaperUrl, setCopiedWallpaperUrl] = useState(false);
  const [wallpaperPresetId, setWallpaperPresetId] =
    useState<WallpaperPreset["id"]>("iphone-16-pro-max");
  const [customWallpaperWidth, setCustomWallpaperWidth] = useState("1290");
  const [customWallpaperHeight, setCustomWallpaperHeight] = useState("2796");
  const [simulatePointDay, setSimulatePointDay] = useState(false);
  const calibration = DEFAULT_CALIBRATION;
  const birthDate = profile.birthDate;
  const birthDateObject = useMemo(
    () => new Date(`${birthDate}T00:00:00`),
    [birthDate],
  );
  const referenceDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);
  const viewModeStorageKey = useMemo(
    () => `life-calendar:viewMode:${profile.id}`,
    [profile.id],
  );

  useEffect(() => {
    const storedMode = window.localStorage.getItem(viewModeStorageKey);

    if (storedMode === "birthday" || storedMode === "real") {
      setViewMode(storedMode);
    }
  }, [viewModeStorageKey]);

  useEffect(() => {
    window.localStorage.setItem(viewModeStorageKey, viewMode);
  }, [viewMode, viewModeStorageKey]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const realWeeksLived = useMemo(
    () => getWeeksLived(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const birthdayWeeksLived = useMemo(
    () => getDisplayedWeeksLived("birthday", birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const displayedWeeksLived = useMemo(
    () => getDisplayedWeeksLived(viewMode, birthDateObject, referenceDate),
    [birthDateObject, referenceDate, viewMode],
  );
  const daysLived = useMemo(
    () => getDaysLived(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const yearsLived = useMemo(
    () => getYearsLived(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const birthdayRowWeeks = useMemo(
    () => getBirthdayRowWeeksLived(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const hundredthBirthday = useMemo(
    () => getHundredthBirthday(birthDateObject),
    [birthDateObject],
  );
  const nextWeekMarkDate = useMemo(
    () => getDisplayedNextMarkDate(viewMode, birthDateObject, referenceDate),
    [birthDateObject, referenceDate, viewMode],
  );
  const isTodayPointDay = useMemo(
    () => isDisplayedPointMarkDay(viewMode, birthDateObject, referenceDate),
    [birthDateObject, referenceDate, viewMode],
  );
  const completedRatio = Math.min(
    100,
    (displayedWeeksLived / TOTAL_WEEKS) * 100,
  );
  const progressStorageKey = useMemo(
    () =>
      `life-calendar:lastVisibleWeeks:${profile.id}:${birthDate}:${viewMode}`,
    [birthDate, profile.id, viewMode],
  );
  const selectedWallpaperPreset = useMemo(() => {
    return (
      WALLPAPER_PRESETS.find((preset) => preset.id === wallpaperPresetId) ??
      WALLPAPER_PRESETS[0]
    );
  }, [wallpaperPresetId]);
  const wallpaperDimensions = useMemo(() => {
    if (wallpaperPresetId !== "custom") {
      return {
        width: selectedWallpaperPreset.width,
        height: selectedWallpaperPreset.height,
      };
    }

    return {
      width: normalizeWallpaperDimension(customWallpaperWidth, 1290),
      height: normalizeWallpaperDimension(customWallpaperHeight, 2796),
    };
  }, [
    customWallpaperHeight,
    customWallpaperWidth,
    selectedWallpaperPreset.height,
    selectedWallpaperPreset.width,
    wallpaperPresetId,
  ]);
  const wallpaperUrl = useMemo(() => {
    if (!origin) {
      return "";
    }

    const url = new URL("/life", origin);
    url.searchParams.set("birthday", birthDate);
    url.searchParams.set("mode", viewMode);
    url.searchParams.set("width", String(wallpaperDimensions.width));
    url.searchParams.set("height", String(wallpaperDimensions.height));

    if (simulatePointDay) {
      url.searchParams.set("forcePointDay", "1");
    }

    return url.toString();
  }, [
    birthDate,
    origin,
    simulatePointDay,
    viewMode,
    wallpaperDimensions.height,
    wallpaperDimensions.width,
  ]);
  const [animatedWeeksLived, setAnimatedWeeksLived] =
    useState(displayedWeeksLived);
  const stats = [
    {
      label: "Días vividos",
      value: daysLived.toLocaleString("es-ES"),
    },
    {
      label:
        viewMode === "birthday" ? "Puntos visibles" : "Semanas reales vividas",
      value: displayedWeeksLived.toLocaleString("es-ES"),
    },
    {
      label: "Años cumplidos",
      value: `${yearsLived} años`,
    },

    {
      label:
        viewMode === "birthday" ? "Semanas en esta fila" : "Fila visual actual",
      value:
        viewMode === "birthday"
          ? `${birthdayRowWeeks} de 52`
          : `Fila ${yearsLived + 1} · ${birthdayRowWeeks}/52`,
    },
    {
      label: "Semanas reales totales",
      value: realWeeksLived.toLocaleString("es-ES"),
    },
    {
      label: "Próximo punto",
      value: formatLongDate(nextWeekMarkDate),
    },
    {
      label: "Póster completado",
      value: `${completedRatio.toFixed(1)}%`,
    },
  ];

  const getPointPosition = (weekIndex: number) => {
    const column = weekIndex % WEEKS_PER_ROW;
    const row = Math.floor(weekIndex / WEEKS_PER_ROW);

    const decadeColumn = Math.floor(Math.min(column, 49) / 10);
    const decadeRow = Math.floor(row / 10);
    const innerColumn = column < 50 ? column % 10 : column - 50;
    const innerRow = row % 10;

    const rawX =
      calibration.startX +
      decadeColumn * 10 * calibration.dotGapX +
      sumUntil(calibration.horizontalBlockGaps, decadeColumn) +
      innerColumn * calibration.dotGapX +
      (column >= 50 ? calibration.tailGapX : 0);

    const rawY =
      calibration.startY +
      decadeRow * 10 * calibration.dotGapY +
      sumUntil(calibration.verticalBlockGaps, decadeRow) +
      innerRow * calibration.dotGapY +
      (column >= 50 ? calibration.tailOffsetY : 0);

    return { rawX, rawY };
  };

  const getHandmadeOffset = (weekIndex: number) => {
    const angle = pseudoRandom(weekIndex * 2 + 11) * Math.PI * 2;
    const distance =
      pseudoRandom(weekIndex * 2 + 19) * calibration.handmadeJitter;
    const radiusNoise =
      (pseudoRandom(weekIndex * 2 + 29) - 0.5) *
      2 *
      calibration.handmadeRadiusJitter;

    return {
      offsetX: Math.cos(angle) * distance,
      offsetY: Math.sin(angle) * distance,
      radiusNoise,
    };
  };

  useEffect(() => {
    const node = wrapperRef.current;

    if (!node) {
      return;
    }

    const updateSize = () => {
      setCanvasSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => updateSize());
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      if (stampFrameRef.current) {
        window.cancelAnimationFrame(stampFrameRef.current);
      }
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const resetAnimationState = () => {
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (stampFrameRef.current) {
      window.cancelAnimationFrame(stampFrameRef.current);
      stampFrameRef.current = null;
    }

    setStampingWeekIndex(null);
    setStampScale(1);
  };

  const triggerPageFlash = () => {
    setPageFlashActive(true);

    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current);
    }

    flashTimeoutRef.current = window.setTimeout(() => {
      setPageFlashActive(false);
      flashTimeoutRef.current = null;
    }, 700);
  };

  const playStampAnimation = (weekIndex: number) => {
    if (stampFrameRef.current) {
      window.cancelAnimationFrame(stampFrameRef.current);
      stampFrameRef.current = null;
    }

    setStampingWeekIndex(weekIndex);
    const startedAt = performance.now();
    const duration = 260;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      setStampScale(3.15 - 2.15 * eased);

      if (progress < 1) {
        stampFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      setStampScale(1);
      setStampingWeekIndex(null);
      stampFrameRef.current = null;
    };

    stampFrameRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!simulatePointDay) {
      return;
    }

    resetAnimationState();

    const previewWeeks = Math.min(TOTAL_WEEKS, displayedWeeksLived + 1);
    setAnimatedWeeksLived(displayedWeeksLived);

    if (previewWeeks <= displayedWeeksLived) {
      setPageFlashActive(false);
      return;
    }

    triggerPageFlash();

    animationTimeoutRef.current = window.setTimeout(() => {
      setAnimatedWeeksLived(previewWeeks);
      playStampAnimation(previewWeeks - 1);
      animationTimeoutRef.current = null;
    }, 320);

    return () => {
      resetAnimationState();
    };
  }, [displayedWeeksLived, simulatePointDay]);

  useEffect(() => {
    if (simulatePointDay) {
      return;
    }

    resetAnimationState();
    const storedValue = window.localStorage.getItem(progressStorageKey);
    const parsedStored = storedValue
      ? Number.parseInt(storedValue, 10)
      : Number.NaN;
    const previousWeeks = Number.isFinite(parsedStored)
      ? Math.max(0, Math.min(parsedStored, displayedWeeksLived))
      : displayedWeeksLived;

    if (!Number.isFinite(parsedStored)) {
      window.localStorage.setItem(
        progressStorageKey,
        String(displayedWeeksLived),
      );
      setAnimatedWeeksLived(displayedWeeksLived);
      setPageFlashActive(false);
      return;
    }

    if (previousWeeks >= displayedWeeksLived) {
      window.localStorage.setItem(
        progressStorageKey,
        String(displayedWeeksLived),
      );
      setAnimatedWeeksLived(displayedWeeksLived);
      setPageFlashActive(false);
      return;
    }

    setAnimatedWeeksLived(previousWeeks);
    triggerPageFlash();

    let currentWeek = previousWeeks;

    const animateNextPoint = () => {
      currentWeek += 1;
      setAnimatedWeeksLived(currentWeek);
      playStampAnimation(currentWeek - 1);

      if (currentWeek < displayedWeeksLived) {
        animationTimeoutRef.current = window.setTimeout(animateNextPoint, 140);
        return;
      }

      window.localStorage.setItem(
        progressStorageKey,
        String(displayedWeeksLived),
      );
      animationTimeoutRef.current = null;
    };

    animationTimeoutRef.current = window.setTimeout(animateNextPoint, 350);

    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [displayedWeeksLived, progressStorageKey, simulatePointDay]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !canvasSize.width || !canvasSize.height) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(canvasSize.width * pixelRatio);
    canvas.height = Math.floor(canvasSize.height * pixelRatio);
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);

    const scaleX = canvasSize.width / DESIGN_WIDTH;
    const scaleY = canvasSize.height / DESIGN_HEIGHT;

    for (let weekIndex = 0; weekIndex < TOTAL_WEEKS; weekIndex += 1) {
      const { rawX, rawY } = getPointPosition(weekIndex);
      const handmade =
        calibration.pointStyle === "handmade"
          ? getHandmadeOffset(weekIndex)
          : { offsetX: 0, offsetY: 0, radiusNoise: 0 };
      const x = (rawX + handmade.offsetX) * scaleX;
      const y = (rawY + handmade.offsetY) * scaleY;
      const isLived = weekIndex < animatedWeeksLived;
      let radius = Math.max(
        1,
        (calibration.pointRadius + handmade.radiusNoise) *
          Math.min(scaleX, scaleY),
      );
      if (hoveredWeek?.weekIndex === weekIndex) {
        radius *= 1.9;
      }
      if (stampingWeekIndex === weekIndex) {
        radius *= stampScale;
      }
      const fillColor = isLived
        ? hexToRgba(calibration.livedColor, calibration.livedOpacity)
        : hexToRgba(calibration.futureColor, calibration.futureOpacity);

      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = fillColor;
      context.fill();

      if (
        calibration.pointStyle === "handmade" &&
        calibration.handmadeStroke > 0
      ) {
        context.strokeStyle = fillColor;
        context.lineWidth =
          calibration.handmadeStroke * Math.min(scaleX, scaleY);
        context.stroke();
      }
    }
  }, [
    animatedWeeksLived,
    canvasSize.height,
    canvasSize.width,
    hoveredWeek,
    stampScale,
    stampingWeekIndex,
  ]);

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas || !canvasSize.width || !canvasSize.height) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const scaleX = canvasSize.width / DESIGN_WIDTH;
    const scaleY = canvasSize.height / DESIGN_HEIGHT;
    const threshold = hoverRadius * Math.min(scaleX, scaleY);

    let matchedWeek: HoveredWeek | null = null;

    for (let weekIndex = 0; weekIndex < TOTAL_WEEKS; weekIndex += 1) {
      const { rawX, rawY } = getPointPosition(weekIndex);
      const handmade =
        calibration.pointStyle === "handmade"
          ? getHandmadeOffset(weekIndex)
          : { offsetX: 0, offsetY: 0, radiusNoise: 0 };
      const x = (rawX + handmade.offsetX) * scaleX;
      const y = (rawY + handmade.offsetY) * scaleY;
      const distance = Math.hypot(pointerX - x, pointerY - y);

      if (distance <= threshold) {
        matchedWeek = { x, y, weekIndex };
        break;
      }
    }

    setHoveredWeek(matchedWeek);
  };

  const handlePointerLeave = () => {
    setHoveredWeek(null);
  };

  const fullName = profile.name;
  const modeLabel =
    viewMode === "birthday" ? "Visual por cumpleaños" : "Semanas reales";
  const modeExplanation =
    viewMode === "birthday"
      ? "Cada cumpleaños abre una fila nueva. Dentro de esa fila se rellena un punto por cada semana completa desde tu último cumpleaños, así que el póster queda visualmente alineado por años."
      : "Aquí se cuentan las semanas completas reales desde el nacimiento, sin reiniciar en cada cumpleaños. Es la lectura más fiel al tiempo vivido, aunque visualmente no coincida con una fila nueva en cada cumpleaños.";
  const modeHelper =
    viewMode === "birthday"
      ? `Ahora mismo ves ${displayedWeeksLived.toLocaleString("es-ES")} puntos en modo visual y ${realWeeksLived.toLocaleString("es-ES")} semanas reales acumuladas.`
      : `Ahora mismo ves ${displayedWeeksLived.toLocaleString("es-ES")} semanas reales. En modo visual por cumpleaños el póster marcaría ${birthdayWeeksLived.toLocaleString("es-ES")} puntos.`;
  const pointDayStatus = simulatePointDay
    ? "Vista previa activada: el calendario simula el día en que entra un punto nuevo y el wallpaper forzará el modo claro."
    : isTodayPointDay
      ? "Hoy toca punto nuevo: el wallpaper se invertirá automáticamente al generarse."
      : "Activa la vista previa para desarrollo si quieres probar la animación y el wallpaper invertido antes de que llegue ese día.";

  const handleExportWholeLife = () => {
    const events: Array<{
      description: string;
      endDate: Date;
      startDate: Date;
      title: string;
      untilDate?: Date;
    }> = [];

    if (viewMode === "real") {
      const seriesStart = new Date(nextWeekMarkDate);

      if (seriesStart < hundredthBirthday) {
        const eventEnd = new Date(seriesStart);
        eventEnd.setDate(eventEnd.getDate() + 1);
        const untilDate = new Date(hundredthBirthday);
        untilDate.setDate(untilDate.getDate() - 1);

        events.push({
          description:
            "Life Calendar: recordatorio semanal usando semanas reales acumuladas.",
          endDate: eventEnd,
          startDate: seriesStart,
          title: "Life Calendar: semanas reales",
          untilDate,
        });
      }

      downloadIcsCalendar("life-calendar-hasta-los-100.ics", events);
      return;
    }

    for (let age = yearsLived; age < 100; age += 1) {
      const rowStart = new Date(birthDateObject);
      rowStart.setFullYear(birthDateObject.getFullYear() + age);
      rowStart.setHours(0, 0, 0, 0);

      const nextRowBirthday = new Date(rowStart);
      nextRowBirthday.setFullYear(nextRowBirthday.getFullYear() + 1);

      const firstPointDate = new Date(rowStart);
      firstPointDate.setDate(firstPointDate.getDate() + 7);

      const seriesStart =
        age === yearsLived ? new Date(nextWeekMarkDate) : firstPointDate;

      if (seriesStart >= hundredthBirthday || seriesStart >= nextRowBirthday) {
        continue;
      }

      const eventEnd = new Date(seriesStart);
      eventEnd.setDate(eventEnd.getDate() + 1);
      const untilDate = new Date(nextRowBirthday);
      untilDate.setDate(untilDate.getDate() - 1);

      events.push({
        description: `Life Calendar: recordatorio semanal del año visual ${age + 1}.`,
        endDate: eventEnd,
        startDate: seriesStart,
        title: `Life Calendar: fila ${age + 1}`,
        untilDate,
      });
    }

    downloadIcsCalendar("life-calendar-hasta-los-100.ics", events);
  };

  const handleCopyWallpaperUrl = async () => {
    if (!wallpaperUrl) {
      return;
    }

    await navigator.clipboard.writeText(wallpaperUrl);
    setCopiedWallpaperUrl(true);

    window.setTimeout(() => setCopiedWallpaperUrl(false), 1600);
  };

  return (
    <main className="bg-poster relative min-h-screen px-4 py-6 md:px-8 md:py-8">
      {pageFlashActive ? (
        <div className="life-calendar-page-flash pointer-events-none fixed inset-0 z-40" />
      ) : null}
      <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-paperWhite/20 bg-black/10 p-5 shadow-poster backdrop-blur md:flex-row md:items-end md:justify-between md:p-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.45em] text-paperWhite/60">
              Life Calendar
            </p>
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
              {fullName}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-paperWhite/80 md:text-base">
              Elige cómo quieres leer el calendario: como póster visual por
              cumpleaños o como conteo puro de semanas reales vividas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={handleExportWholeLife}
              type="button"
            >
              Exportar hasta los 100
            </button>
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={onBackToProfiles}
              type="button"
            >
              Ver perfiles
            </button>
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={onEditProfile}
              type="button"
            >
              Editar perfil
            </button>
            <button
              className="rounded-full border border-red-200/25 px-4 py-2 text-sm text-red-50 transition hover:bg-red-100/10"
              onClick={onDeleteProfile}
              type="button"
            >
              Eliminar perfil
            </button>
          </div>
        </header>

        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-4 shadow-poster backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                Cómo se interpreta
              </p>
              <h2 className="text-2xl font-semibold text-paperWhite md:text-3xl">
                {modeLabel}
              </h2>
              <p className="text-sm leading-relaxed text-paperWhite/80 md:text-base">
                {modeExplanation}
              </p>
              <p className="text-sm leading-relaxed text-paperWhite/65">
                {modeHelper}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  viewMode === "birthday"
                    ? "border-paperWhite bg-paperWhite text-ink"
                    : "border-paperWhite/25 text-paperWhite hover:bg-paperWhite/10"
                }`}
                onClick={() => setViewMode("birthday")}
                type="button"
              >
                Ver por cumpleaños
              </button>
              <button
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  viewMode === "real"
                    ? "border-paperWhite bg-paperWhite text-ink"
                    : "border-paperWhite/25 text-paperWhite hover:bg-paperWhite/10"
                }`}
                onClick={() => setViewMode("real")}
                type="button"
              >
                Ver semanas reales
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-4 shadow-poster backdrop-blur md:p-6">
          <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] xl:items-start">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                Fondo de pantalla en iPhone
              </p>
              <h2 className="text-2xl font-semibold text-paperWhite md:text-3xl">
                Pon este calendario en tu pantalla de bloqueo
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-paperWhite/78 md:text-base">
                <p>
                  1. Abre la app{" "}
                  <span className="font-semibold text-paperWhite">Atajos</span>{" "}
                  y crea una automatización personal a la hora que prefieras,
                  por ejemplo cada mañana.
                </p>
                <p>
                  2. Añade la acción{" "}
                  <span className="font-semibold text-paperWhite">
                    Obtener contenido de URL
                  </span>{" "}
                  y pega la dirección de abajo.
                </p>
                <p>
                  3. Después añade{" "}
                  <span className="font-semibold text-paperWhite">
                    Establecer fondo de pantalla
                  </span>{" "}
                  y elige la pantalla bloqueada.
                </p>
                <p>
                  4. En esa acción desactiva{" "}
                  <span className="font-semibold text-paperWhite">
                    Mostrar previsualización
                  </span>{" "}
                  para que el cambio sea automático.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-paperWhite/15 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-paperWhite/55">
                URL del wallpaper
              </p>
              <p className="mt-3 text-sm leading-relaxed text-paperWhite/70">
                Esta URL ya usa el perfil actual y el modo{" "}
                <span className="font-semibold text-paperWhite">
                  {modeLabel}
                </span>
                .
              </p>
              <div className="mt-4 grid gap-3">
                <label className="space-y-2">
                  <span className="block text-xs uppercase tracking-[0.28em] text-paperWhite/55">
                    Modelo de iPhone
                  </span>
                  <select
                    className="w-full rounded-2xl border border-paperWhite/15 bg-black/25 px-4 py-3 text-sm text-paperWhite outline-none focus:border-paperWhite/35"
                    onChange={(event) =>
                      setWallpaperPresetId(
                        event.target.value as WallpaperPreset["id"],
                      )
                    }
                    value={wallpaperPresetId}
                  >
                    {WALLPAPER_PRESETS.map((preset) => (
                      <option
                        className="bg-[#101014]"
                        key={preset.id}
                        value={preset.id}
                      >
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>

                {wallpaperPresetId === "custom" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="block text-xs uppercase tracking-[0.28em] text-paperWhite/55">
                        Ancho
                      </span>
                      <input
                        className="w-full rounded-2xl border border-paperWhite/15 bg-black/25 px-4 py-3 text-sm text-paperWhite outline-none focus:border-paperWhite/35"
                        onChange={(event) =>
                          setCustomWallpaperWidth(event.target.value)
                        }
                        type="number"
                        value={customWallpaperWidth}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="block text-xs uppercase tracking-[0.28em] text-paperWhite/55">
                        Alto
                      </span>
                      <input
                        className="w-full rounded-2xl border border-paperWhite/15 bg-black/25 px-4 py-3 text-sm text-paperWhite outline-none focus:border-paperWhite/35"
                        onChange={(event) =>
                          setCustomWallpaperHeight(event.target.value)
                        }
                        type="number"
                        value={customWallpaperHeight}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-paperWhite/10 bg-black/20 px-4 py-3 text-sm text-paperWhite/70">
                  Resolución activa:{" "}
                  <span className="font-semibold text-paperWhite">
                    {wallpaperDimensions.width} × {wallpaperDimensions.height}
                  </span>
                </div>

                <button
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    simulatePointDay
                      ? "border-paperWhite bg-paperWhite text-ink"
                      : "border-paperWhite/20 text-paperWhite hover:bg-paperWhite/10"
                  }`}
                  onClick={() => setSimulatePointDay((current) => !current)}
                  type="button"
                >
                  {simulatePointDay
                    ? "Desactivar vista previa del día de punto"
                    : "Activar vista previa del día de punto"}
                </button>

                <p className="text-sm leading-relaxed text-paperWhite/70">
                  {pointDayStatus}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-paperWhite/15 bg-black/25 px-4 py-3 text-sm text-paperWhite/80 outline-none"
                  readOnly
                  value={wallpaperUrl || "Cargando URL…"}
                />
                <button
                  className="rounded-2xl border border-paperWhite/20 px-4 py-3 text-sm font-medium text-paperWhite transition hover:bg-paperWhite/10"
                  disabled={!wallpaperUrl}
                  onClick={handleCopyWallpaperUrl}
                  type="button"
                >
                  {copiedWallpaperUrl ? "Copiada" : "Copiar"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-4 shadow-poster backdrop-blur md:p-5">
          <div className="mx-auto flex max-w-[1120px] flex-wrap justify-center gap-3">
            {stats.map((stat) => (
              <FloatingStat
                key={stat.label}
                label={stat.label}
                value={stat.value}
              />
            ))}
          </div>

          <div className="relative mt-4">
            <div className="mx-auto flex w-full items-start justify-center px-1">
              <div className="relative mx-auto overflow-visible">
                <div
                  className="relative overflow-hidden rounded-[1.5rem] border border-paperWhite/10 bg-[#7b0c12] shadow-poster"
                  ref={wrapperRef}
                >
                  <img
                    alt="Life Calendar poster"
                    className="block h-auto max-h-[calc(100vh-24rem)] w-auto max-w-full"
                    height={DESIGN_HEIGHT}
                    src="/calendar.png"
                    width={DESIGN_WIDTH}
                  />

                  <canvas
                    className="absolute inset-0 h-full w-full"
                    onPointerLeave={handlePointerLeave}
                    onPointerMove={handlePointerMove}
                    ref={canvasRef}
                  />
                </div>

                {hoveredWeek ? (
                  <div
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[125%] rounded-2xl border border-paperWhite/20 bg-black/80 px-4 py-3 text-sm text-paperWhite shadow-lg backdrop-blur"
                    style={{
                      left: hoveredWeek.x,
                      minWidth: "220px",
                      top: hoveredWeek.y,
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.28em] text-paperWhite/55">
                      Punto {hoveredWeek.weekIndex + 1}
                    </p>
                    <p className="mt-1 text-sm font-medium leading-snug text-paperWhite">
                      {getDisplayedWeekDateLabel(
                        viewMode,
                        birthDateObject,
                        hoveredWeek.weekIndex,
                      )}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type FloatingStatProps = {
  label: string;
  value: string;
};

function FloatingStat({ label, value }: FloatingStatProps) {
  return (
    <article className="flex min-h-[116px] w-full flex-col rounded-[1.35rem] border border-paperWhite/15 bg-black/10 p-3.5 shadow-poster backdrop-blur sm:w-[calc(50%-0.375rem)] xl:w-[calc(25%-0.75rem)]">
      <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold leading-tight text-paperWhite md:text-[1.65rem]">
        {value}
      </p>
    </article>
  );
}

function hexToRgba(hex: string, opacity: number) {
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : sanitized;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}
