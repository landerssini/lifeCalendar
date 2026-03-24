"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getBirthdayRowWeekDateLabel,
  getBirthdayRowWeeksLived,
  getCurrentBirthday,
  formatLongDate,
  getDaysLived,
  getHundredthBirthday,
  getNextBirthday,
  getNextBirthdayRowMarkDate,
  getVisualWeeksLivedByBirthdayRows,
  getWeeksLived,
  getYearsLived,
} from "@/lib/date";
import { downloadIcsCalendar, downloadIcsEvent } from "@/lib/calendar";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type LifeCalendarProps = {
  birthDate: string;
  onResetBirthDate: () => void;
  session: Session;
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

const sumUntil = (values: number[], count: number) =>
  values
    .slice(0, Math.max(0, count))
    .reduce((total, value) => total + value, 0);

export function LifeCalendar({
  birthDate,
  onResetBirthDate,
  session,
}: LifeCalendarProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const stampFrameRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredWeek, setHoveredWeek] = useState<HoveredWeek | null>(null);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] =
    useState<Calibration>(DEFAULT_CALIBRATION);
  const [devDateInput, setDevDateInput] = useState("");
  const [replaySeed, setReplaySeed] = useState(0);
  const [stampingWeekIndex, setStampingWeekIndex] = useState<number | null>(
    null,
  );
  const [stampScale, setStampScale] = useState(1);
  const birthDateObject = useMemo(
    () => new Date(`${birthDate}T00:00:00`),
    [birthDate],
  );
  const referenceDate = useMemo(() => {
    if (!devDateInput) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    const simulatedDate = new Date(`${devDateInput}T00:00:00`);

    if (Number.isNaN(simulatedDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }

    return simulatedDate;
  }, [devDateInput]);
  const realWeeksLived = useMemo(
    () => getWeeksLived(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const weeksLived = useMemo(
    () => getVisualWeeksLivedByBirthdayRows(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
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
  const currentBirthday = useMemo(
    () => getCurrentBirthday(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const nextBirthday = useMemo(
    () => getNextBirthday(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const hundredthBirthday = useMemo(
    () => getHundredthBirthday(birthDateObject),
    [birthDateObject],
  );
  const nextWeekMarkDate = useMemo(
    () => getNextBirthdayRowMarkDate(birthDateObject, referenceDate),
    [birthDateObject, referenceDate],
  );
  const currentRow = yearsLived + 1;
  const nextPointRow = birthdayRowWeeks >= 52 ? currentRow + 1 : currentRow;
  const nextPoint = birthdayRowWeeks >= 52 ? 1 : birthdayRowWeeks + 1;
  const completedRatio = Math.min(100, (weeksLived / TOTAL_WEEKS) * 100);
  const progressStorageKey = useMemo(
    () => `life-calendar:lastVisualWeeks:${session.user.id}:${birthDate}`,
    [birthDate, session.user.id],
  );
  const [animatedWeeksLived, setAnimatedWeeksLived] = useState(weeksLived);
  const [newPointsSinceLastVisit, setNewPointsSinceLastVisit] = useState(0);
  const stats = [
    {
      label: "Dias vividos",
      value: daysLived.toLocaleString("es-ES"),
    },
    {
      label: "Semanas reales",
      value: realWeeksLived.toLocaleString("es-ES"),
    },
    {
      label: "Edad cumplida",
      value: `${yearsLived} anos`,
    },
    {
      label: "Fila actual",
      value: `Fila ${currentRow}`,
    },
    {
      label: "Semanas en esta fila",
      value: `${birthdayRowWeeks} de 52`,
    },
    {
      label: "Puntos visuales",
      value: weeksLived.toLocaleString("es-ES"),
    },
    {
      label: "Cumpleanos actual",
      value: formatLongDate(currentBirthday),
    },
    {
      label: "Proximo cumpleanos",
      value: formatLongDate(nextBirthday),
    },
    {
      label: "Siguiente posicion con punto",
      value: `Fila ${nextPointRow}, punto ${nextPoint}`,
    },
    {
      label: "Proximo punto relleno",
      value: formatLongDate(nextWeekMarkDate),
    },
    {
      label: "Poster completado",
      value: `${completedRatio.toFixed(1)}%`,
    },
    {
      label: "Fecha simulada",
      value: formatLongDate(referenceDate),
    },
    {
      label: "Puntos nuevos desde tu ultima visita",
      value: newPointsSinceLastVisit.toLocaleString("es-ES"),
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
    };
  }, []);

  const playStampAnimation = (weekIndex: number) => {
    if (stampFrameRef.current) {
      window.cancelAnimationFrame(stampFrameRef.current);
      stampFrameRef.current = null;
    }

    setStampingWeekIndex(weekIndex);
    const startedAt = performance.now();
    const duration = 220;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      setStampScale(1.9 - 0.9 * eased);

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
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    if (devDateInput) {
      setAnimatedWeeksLived(weeksLived);
      setNewPointsSinceLastVisit(0);
      return;
    }

    const storedValue = window.localStorage.getItem(progressStorageKey);
    const parsedStored = storedValue
      ? Number.parseInt(storedValue, 10)
      : Number.NaN;
    const previousWeeks = Number.isFinite(parsedStored)
      ? Math.max(0, Math.min(parsedStored, weeksLived))
      : weeksLived;

    if (!Number.isFinite(parsedStored)) {
      window.localStorage.setItem(progressStorageKey, String(weeksLived));
      setAnimatedWeeksLived(weeksLived);
      setNewPointsSinceLastVisit(0);
      return;
    }

    if (previousWeeks >= weeksLived) {
      window.localStorage.setItem(progressStorageKey, String(weeksLived));
      setAnimatedWeeksLived(weeksLived);
      setNewPointsSinceLastVisit(0);
      return;
    }

    setAnimatedWeeksLived(previousWeeks);
    setNewPointsSinceLastVisit(weeksLived - previousWeeks);

    let currentWeek = previousWeeks;

    const animateNextPoint = () => {
      currentWeek += 1;
      setAnimatedWeeksLived(currentWeek);
      playStampAnimation(currentWeek - 1);

      if (currentWeek < weeksLived) {
        animationTimeoutRef.current = window.setTimeout(animateNextPoint, 140);
        return;
      }

      window.localStorage.setItem(progressStorageKey, String(weeksLived));
      animationTimeoutRef.current = null;
    };

    animationTimeoutRef.current = window.setTimeout(animateNextPoint, 350);

    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [devDateInput, progressStorageKey, weeksLived]);

  useEffect(() => {
    if (replaySeed === 0) {
      return;
    }

    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    const replayCount = Math.min(12, Math.max(newPointsSinceLastVisit, 1));
    const replayStart = Math.max(0, weeksLived - replayCount);
    let currentWeek = replayStart;

    setAnimatedWeeksLived(replayStart);

    const animateReplay = () => {
      currentWeek += 1;
      setAnimatedWeeksLived(currentWeek);
      playStampAnimation(currentWeek - 1);

      if (currentWeek < weeksLived) {
        animationTimeoutRef.current = window.setTimeout(animateReplay, 140);
        return;
      }

      animationTimeoutRef.current = null;
    };

    animationTimeoutRef.current = window.setTimeout(animateReplay, 250);

    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [newPointsSinceLastVisit, replaySeed, weeksLived]);

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

    if (showCalibration) {
      context.strokeStyle = "rgba(255, 255, 255, 0.35)";
      context.lineWidth = 1;

      for (let row = 0; row <= 100; row += 10) {
        const y =
          (calibration.startY +
            row * calibration.dotGapY +
            sumUntil(calibration.verticalBlockGaps, Math.floor(row / 10))) *
          scaleY;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvasSize.width, y);
        context.stroke();
      }

      for (let block = 0; block < 5; block += 1) {
        const x =
          (calibration.startX +
            block * 10 * calibration.dotGapX +
            sumUntil(calibration.horizontalBlockGaps, block)) *
          scaleX;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvasSize.height);
        context.stroke();
      }
    }
  }, [
    animatedWeeksLived,
    calibration,
    canvasSize.height,
    canvasSize.width,
    hoveredWeek,
    showCalibration,
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

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  const updateCalibration =
    (
      key:
        | "startX"
        | "startY"
        | "dotGapX"
        | "dotGapY"
        | "tailGapX"
        | "tailOffsetY"
        | "pointRadius"
        | "handmadeJitter"
        | "handmadeRadiusJitter"
        | "handmadeStroke"
        | "livedOpacity"
        | "futureOpacity",
    ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);

      setCalibration((current) => ({
        ...current,
        [key]: value,
      }));
    };

  const updateHorizontalBlockGap =
    (index: 0 | 1 | 2 | 3) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);

      setCalibration((current) => {
        const next = [
          ...current.horizontalBlockGaps,
        ] as Calibration["horizontalBlockGaps"];
        next[index] = value;

        return {
          ...current,
          horizontalBlockGaps: next,
        };
      });
    };

  const updateVerticalBlockGap =
    (index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value);

      setCalibration((current) => {
        const next = [
          ...current.verticalBlockGaps,
        ] as Calibration["verticalBlockGaps"];
        next[index] = value;

        return {
          ...current,
          verticalBlockGaps: next,
        };
      });
    };

  const updateCalibrationColor =
    (key: "livedColor" | "futureColor") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setCalibration((current) => ({
        ...current,
        [key]: value,
      }));
    };

  const updatePointStyle = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Calibration["pointStyle"];

    setCalibration((current) => ({
      ...current,
      pointStyle: value,
    }));
  };

  const fullName =
    session.user.user_metadata.full_name ??
    session.user.email ??
    "Tu calendario";
  const calibrationSnippet = `const DEFAULT_CALIBRATION = ${JSON.stringify(calibration, null, 2)} as const;`;

  const handleExportNextPoint = () => {
    const eventDate = new Date(nextWeekMarkDate);
    const eventEnd = new Date(eventDate);
    eventEnd.setDate(eventEnd.getDate() + 1);

    downloadIcsEvent({
      description:
        "Recordatorio de Life Calendar para marcar el siguiente punto semanal en tu poster.",
      endDate: eventEnd,
      filename: "life-calendar-proximo-punto.ics",
      startDate: eventDate,
      title: "Life Calendar: proximo punto",
    });
  };

  const handleExportWeeklyReminder = () => {
    const eventDate = new Date(nextWeekMarkDate);
    const eventEnd = new Date(eventDate);
    eventEnd.setDate(eventEnd.getDate() + 1);
    const untilDate = new Date(nextBirthday);
    untilDate.setDate(untilDate.getDate() - 1);

    downloadIcsEvent({
      description:
        "Recordatorio semanal de Life Calendar hasta tu proximo cumpleanos para actualizar tu poster.",
      endDate: eventEnd,
      filename: "life-calendar-recordatorio-semanal.ics",
      startDate: eventDate,
      title: "Life Calendar: marcar punto semanal",
      untilDate,
    });
  };

  const handleExportWholeLife = () => {
    const events: Array<{
      description: string;
      endDate: Date;
      startDate: Date;
      title: string;
      untilDate?: Date;
    }> = [];

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

  return (
    <main className="bg-poster min-h-screen px-4 py-6 md:px-8 md:py-8">
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
              El poster visual arranca una fila nueva en cada cumpleanos. Dentro
              de esa fila se marca un punto por cada semana completa
              transcurrida desde tu ultimo cumpleanos.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={handleExportNextPoint}
              type="button"
            >
              Exportar proximo punto
            </button>
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={handleExportWeeklyReminder}
              type="button"
            >
              Exportar semanal
            </button>
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={handleExportWholeLife}
              type="button"
            >
              Exportar hasta los 100
            </button>
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={() => setReplaySeed((current) => current + 1)}
              type="button"
            >
              Ver animacion
            </button>
            <button
              className="rounded-full border border-paperWhite/25 px-4 py-2 text-sm transition hover:bg-paperWhite/10"
              onClick={onResetBirthDate}
              type="button"
            >
              Cambiar fecha
            </button>
            <button
              className="rounded-full border border-paperWhite/25 bg-paperWhite px-4 py-2 text-sm font-medium text-ink transition hover:bg-white"
              onClick={handleSignOut}
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-4 shadow-poster backdrop-blur md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                Modo desarrollo
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-paperWhite/80">
                Simula la fecha actual para comprobar como cambiaria el poster
                en futuros martes, cumpleanos o cualquier otro dia.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="space-y-2">
                <span className="block text-xs uppercase tracking-[0.3em] text-paperWhite/60">
                  Fecha simulada
                </span>
                <input
                  className="rounded-xl border border-paperWhite/15 bg-black/25 px-4 py-3 text-sm text-paperWhite outline-none focus:border-paperWhite/40"
                  onChange={(event) => setDevDateInput(event.target.value)}
                  type="date"
                  value={devDateInput}
                />
              </label>

              <button
                className="rounded-full border border-paperWhite/25 px-4 py-3 text-sm transition hover:bg-paperWhite/10"
                onClick={() => setDevDateInput("")}
                type="button"
              >
                Usar hoy
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-paperWhite/20 bg-black/10 p-4 shadow-poster backdrop-blur md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-paperWhite/75">
            <p>
              1 punto = 1 semana. El poster usa bloques `10 + 10 + 10 + 10 + 10
              + 2` por fila.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <p>
                Pasa el cursor por cualquier punto para ver la fecha de inicio
                de esa semana.
              </p>
              <button
                className="rounded-full border border-paperWhite/25 px-4 py-2 text-xs uppercase tracking-[0.25em] transition hover:bg-paperWhite/10"
                onClick={() => setShowCalibration((current) => !current)}
                type="button"
              >
                {showCalibration ? "Ocultar ajuste" : "Ajustar puntos"}
              </button>
              {showCalibration ? (
                <button
                  className="rounded-full border border-paperWhite/25 px-4 py-2 text-xs uppercase tracking-[0.25em] transition hover:bg-paperWhite/10"
                  onClick={() => setCalibration(DEFAULT_CALIBRATION)}
                  type="button"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <div
            className={
              showCalibration
                ? "grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_340px]"
                : "grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]"
            }
          >
            <aside className="relative hidden xl:block">
              <div className="sticky top-6 space-y-4">
                <div className="translate-x-4 rotate-[-2deg]">
                  <FloatingStat label={stats[0].label} value={stats[0].value} />
                </div>
                <div className="-translate-x-2 rotate-[1.5deg]">
                  <FloatingStat label={stats[1].label} value={stats[1].value} />
                </div>
                <div className="translate-x-3 rotate-[-1deg]">
                  <FloatingStat label={stats[2].label} value={stats[2].value} />
                </div>
                <div className="-translate-x-1 rotate-[2deg]">
                  <FloatingStat label={stats[3].label} value={stats[3].value} />
                </div>
                <div className="translate-x-5 rotate-[-1.5deg]">
                  <FloatingStat
                    label={stats[10].label}
                    value={stats[10].value}
                  />
                </div>
                <div className="-translate-x-3 rotate-[1deg]">
                  <FloatingStat
                    label={stats[11].label}
                    value={stats[11].value}
                  />
                </div>
              </div>
            </aside>

            <div className="relative min-h-[calc(100vh-18rem)]">
              <div className="mx-auto flex min-h-[calc(100vh-18rem)] w-full items-center justify-center px-4 xl:px-10">
                <div className="relative mx-auto overflow-visible">
                  <div
                    className="relative overflow-hidden rounded-[1.5rem] border border-paperWhite/10 bg-[#7b0c12] shadow-poster"
                    ref={wrapperRef}
                  >
                    <img
                      alt="Life Calendar poster"
                      className="block h-auto max-h-[calc(100vh-22rem)] w-auto max-w-full"
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
                        {getBirthdayRowWeekDateLabel(
                          birthDateObject,
                          hoveredWeek.weekIndex,
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:hidden">
                {stats.map((stat) => (
                  <FloatingStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </div>
            </div>

            {showCalibration ? (
              <div className="space-y-4 rounded-[1.5rem] border border-paperWhite/15 bg-black/20 p-4 xl:sticky xl:top-6 xl:max-h-[85vh] xl:overflow-auto">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <CalibrationField
                    label="startX"
                    onChange={updateCalibration("startX")}
                    step={1}
                    value={calibration.startX}
                  />
                  <CalibrationField
                    label="startY"
                    onChange={updateCalibration("startY")}
                    step={1}
                    value={calibration.startY}
                  />
                  <CalibrationField
                    label="dotGapX"
                    onChange={updateCalibration("dotGapX")}
                    step={0.1}
                    value={calibration.dotGapX}
                  />
                  <CalibrationField
                    label="dotGapY"
                    onChange={updateCalibration("dotGapY")}
                    step={0.1}
                    value={calibration.dotGapY}
                  />
                  <CalibrationField
                    label="tailGapX"
                    onChange={updateCalibration("tailGapX")}
                    step={0.1}
                    value={calibration.tailGapX}
                  />
                  <CalibrationField
                    label="tailOffsetY"
                    onChange={updateCalibration("tailOffsetY")}
                    step={0.1}
                    value={calibration.tailOffsetY}
                  />
                  <CalibrationField
                    label="pointRadius"
                    onChange={updateCalibration("pointRadius")}
                    step={0.1}
                    value={calibration.pointRadius}
                  />
                  <CalibrationSelectField
                    label="pointStyle"
                    onChange={updatePointStyle}
                    options={[
                      { label: "Limpio", value: "clean" },
                      { label: "Hecho a mano", value: "handmade" },
                    ]}
                    value={calibration.pointStyle}
                  />
                  <CalibrationField
                    label="handmadeJitter"
                    onChange={updateCalibration("handmadeJitter")}
                    step={0.1}
                    value={calibration.handmadeJitter}
                  />
                  <CalibrationField
                    label="handmadeRadiusJitter"
                    onChange={updateCalibration("handmadeRadiusJitter")}
                    step={0.1}
                    value={calibration.handmadeRadiusJitter}
                  />
                  <CalibrationField
                    label="handmadeStroke"
                    min={0}
                    onChange={updateCalibration("handmadeStroke")}
                    step={0.1}
                    value={calibration.handmadeStroke}
                  />
                  <CalibrationColorField
                    label="livedColor"
                    onChange={updateCalibrationColor("livedColor")}
                    value={calibration.livedColor}
                  />
                  <CalibrationColorField
                    label="futureColor"
                    onChange={updateCalibrationColor("futureColor")}
                    value={calibration.futureColor}
                  />
                  <CalibrationField
                    label="livedOpacity"
                    max={1}
                    min={0}
                    onChange={updateCalibration("livedOpacity")}
                    step={0.01}
                    value={calibration.livedOpacity}
                  />
                  <CalibrationField
                    label="futureOpacity"
                    max={1}
                    min={0}
                    onChange={updateCalibration("futureOpacity")}
                    step={0.01}
                    value={calibration.futureOpacity}
                  />
                </div>

                <section className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                    Separacion Entre Bloques Horizontales
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    {calibration.horizontalBlockGaps.map((value, index) => (
                      <CalibrationField
                        key={`horizontal-gap-${index + 1}`}
                        label={
                          `horizontalBlockGap${index}` as CalibrationFieldProps["label"]
                        }
                        onChange={updateHorizontalBlockGap(
                          index as 0 | 1 | 2 | 3,
                        )}
                        step={0.1}
                        value={value}
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                    Separacion Entre Decadas Verticales
                  </p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    {calibration.verticalBlockGaps.map((value, index) => (
                      <CalibrationField
                        key={`vertical-gap-${index + 1}`}
                        label={
                          `verticalBlockGap${index}` as CalibrationFieldProps["label"]
                        }
                        onChange={updateVerticalBlockGap(
                          index as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
                        )}
                        step={0.1}
                        value={value}
                      />
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
                    Ajuste Actual En Codigo
                  </p>
                  <textarea
                    className="min-h-56 w-full rounded-xl border border-paperWhite/15 bg-black/25 px-4 py-3 text-xs text-paperWhite/85 outline-none"
                    readOnly
                    value={calibrationSnippet}
                  />
                </section>
              </div>
            ) : null}
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
    <article className="rounded-[1.5rem] border border-paperWhite/15 bg-black/10 p-4 shadow-poster backdrop-blur">
      <p className="text-xs uppercase tracking-[0.35em] text-paperWhite/55">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold leading-tight text-paperWhite md:text-2xl">
        {value}
      </p>
    </article>
  );
}

type CalibrationFieldProps = {
  label:
    | "startX"
    | "startY"
    | "dotGapX"
    | "dotGapY"
    | "tailGapX"
    | "tailOffsetY"
    | "pointRadius"
    | "handmadeJitter"
    | "handmadeRadiusJitter"
    | "handmadeStroke"
    | "livedOpacity"
    | "futureOpacity"
    | "horizontalBlockGap0"
    | "horizontalBlockGap1"
    | "horizontalBlockGap2"
    | "horizontalBlockGap3"
    | "verticalBlockGap0"
    | "verticalBlockGap1"
    | "verticalBlockGap2"
    | "verticalBlockGap3"
    | "verticalBlockGap4"
    | "verticalBlockGap5"
    | "verticalBlockGap6"
    | "verticalBlockGap7"
    | "verticalBlockGap8";
  max?: number;
  min?: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  step: number;
  value: number;
};

function CalibrationField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: CalibrationFieldProps) {
  const labelMap: Record<CalibrationFieldProps["label"], string> = {
    startX: "Inicio horizontal",
    startY: "Inicio vertical",
    dotGapX: "Espacio entre puntos X",
    dotGapY: "Espacio entre puntos Y",
    tailGapX: "Separacion cola 2 puntos",
    tailOffsetY: "Offset vertical cola",
    pointRadius: "Tamano del punto",
    handmadeJitter: "Irregularidad posicion",
    handmadeRadiusJitter: "Irregularidad tamano",
    handmadeStroke: "Trazo handmade",
    livedOpacity: "Opacidad vividos",
    futureOpacity: "Opacidad futuros",
    horizontalBlockGap0: "Bloque X 1 -> 2",
    horizontalBlockGap1: "Bloque X 2 -> 3",
    horizontalBlockGap2: "Bloque X 3 -> 4",
    horizontalBlockGap3: "Bloque X 4 -> 5",
    verticalBlockGap0: "Decada 10 -> 20",
    verticalBlockGap1: "Decada 20 -> 30",
    verticalBlockGap2: "Decada 30 -> 40",
    verticalBlockGap3: "Decada 40 -> 50",
    verticalBlockGap4: "Decada 50 -> 60",
    verticalBlockGap5: "Decada 60 -> 70",
    verticalBlockGap6: "Decada 70 -> 80",
    verticalBlockGap7: "Decada 80 -> 90",
    verticalBlockGap8: "Decada 90 -> 100",
  };

  return (
    <label className="space-y-2">
      <span className="block text-xs uppercase tracking-[0.3em] text-paperWhite/60">
        {labelMap[label]}
      </span>
      <input
        className="w-full rounded-xl border border-paperWhite/15 bg-black/25 px-3 py-2 text-sm text-paperWhite outline-none focus:border-paperWhite/40"
        max={max}
        min={min}
        onChange={onChange}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

type CalibrationSelectFieldProps = {
  label: "pointStyle";
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ label: string; value: Calibration["pointStyle"] }>;
  value: Calibration["pointStyle"];
};

function CalibrationSelectField({
  label,
  onChange,
  options,
  value,
}: CalibrationSelectFieldProps) {
  const labelMap: Record<CalibrationSelectFieldProps["label"], string> = {
    pointStyle: "Estilo del punto",
  };

  return (
    <label className="space-y-2">
      <span className="block text-xs uppercase tracking-[0.3em] text-paperWhite/60">
        {labelMap[label]}
      </span>
      <select
        className="w-full rounded-xl border border-paperWhite/15 bg-black/25 px-3 py-2 text-sm text-paperWhite outline-none focus:border-paperWhite/40"
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <option
            className="bg-[#5f0b10]"
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

type CalibrationColorFieldProps = {
  label: "livedColor" | "futureColor";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  value: string;
};

function CalibrationColorField({
  label,
  onChange,
  value,
}: CalibrationColorFieldProps) {
  const labelMap: Record<CalibrationColorFieldProps["label"], string> = {
    livedColor: "Color vividos",
    futureColor: "Color futuros",
  };

  return (
    <label className="space-y-2">
      <span className="block text-xs uppercase tracking-[0.3em] text-paperWhite/60">
        {labelMap[label]}
      </span>
      <div className="flex items-center gap-3 rounded-xl border border-paperWhite/15 bg-black/25 px-3 py-2">
        <input
          className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent p-0"
          onChange={onChange}
          type="color"
          value={value}
        />
        <span className="text-sm text-paperWhite/80">{value}</span>
      </div>
    </label>
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
