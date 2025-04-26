"use client";
import React, { useState } from "react";
import { FormatterIcon } from "@/components/icons";

export default function LyricsFormatterWidget() {
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [lyricsBy, setLyricsBy] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !title || !lyricsBy || !lyrics) {
      setInfo("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    setInfo("");
    try {
      const res = await fetch("/api/lyrics-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist, title, lyricsBy, lyrics }),
      });
      if (!res.ok) {
        const err = await res.json();
        setInfo("Erreur : " + (err.error || "Génération impossible."));
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        let outName = `${artist} - ${title} (lyrics).pdf`;
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setInfo("PDF généré !");
      }
    } catch {
      setInfo("Erreur de connexion ou de génération.");
    }
    setLoading(false);
  };

  return (
    <div className="group bg-zinc-900 p-6 rounded-3xl border border-zinc-800 overflow-hidden transition-all duration-300 hover:bg-zinc-800/80 hover:border-accent-500/30">
      <FormatterIcon className="h-10 w-10 text-white mb-3 mx-auto" />
      <h3 className="text-xl font-bold tracking-tight text-white text-center mb-4">Lyrics Formatter</h3>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artiste"
          className="rounded-xl px-4 py-3 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-accent-400 transition-colors text-sm font-medium"
        />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre"
          className="rounded-xl px-4 py-3 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-accent-400 transition-colors text-sm font-medium"
        />
        <input
          type="text"
          value={lyricsBy}
          onChange={(e) => setLyricsBy(e.target.value)}
          placeholder="Paroles par"
          className="rounded-xl px-4 py-3 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-accent-400 transition-colors text-sm font-medium"
        />
        <textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          rows={6}
          placeholder="Collez vos paroles ici..."
          className="rounded-xl px-4 py-3 bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-accent-400 transition-colors text-sm font-medium resize-y"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent-400 hover:bg-accent-500 text-white rounded-full font-semibold tracking-wide transition-all duration-200 mb-2"
        >
          {loading ? "Générer..." : "Générer PDF"}
        </button>
      </form>
      {loading && (
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
          <div className="h-full bg-accent-300 animate-pulse" style={{ width: "75%" }}></div>
        </div>
      )}
      {info && <div className="text-sm text-center mt-2 text-zinc-300">{info}</div>}
      

    </div>
  );
}
