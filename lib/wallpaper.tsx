import {
  getBirthdayRowWeeksLived,
  getVisualWeeksLivedByBirthdayRows,
  getYearsLived,
} from "@/lib/date";
import {
  DEFAULT_DOT_LAYOUT,
  DOT_LAYOUT_TOTAL_WEEKS,
  generateDotPositions,
} from "@/lib/dot-layout";

type LifeWallpaperParams = {
  birthDate: Date;
  height: number;
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

export function buildLifeWallpaper({
  birthDate,
  height,
  referenceDate,
  width,
}: LifeWallpaperParams) {
  const safeWidth = clampDimension(width, 1290);
  const safeHeight = clampDimension(height, 2796);

  const visualWeeks = getVisualWeeksLivedByBirthdayRows(
    birthDate,
    referenceDate,
  );
  const yearsLived = getYearsLived(birthDate, referenceDate);
  const weeksInCurrentRow = getBirthdayRowWeeksLived(birthDate, referenceDate);
  const progressPercent = Math.min(
    100,
    (visualWeeks / DOT_LAYOUT_TOTAL_WEEKS) * 100,
  );

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
  const dotAreaWidth = safeWidth * 0.6;
  const dotAreaHeight = safeHeight * 0.72;
  const dotAreaX = (safeWidth - dotAreaWidth) / 2;
  const dotAreaY = (safeHeight - dotAreaHeight) / 2;
  const dotSize = Math.max(5, Math.round(safeWidth * 0.0072));
  const dotScale = Math.min(
    dotAreaWidth / dotContentWidth,
    dotAreaHeight / dotContentHeight,
  );
  const scaledDotWidth = dotContentWidth * dotScale;
  const scaledDotHeight = dotContentHeight * dotScale;
  const dotOffsetX = dotAreaX + (dotAreaWidth - scaledDotWidth) / 2;
  const dotOffsetY = dotAreaY + (dotAreaHeight - scaledDotHeight) / 2;
  const circles = dotPositions.map((position) => {
    const x = dotOffsetX + (position.x - minDotX) * dotScale;
    const y = dotOffsetY + (position.y - minDotY) * dotScale;
    const isLived = position.weekIndex < visualWeeks;
    const isCurrent = position.weekIndex === visualWeeks - 1;
    const fill = isCurrent
      ? "#f97316"
      : isLived
        ? "#ffffff"
        : "rgba(255,255,255,0.18)";
    const glow = isCurrent
      ? `<circle cx="${x}" cy="${y}" r="${dotSize * 1.6}" fill="rgba(249,115,22,0.22)" />`
      : "";
    return `${glow}<circle cx="${x}" cy="${y}" r="${dotSize / 2}" fill="${fill}" />`;
  });

  const dotSvg = `
    <svg xmlns="http://www.w3.org/2000/svg"  width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">
      ${circles.join("")}
    </svg>
  `;
  const dotSvgUrl = svgToDataUri(dotSvg);

  const content = (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.04), transparent 28%), linear-gradient(180deg, #0d0d10 0%, #141417 100%)",
        color: "white",
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
              color: "rgba(255,255,255,0.98)",
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
              color: "rgba(255,255,255,0.98)",
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
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {`${progressPercent.toFixed(1)}% to 100 • row ${yearsLived + 1} • ${weeksInCurrentRow}/52`}
      </div>
    </div>
  );

  return {
    content,
    height: safeHeight,
    width: safeWidth,
  };
}
