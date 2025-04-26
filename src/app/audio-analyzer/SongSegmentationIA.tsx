"use client";
import React, { useEffect, useRef, useState } from "react";

/**
 * Ce composant réalise une segmentation musicale avancée (IA) grâce à Essentia.js,
 * et affiche la structure détectée (intro, couplet, refrain, etc.) sur la forme d'onde.
 *
 * Nécessite :
 *   - "essentia.js" (installé)
 *   - Un fichier audio (File)
 */

interface Segment {
  start: number; // secondes
  end: number;   // secondes
  label: string; // ex: "Verse", "Chorus", ...
}

interface SongSegmentationIAProps {
  file: File;
}

export default function SongSegmentationIA({ file }: SongSegmentationIAProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSegments([]);
    setDuration(0);

    const analyze = async () => {
      try {
        // Envoi du fichier à l'API
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/essentia-analyze", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Erreur API");
        }
        // data.segments attendu
        if (data.segments) {
          setSegments(
            data.segments.map((s: any) => ({
              start: s.startTime,
              end: s.endTime,
              label: s.label.charAt(0).toUpperCase() + s.label.slice(1),
            }))
          );
        } else {
          setSegments([]);
        }
      } catch (err: any) {
        setError("Erreur API Essentia : " + (err?.message || JSON.stringify(err)));
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, [file]);

  // Affichage de la forme d'onde + segments (simplifié)
  useEffect(() => {
    if (!file || !canvasRef.current || segments.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner la timeline
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, canvas.height / 2 - 10, canvas.width, 20);

    // Dessiner les segments
    const colors = ['#A78BFA','#F472B6','#34D399','#FBBF24','#60A5FA','#F87171','#FCD34D'];
    segments.forEach((seg, i) => {
      const x1 = (seg.start / duration) * canvas.width;
      const x2 = (seg.end / duration) * canvas.width;
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(x1, canvas.height / 2 - 15, x2 - x1, 30);
      ctx.fillStyle = '#222';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(seg.label, x1 + 5, canvas.height / 2 + 5);
    });

    // Bordures
    ctx.strokeStyle = '#333';
    ctx.strokeRect(0, canvas.height / 2 - 15, canvas.width, 30);
  }, [segments, file, duration]);

  return (
    <div className="w-full bg-white/80 rounded-xl shadow-lg p-6 animate-fade-in mt-6">
      <h3 className="font-bold text-fuchsia-900 text-xl mb-4">Découpage IA du morceau</h3>
      {error && <div className="text-red-600 mb-3 p-3 bg-red-50 rounded">{error}</div>}
      {loading && <div className="text-fuchsia-600 mb-3">Analyse IA en cours...</div>}
      <canvas ref={canvasRef} width={700} height={90} className="w-full h-20 bg-gray-100 rounded shadow mb-4" />
      {segments.length > 0 && (
        <div className="mt-2">
          <h4 className="text-md font-bold text-fuchsia-800 mb-2">Structure détectée :</h4>
          <ul className="text-sm">
            {segments.map((seg, i) => (
              <li key={i} className="mb-1">
                <span className="font-semibold text-fuchsia-700">{seg.label}</span>
                {" "}({formatTime(seg.start)} - {formatTime(seg.end)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
