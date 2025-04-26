import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, artist } = await req.json();
  const GENIUS_API_TOKEN = process.env.GENIUS_API_TOKEN;
  if (!GENIUS_API_TOKEN) {
    return NextResponse.json({ error: "GENIUS_API_TOKEN manquant dans .env.local" }, { status: 500 });
  }
  // Recherche du morceau sur Genius
  const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${GENIUS_API_TOKEN}` },
  });
  const searchData = await searchRes.json();
  const hit = searchData.response.hits.find((h: { result: { primary_artist: { name: string }, url: string } }) =>
    h.result.primary_artist.name.toLowerCase().includes(artist.toLowerCase())
  );
  if (!hit) {
    return NextResponse.json({ lyrics: null, url: null, error: "Aucun résultat Genius" });
  }
  // Scraping des paroles sur la page Genius (pas d'API officielle pour les lyrics)
  const lyricsPage = await fetch(hit.result.url);
  const html = await lyricsPage.text();
  // Extraction naïve des paroles (entre <div data-lyrics-container>)
  const matches = html.match(/<div data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/g);
  let lyrics = null;
  if (matches && matches.length > 0) {
    lyrics = matches.map(block => block.replace(/<[^>]+>/g, "")).join("\n").trim();
  }
  return NextResponse.json({ lyrics, url: hit.result.url });
}
