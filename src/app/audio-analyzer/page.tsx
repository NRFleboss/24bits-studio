"use client";
import React, { useState, useEffect } from "react";
import Waveform from "./Waveform";
import SimpleAudioFeatures from "./SimpleAudioFeatures";
import SongSegmentationIA from "./SongSegmentationIA";

export default function AudioAnalyzerPage() {
  // Responsive, UI premium, feedback, sections claires

  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [log, setLog] = useState<string | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  // Onglet actif : analyse spectrale ou découpage IA
  const [tab, setTab] = useState<'spectral' | 'segmentation'>('spectral');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setLog("");
    try {
      const formData = new FormData();
      if (spotifyUrl) {
        setLog("Téléchargement de la piste Spotify...");
        formData.append("spotify_url", spotifyUrl);
      } else if (audioFile) {
        setLog("Analyse du fichier audio en cours...");
        formData.append("audio", audioFile);
      } else {
        setError("Please provide a Spotify link or upload an audio file.");
        setLoading(false);
        setLog("");
        return;
      }
      // Utilise l'API Next.js locale
      const response = await fetch("/api/audio-analyze", {
        method: "POST",
        body: formData,
      });
      setLog("Analyse audio en cours...");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unknown error");
      setResult(data);
      setLog("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLog("");
    } finally {
      setLoading(false);
    }
  };

  // Estimation BPM côté front après analyse audio
  useEffect(() => {
    async function estimateBpm() {
      setBpm(null);
      if (audioFile && result && result.type === "audio") {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await audioFile.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
          // Dynamically import beat detector in client
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { default: detect } = (await import("web-audio-beat-detector")) as any;
          const bpmVal = await detect(audioBuffer);
          setBpm(Math.round(bpmVal));
        } catch (e) {
          setBpm(null);
        }
      }
    }
    estimateBpm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, audioFile]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-950 via-dark-900 to-dark-800 text-white flex flex-col font-sans relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 -right-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>
      
      <main className="flex-1 container mx-auto px-4 py-12 relative z-10">
        <header className="w-full max-w-3xl mx-auto mb-12 text-center">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent">Analyse musicale</span>
            <span className="text-white"> intelligente</span>
          </h1>
          <p className="text-gray-300/90 mt-2 text-lg">Obtenez un maximum d'infos sur vos morceaux, via Spotify ou fichier audio.</p>
        </header>
        <section className="w-full max-w-2xl bg-glass backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12 shadow-glass-lg mx-auto">
          <form onSubmit={handleAnalyze} className="w-full flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="block font-medium mb-2 text-gray-300">Analyser via Spotify</label>
              <input
                type="text"
                placeholder="Lien Spotify"
                className="w-full rounded-lg bg-dark-950/70 border border-white/10 placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-white"
                value={spotifyUrl}
                onChange={e => setSpotifyUrl(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="block font-medium mb-2 text-gray-300">Ou analyser un fichier audio</label>
              <input
                type="file"
                accept="audio/*"
                className="w-full rounded-lg bg-dark-950/70 border border-white/10 px-4 py-3 text-white"
                onChange={e => setAudioFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
              {audioFile && (
                <div className="text-sm text-spotify-text mt-2 font-mono animate-fade-in">Fichier sélectionné : <b>{audioFile.name}</b></div>
              )}
            </div>
            <div className="flex flex-row gap-6 justify-center mt-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Analyse en cours..." : "Analyser"}
              </button>
              <button
                type="button"
                className="w-full border border-white/20 text-gray-300 hover:bg-white/5 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setSpotifyUrl("");
                  setAudioFile(null);
                  setResult(null);
                  setError(null);
                  setBpm(null);
                }}
                disabled={loading}
              >
                Réinitialiser
              </button>
            </div>
            {log && <div className="text-center text-primary-400 mt-4 text-lg font-semibold animate-pulse">{log}</div>}
            {error && <div className="text-center text-red-600 font-semibold animate-shake mt-4 text-lg">{error}</div>}
            {loading && (
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mt-2">
                <div className="h-full bg-indigo-400 animate-pulse" style={{ width: "90%" }} />
              </div>
            )}
            {log && (
              <div className="mt-4 text-center text-gray-600 font-semibold text-base">{log}</div>
            )}
          </form>
        </section>
        {error && <div className="mt-6 text-center text-red-600 text-base font-semibold bg-red-50 rounded p-3 border border-red-200">{error}</div>}
        {result && (
          <section className="mt-8 w-full max-w-2xl animate-fade-in bg-glass backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-glass-lg mx-auto">
            <h2 className="font-bold mb-6 text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent text-center">Résultat de l'analyse</h2>

            {result.type === "spotify" ? (
              <div className="flex flex-col gap-2 items-center">
                {result.image && (
                  <img src={result.image} alt="cover" className="w-32 h-32 rounded shadow mb-2" />
                )}
                <div><b>Titre :</b> {result.title}</div>
                <div><b>Artiste :</b> {result.artist}</div>
                <div><b>Album :</b> {result.album}</div>
                <div><b>Durée :</b> {result.duration_ms ? (result.duration_ms/1000).toFixed(1) + " sec" : "-"}</div>
                {result.spotify_url && (
                  <a href={result.spotify_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                    <span>Ouvrir sur Spotify</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {result.preview_url && (
                  <audio controls src={result.preview_url} className="mt-2">
                    Votre navigateur ne supporte pas la balise audio.
                  </audio>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2 items-center">
                {result.picture && (
                  <img src={result.picture} alt="cover" className="w-32 h-32 rounded shadow mb-2" />
                )}
                <div><b>Nom du fichier :</b> {result.name}</div>
                {result.title && <div><b>Titre :</b> {result.title}</div>}
                {result.artist && <div><b>Artiste :</b> {result.artist}</div>}
                {result.album && <div><b>Album :</b> {result.album}</div>}
                {result.year && <div><b>Année :</b> {result.year}</div>}
                {result.genre && <div><b>Genre :</b> {Array.isArray(result.genre) ? result.genre.join(', ') : result.genre}</div>}
                <div><b>Format :</b> {result.format}</div>
                <div><b>Durée :</b> {result.duration ? result.duration.toFixed(1) + " sec" : "-"}</div>
                {/* Infos techniques */}
                {result.allFormat && (
                  <div className="w-full mt-2">
                    <h3 className="font-semibold text-gray-700 mb-1">Infos techniques</h3>
                    <table className="w-full text-sm text-left">
                      <tbody>
                        <tr><td className="pr-2">Bitrate</td><td>{result.allFormat.bitrate ? (result.allFormat.bitrate/1000).toFixed(1) + ' kbps' : '-'}</td></tr>
                        <tr><td className="pr-2">Sample rate</td><td>{result.allFormat.sampleRate ? result.allFormat.sampleRate + ' Hz' : '-'}</td></tr>
                        <tr><td className="pr-2">Channels</td><td>{result.allFormat.numberOfChannels || '-'}</td></tr>
                        <tr><td className="pr-2">Codec</td><td>{result.allFormat.codec || '-'}</td></tr>
                        <tr><td className="pr-2">Profile</td><td>{result.allFormat.profile || '-'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Affichage de la forme d'onde */}
                {audioFile && <Waveform file={audioFile} />}
                {audioFile && (
                  <div className="w-full mt-8">
                    <div className="flex gap-2 mb-4">
                      <button
                        className={`px-4 py-2 rounded-t ${tab === 'spectral' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border-b-2 border-indigo-600'}`}
                        onClick={() => setTab('spectral')}
                      >
                        Analyse spectrale
                      </button>
                      <button
                        className={`px-4 py-2 rounded-t ${tab === 'segmentation' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border-b-2 border-indigo-600'}`}
                        onClick={() => setTab('segmentation')}
                      >
                        Découpage IA
                      </button>
                    </div>
                    {tab === 'spectral' && <SimpleAudioFeatures file={audioFile} />}
                    {tab === 'segmentation' && <SongSegmentationIA file={audioFile} />}
                  </div>
                )}
                {/* Zone BPM (estimation) */}
                <div><b>BPM (estimation) :</b> {bpm ? bpm + ' bpm' : <span className="text-gray-400">-</span>}</div>
                {/* Métadonnées brutes (expert, tableau lisible) */}
                <details className="w-full mt-2">
                  <summary className="cursor-pointer text-gray-700 font-semibold">Voir toutes les métadonnées brutes (tableau)</summary>
                  <div className="bg-gray-50 rounded p-2 mt-1 overflow-x-auto text-xs">
                    <table className="w-full text-xs">
                      <thead><tr><th className="pr-2 text-left">Clé</th><th className="text-left">Valeur</th></tr></thead>
                      <tbody>
                        {Object.entries(result.allCommon || {}).map(([k, v]) => (
                          <tr key={k}><td className="pr-2 font-mono text-gray-900">{k}</td><td>{Array.isArray(v) ? v.join(", ") : (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))}</td></tr>
                        ))}
                        {Object.entries(result.allFormat || {}).map(([k, v]) => (
                          <tr key={"f-"+k}><td className="pr-2 font-mono text-gray-700">[format] {k}</td><td>{Array.isArray(v) ? v.join(", ") : (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v))}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                {/* Tags spéciaux */}
                {result.allCommon && (result.allCommon.lyrics || result.allCommon.comment) && (
                  <div className="w-full mt-2">
                    <h3 className="font-semibold text-gray-700 mb-1">Tags spéciaux</h3>
                    {result.allCommon.lyrics && (
                      <div className="mb-2"><b>Paroles :</b><br />
                        <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap">{Array.isArray(result.allCommon.lyrics) ? result.allCommon.lyrics.join("\n") : result.allCommon.lyrics}</pre>
                      </div>
                    )}
                    {result.allCommon.comment && (
                      <div className="mb-2"><b>Commentaires :</b><br />
                        <pre className="bg-gray-100 rounded p-2 whitespace-pre-wrap">{Array.isArray(result.allCommon.comment) ? result.allCommon.comment.join("\n") : result.allCommon.comment}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </section>
        )}
      </main>
    </div>
  );
}
