"use client";
import React, { useEffect, useRef, useState } from "react";
import Meyda from "meyda";
import SpectralFeaturesCard from "./SpectralFeaturesCard";

interface SpectralAnalysisProps {
  file: File;
}

export default function SpectralAnalysis({ file }: SpectralAnalysisProps) {
  const [features, setFeatures] = useState<any>(null);
  const [mfcc, setMfcc] = useState<number[]|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file) return;
    const audioCtx: AudioContext;
    setError(null);
    setFeatures(null);
    setMfcc(null);

    const processAudio = async () => {
      try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        // Analyse spectrale offline via Meyda sur le buffer
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
        const bufferSource = offlineCtx.createBufferSource();
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(offlineCtx.destination);
        bufferSource.start();
        const channelData = audioBuffer.getChannelData(0);
        const bufferSize = 1024;
        const featuresArray: unknown[] = [];
        for (let i = 0; i < channelData.length; i += bufferSize) {
          const frame = channelData.slice(i, i + bufferSize);
          const feats = Meyda.extract([
            "mfcc",
            "spectralCentroid",
            "spectralRolloff",
            "spectralFlux"
          ], frame);
          if (feats) {
            featuresArray.push(feats);
            if (featuresArray.length > 50) featuresArray.shift();
          }
        }
        if (featuresArray.length > 0) {
          const last = featuresArray[featuresArray.length - 1];
          setFeatures({
            centroid: last.spectralCentroid,
            rolloff: last.spectralRolloff,
            flux: last.spectralFlux,
          });
          setMfcc(last.mfcc);
          drawSpectrogram(featuresArray.map(f => f.mfcc));
        } else {
          setError("Aucune feature extraite. Le format du fichier est-il supporté ? Essayez un .wav ou .mp3 classique.");
        }
      } catch (err: any) {
        setError("Erreur d'analyse spectrale : " + (err?.message || JSON.stringify(err)));
      }
    };
    processAudio();
    return () => {
      if (audioCtx) audioCtx.close();
    };
  }, [file]);

  function drawSpectrogram(mfccHistory: number[][]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    // Draw MFCC as spectrogram
    for (let t = 0; t < mfccHistory.length; t++) {
      for (let m = 0; m < (mfccHistory[t]?.length || 0); m++) {
        const val = mfccHistory[t][m];
        const color = `hsl(${250 - val * 4}, 80%, 60%)`;
        ctx!.fillStyle = color;
        ctx!.fillRect(t * (canvas.width / mfccHistory.length), m * (canvas.height / 13), canvas.width / mfccHistory.length, canvas.height / 13);
      }
    }
  }

  return (
    <div className="w-full mt-6 bg-white/70 rounded-xl shadow p-6 animate-fade-in">
      <h3 className="font-bold text-fuchsia-900 text-xl mb-4">Analyse spectrale avancée</h3>

      {error && <div className="text-red-600">{error}</div>}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <canvas ref={canvasRef} width={300} height={130} className="w-full max-w-xs h-32 bg-gray-100 rounded shadow" />
          <div className="text-xs text-gray-600 text-center mt-2">Spectrogramme MFCC</div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {mfcc && features && (
            <SpectralFeaturesCard
              mfcc={mfcc}
              centroid={features.centroid}
              flux={features.flux}
              rolloff={features.rolloff}
            />
          )}
        </div>
      </div>
    </div>
  );
}
