"use client";
import React, { useState } from "react";

export default function LyricsFormatterPage() {
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
    // Appel à l'API PDF
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
        // Nom du fichier PDF personnalisé
        let outName = `${artist} - ${title} (lyrics).pdf`;
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setInfo("PDF généré et téléchargé !");
      }
    } catch (e) {
      setInfo("Erreur de connexion ou de génération PDF.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-700 text-white px-4 py-12">
      <h1 className="text-4xl font-bold mb-6">Lyrics Formatter</h1>
      <p className="mb-8 text-lg max-w-xl text-center">
        Mets en forme tes lyrics, remplis les infos, et génère un superbe PDF prêt à imprimer ou partager !
      </p>
      <form className="w-full max-w-lg flex flex-col gap-6 bg-indigo-800/80 border border-indigo-600 rounded-xl p-8 shadow-lg" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label className="text-indigo-200 font-semibold">Artiste</label>
          <input type="text" value={artist} onChange={e => setArtist(e.target.value)} className="rounded px-3 py-2 bg-indigo-900 text-white border border-indigo-500 focus:outline-none focus:border-fuchsia-400" placeholder="Nom de l'artiste" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-indigo-200 font-semibold">Titre</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="rounded px-3 py-2 bg-indigo-900 text-white border border-indigo-500 focus:outline-none focus:border-fuchsia-400" placeholder="Titre du morceau" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-indigo-200 font-semibold">Lyrics by</label>
          <input type="text" value={lyricsBy} onChange={e => setLyricsBy(e.target.value)} className="rounded px-3 py-2 bg-indigo-900 text-white border border-indigo-500 focus:outline-none focus:border-fuchsia-400" placeholder="Auteur des paroles" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-indigo-200 font-semibold">Paroles</label>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={8} className="rounded px-3 py-2 bg-indigo-900 text-white border border-indigo-500 focus:outline-none focus:border-fuchsia-400 resize-y" placeholder="Colle ici les paroles..." />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 rounded-lg text-white font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
        >
          {loading ? "Génération en cours..." : "Générer PDF"}
        </button>
        {info && <div className="text-center text-sm text-fuchsia-200 mt-2">{info}</div>}
      </form>
    </main>
  );
}
