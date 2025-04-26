import { NextRequest, NextResponse } from "next/server";
import { parseBuffer } from "music-metadata";

// Spotify API credentials (à mettre dans .env.local)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

async function getSpotifyTrackInfo(trackUrl: string) {
  // trackUrl: https://open.spotify.com/track/xxxx
  const match = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error("URL Spotify invalide");
  const trackId = match[1];
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erreur lors de la récupération Spotify");
  const data = await res.json();
  return {
    title: data.name,
    artist: data.artists.map((a: { name: string }) => a.name).join(", "),
    album: data.album.name,
    duration_ms: data.duration_ms,
    preview_url: data.preview_url,
    image: data.album.images?.[0]?.url,
    spotify_url: data.external_urls.spotify,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    if (formData.has("spotify_url")) {
      const url = formData.get("spotify_url") as string;
      const info = await getSpotifyTrackInfo(url);
      return NextResponse.json({ type: "spotify", ...info });
    } else if (formData.has("audio")) {
      const file = formData.get("audio") as File;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadata = await parseBuffer(buffer, file.type);
      // Préparer les métadonnées enrichies
      let pictureDataUrl = null;
      if (metadata.common.picture && metadata.common.picture[0]) {
        const pic = metadata.common.picture[0];
        const base64 = Buffer.from(pic.data).toString('base64');
        pictureDataUrl = `data:${pic.format};base64,${base64}`;
      }
      return NextResponse.json({
        type: "audio",
        name: file.name,
        duration: metadata.format.duration,
        format: metadata.format.container,
        title: metadata.common.title || null,
        artist: metadata.common.artist || null,
        album: metadata.common.album || null,
        year: metadata.common.year || null,
        genre: metadata.common.genre || null,
        picture: pictureDataUrl,
        allCommon: metadata.common,
        allFormat: metadata.format
      });
    } else {
      return NextResponse.json({ error: "Aucun fichier ou lien fourni." }, { status: 400 });
    }
  } catch (err: unknown) {
    let errorMsg = "Erreur inconnue";
    if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") {
      errorMsg = (err as any).message;
    } else if (typeof err === "string") {
      errorMsg = err;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
