import {
  getBirthdayRowWeeksLived,
  getDisplayedWeeksLived,
  getYearsLived,
  isDisplayedPointMarkDay,
  type CalendarViewMode,
} from "@/lib/date";
import {
  DEFAULT_DOT_LAYOUT,
  DOT_LAYOUT_TOTAL_WEEKS,
  generateDotPositions,
} from "@/lib/dot-layout";

export const WALLPAPER_DEVICE_OVERRIDES = {
  "1170x2532": {
    dotAreaHeight: 1823,
    dotAreaWidth: 936,
    dotPaddingLeft: 176,
  },
  "1179x2556": {
    dotAreaHeight: 1840,
    dotAreaWidth: 943,
    dotPaddingLeft: 177,
  },
  "1284x2778": {
    dotAreaHeight: 2000,
    dotAreaWidth: 1027,
    dotPaddingLeft: 193,
  },
  "1290x2796": {
    dotAreaHeight: 2013,
    dotAreaWidth: 1032,
    dotPaddingLeft: 194,
  },
  "750x1334": {
    dotAreaHeight: 960,
    dotAreaWidth: 600,
    dotPaddingLeft: 113,
  },
} as const;

type LifeWallpaperParams = {
  birthDate: Date;
  dotAreaHeight?: number;
  dotAreaWidth?: number;
  dotPaddingLeft?: number;
  forcePointDay: boolean;
  height: number;
  mode: CalendarViewMode;
  referenceDate: Date;
  width: number;
};

function clampDimension(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(320, Math.min(4000, Math.round(value)));
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getWallpaperDeviceOverride(width: number, height: number) {
  const key = `${width}x${height}` as keyof typeof WALLPAPER_DEVICE_OVERRIDES;
  return WALLPAPER_DEVICE_OVERRIDES[key];
}

export function buildLifeWallpaper({
  birthDate,
  dotAreaHeight,
  dotAreaWidth,
  dotPaddingLeft,
  forcePointDay,
  height,
  mode,
  referenceDate,
  width,
}: LifeWallpaperParams) {
  const safeWidth = clampDimension(width, 1290);
  const safeHeight = clampDimension(height, 2796);
  const presetOverride = getWallpaperDeviceOverride(safeWidth, safeHeight);

  const displayedWeeks = getDisplayedWeeksLived(mode, birthDate, referenceDate);
  const yearsLived = getYearsLived(birthDate, referenceDate);
  const weeksInCurrentRow = getBirthdayRowWeeksLived(birthDate, referenceDate);
  const isPointDay =
    forcePointDay || isDisplayedPointMarkDay(mode, birthDate, referenceDate);
  const progressPercent = Math.min(
    100,
    (displayedWeeks / DOT_LAYOUT_TOTAL_WEEKS) * 100,
  );
  const theme = isPointDay
    ? {
        background:
          "radial-gradient(circle at top, rgba(0,0,0,0.08), transparent 28%), linear-gradient(180deg, #f6f1ea 0%, #e9e1d8 100%)",
        text: "#0f0f12",
        futureDot: "rgba(15,15,18,0.16)",
        futureText: "rgba(15,15,18,0.56)",
        glow: "rgba(249,115,22,0.18)",
        livedDot: "#0f0f12",
      }
    : {
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 28%), linear-gradient(180deg, #0d0d10 0%, #141417 100%)",
        text: "#ffffff",
        futureDot: "rgba(255,255,255,0.18)",
        futureText: "rgba(255,255,255,0.5)",
        glow: "rgba(249,115,22,0.22)",
        livedDot: "#ffffff",
      };

  const dotPositions = generateDotPositions(DEFAULT_DOT_LAYOUT);
  const dotRadius = DEFAULT_DOT_LAYOUT.pointRadius;
  const minDotX =
    Math.min(...dotPositions.map((position) => position.x)) - dotRadius;
  const maxDotX =
    Math.max(...dotPositions.map((position) => position.x)) + dotRadius;
  const minDotY =
    Math.min(...dotPositions.map((position) => position.y)) - dotRadius;
  const maxDotY =
    Math.max(...dotPositions.map((position) => position.y)) + dotRadius;
  const dotContentWidth = maxDotX - minDotX;
  const dotContentHeight = maxDotY - minDotY;

  const verticalTextColumn = safeWidth * 0.24;
  const resolvedDotAreaWidth = clampDimension(
    dotAreaWidth ?? presetOverride?.dotAreaWidth ?? safeWidth * 0.8,
    safeWidth * 0.8,
  );
  const resolvedDotAreaHeight = clampDimension(
    dotAreaHeight ?? presetOverride?.dotAreaHeight ?? safeHeight * 0.72,
    safeHeight * 0.72,
  );
  const dotAreaX = (safeWidth - resolvedDotAreaWidth) / 2;
  const dotAreaY = (safeHeight - resolvedDotAreaHeight) / 2;
  const extraDotLeftPadding = Math.max(
    0,
    Math.min(
      resolvedDotAreaWidth * 0.75,
      dotPaddingLeft ?? presetOverride?.dotPaddingLeft ?? safeWidth * 0.15,
    ),
  );
  const dotSize = Math.max(5, Math.round(safeWidth * 0.0072));
  const availableDotWidth = Math.max(0, resolvedDotAreaWidth - extraDotLeftPadding);
  const dotScale = Math.min(
    availableDotWidth / dotContentWidth,
    resolvedDotAreaHeight / dotContentHeight,
  );
  const scaledDotWidth = dotContentWidth * dotScale;
  const scaledDotHeight = dotContentHeight * dotScale;
  const horizontalFreeSpace = Math.max(0, availableDotWidth - scaledDotWidth);
  const dotOffsetX = dotAreaX + extraDotLeftPadding + horizontalFreeSpace / 2;
  const dotOffsetY = dotAreaY + (resolvedDotAreaHeight - scaledDotHeight) / 2;
  const circles = dotPositions.map((position) => {
    const x = dotOffsetX + (position.x - minDotX) * dotScale;
    const y = dotOffsetY + (position.y - minDotY) * dotScale;
    const isLived = position.weekIndex < displayedWeeks;
    const isCurrent = position.weekIndex === displayedWeeks - 1;
    const fill = isCurrent
      ? "#f97316"
      : isLived
        ? theme.livedDot
        : theme.futureDot;
    const glow = isCurrent
      ? `<circle cx="${x}" cy="${y}" r="${dotSize * 1.6}" fill="${theme.glow}" />`
      : "";
    return `${glow}<circle cx="${x}" cy="${y}" r="${dotSize / 2}" fill="${fill}" />`;
  });

  const dotSvg = `
    <svg xmlns="http://www.w3.org/2000/svg"  width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
      ${circles.join("")}
    </svg>
  `;
  const dotSvgUrl = svgToDataUri(dotSvg);
  const footerText =
    mode === "birthday"
      ? `${progressPercent.toFixed(1)}% to 100 • fila ${yearsLived + 1} • ${weeksInCurrentRow}/52`
      : `${progressPercent.toFixed(1)}% to 100 • ${displayedWeeks} semanas reales`;

  const content = (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: theme.background,
        color: theme.text,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: safeWidth * 0.05,
          top: safeHeight * 0.44,
          width: verticalTextColumn,
          height: safeHeight * 0.72,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: safeWidth * 0.012,
            top: safeHeight * 0.67,
            width: safeHeight * 0.8,
            display: "flex",
            justifyContent: "flex-end",
            transform: "rotate(-90deg)",
            transformOrigin: "left top",
          }}
        >
          <span
            style={{
              fontFamily: '"Barlow Condensed"',
              fontWeight: 800,
              fontSize: Math.round(safeWidth * 0.084),
              lineHeight: 0.84,
              letterSpacing: -1,
              color: theme.text,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            DON&apos;T WASTE YOUR TIME
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: safeWidth * 0.074,
            top: safeHeight * 0.67,
            width: safeHeight * 0.82,
            display: "flex",
            justifyContent: "flex-end",
            transform: "rotate(-90deg)",
            transformOrigin: "left top",
          }}
        >
          <span
            style={{
              fontFamily: '"Barlow Condensed"',
              fontWeight: 300,
              fontSize: Math.round(safeWidth * 0.074),
              lineHeight: 0.84,
              letterSpacing: -0.15,
              color: theme.text,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            MAKE YOUR DAYS COUNT
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      />

      <img alt="Life calendar dots" src={dotSvgUrl} />

      <div
        style={{
          position: "absolute",
          bottom: safeHeight * 0.06,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          textAlign: "center",
          fontSize: Math.max(22, Math.round(safeWidth * 0.024)),
          color: theme.futureText,
        }}
      >
        {footerText}
      </div>
    </div>
  );

  return {
    content,
    height: safeHeight,
    width: safeWidth,
  };
}
