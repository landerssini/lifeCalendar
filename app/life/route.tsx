import { ImageResponse } from "next/og";
import type { CalendarViewMode } from "@/lib/date";
import { buildLifeWallpaper } from "@/lib/wallpaper";

export const runtime = "edge";

const barlow300 = fetch(
  "https://cdn.jsdelivr.net/fontsource/fonts/barlow-condensed@latest/latin-300-normal.woff"
).then((response) => response.arrayBuffer());

const barlow800 = fetch(
  "https://cdn.jsdelivr.net/fontsource/fonts/barlow-condensed@latest/latin-800-normal.woff"
).then((response) => response.arrayBuffer());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const birthdayParam = searchParams.get("birthday");
  const referenceDateParam = searchParams.get("date");
  const modeParam = searchParams.get("mode");
  const forcePointDayParam = searchParams.get("forcePointDay");
  const widthParam = Number.parseInt(searchParams.get("width") ?? "1290", 10);
  const heightParam = Number.parseInt(searchParams.get("height") ?? "2796", 10);
  const dotPaddingLeftParam = Number.parseInt(
    searchParams.get("dotPaddingLeft") ?? "",
    10,
  );
  const dotAreaWidthParam = Number.parseInt(
    searchParams.get("dotAreaWidth") ?? "",
    10,
  );
  const dotAreaHeightParam = Number.parseInt(
    searchParams.get("dotAreaHeight") ?? "",
    10,
  );

  if (!birthdayParam) {
    return new Response("Missing birthday", { status: 400 });
  }

  const birthDate = new Date(`${birthdayParam}T00:00:00`);
  const referenceDate = referenceDateParam
    ? new Date(`${referenceDateParam}T00:00:00`)
    : new Date();
  const mode: CalendarViewMode = modeParam === "real" ? "real" : "birthday";
  const forcePointDay =
    forcePointDayParam === "1" || forcePointDayParam === "true";

  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(referenceDate.getTime())) {
    return new Response("Invalid date", { status: 400 });
  }

  const wallpaper = buildLifeWallpaper({
    birthDate,
    dotAreaHeight: Number.isFinite(dotAreaHeightParam)
      ? dotAreaHeightParam
      : undefined,
    dotAreaWidth: Number.isFinite(dotAreaWidthParam)
      ? dotAreaWidthParam
      : undefined,
    dotPaddingLeft: Number.isFinite(dotPaddingLeftParam)
      ? dotPaddingLeftParam
      : undefined,
    forcePointDay,
    height: heightParam,
    mode,
    referenceDate,
    width: widthParam
  });

  const [barlowLightData, barlowHeavyData] = await Promise.all([barlow300, barlow800]);

  return new ImageResponse(wallpaper.content, {
    width: wallpaper.width,
    height: wallpaper.height,
    fonts: [
      {
        name: "Barlow Condensed",
        data: barlowLightData,
        style: "normal",
        weight: 300
      },
      {
        name: "Barlow Condensed",
        data: barlowHeavyData,
        style: "normal",
        weight: 800
      }
    ]
  });
}
