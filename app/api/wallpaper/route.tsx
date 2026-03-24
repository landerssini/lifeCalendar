import { ImageResponse } from "next/og";
import { buildLifeWallpaper } from "@/lib/wallpaper";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const birthDateParam = searchParams.get("birthDate");
  const referenceDateParam = searchParams.get("date");

  if (!birthDateParam) {
    return new Response("Missing birthDate", { status: 400 });
  }

  const birthDate = new Date(`${birthDateParam}T00:00:00`);
  const referenceDate = referenceDateParam
    ? new Date(`${referenceDateParam}T00:00:00`)
    : new Date();

  if (Number.isNaN(birthDate.getTime()) || Number.isNaN(referenceDate.getTime())) {
    return new Response("Invalid date", { status: 400 });
  }

  const wallpaper = buildLifeWallpaper({
    birthDate,
    height: 2796,
    referenceDate,
    width: 1290
  });

  return new ImageResponse(wallpaper.content, {
    width: wallpaper.width,
    height: wallpaper.height
  });
}
