import { NextRequest, NextResponse } from "next/server";

/**
 * Appelle l'API AcoustID pour identifier un fichier audio à partir de son fingerprint.
 * Requiert une clé API AcoustID (API Key) à placer dans .env.local sous le nom ACOUSTID_API_KEY.
 * Attend en POST un body JSON : { fingerprint: string, duration: number }
 */
export async function POST(req: NextRequest) {
  const { fingerprint, duration } = await req.json();
  const apiKey = process.env.ACOUSTID_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ACOUSTID_API_KEY manquant dans .env.local" }, { status: 500 });
  }
  const url = `https://api.acoustid.org/v2/lookup?client=${apiKey}&meta=recordings+releasegroups+tracks+compress&duration=${duration}&fingerprint=${fingerprint}`;
  const res = await fetch(url);
  const data = await res.json();
  return NextResponse.json(data);
}
