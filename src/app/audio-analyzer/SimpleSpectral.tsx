"use client";
import React, { useEffect, useRef, useState } from "react";

interface SimpleSpectralProps {
  file: File;
}

interface FeatureSet {
  centroid: number;
  flux: number;
  rolloff: number;
  mfcc: number[];
}

export default function SimpleSpectral({ file }: SimpleSpectralProps) {
  const [features, setFeatures] = useState<FeatureSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fonction pour calculer les features spectrales basiques sans dépendance
  const calculateFeatures = async (audioBuffer: AudioBuffer): Promise<FeatureSet> => {
    const channelData = audioBuffer.getChannelData(0);
    const fftSize = 2048;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = fftSize;
    
    // Créer un noeud source temporaire
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    
    // Get frequency data sans jouer le son
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);
    
    // Calculer les features spectrales de base
    let sum = 0;
    let weightedSum = 0;
    let prevMagnitudes = new Array(frequencyData.length).fill(0);
    let flux = 0;
    
    // Pour le spectral rolloff (seuil d'énergie à 85%)
    const totalEnergy = frequencyData.reduce((acc, val) => acc + val, 0);
    let energySum = 0;
    let rolloffIndex = 0;
    
    // MFCC approximé (version simple sans DCT complet)
    const mfccBands = 13;
    const mfcc = new Array(mfccBands).fill(0);
    
    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i];
      
      // Centroid: moyenne pondérée des fréquences
      weightedSum += i * value;
      sum += value;
      
      // Flux: différence avec frame précédent
      flux += Math.abs(value - prevMagnitudes[i]);
      
      // Rolloff: seuil d'énergie cumulée
      energySum += value;
      if (energySum <= 0.85 * totalEnergy) {
        rolloffIndex = i;
      }
      
      // MFCC simplifié
      const bandIndex = Math.floor(i / (frequencyData.length / mfccBands));
      if (bandIndex < mfccBands) {
        mfcc[bandIndex] += value / 50; // Divisé pour normaliser
      }
    }
    
    // Normalisation centroid (0-22050Hz typique à 44.1kHz)
    const centroid = sum > 0 ? (weightedSum / sum) * (audioCtx.sampleRate / 2) / frequencyData.length : 0;
    
    // Normalisation rolloff (0-22050Hz typique à 44.1kHz)
    const rolloff = (rolloffIndex / frequencyData.length) * (audioCtx.sampleRate / 2);
    
    // Visualiser le spectrogramme
    drawSpectrogram(frequencyData);
    
    // Fermer le contexte audio
    audioCtx.close();
    
    return {
      centroid: Math.round(centroid), 
      flux: flux / 1000, // Normalisé
      rolloff: Math.round(rolloff),
      mfcc: mfcc.map(v => parseFloat((v).toFixed(2)))
    };
  };

  const drawSpectrogram = (frequencyData: Uint8Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / Math.min(100, frequencyData.length);
    const heightScale = canvas.height / 255;
    
    for (let i = 0; i < Math.min(100, frequencyData.length); i++) {
      const value = frequencyData[i];
      
      // Gradient de couleur
      const hue = 250 - (value / 255) * 180;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      
      const x = i * barWidth;
      const height = value * heightScale;
      ctx.fillRect(x, canvas.height - height, barWidth, height);
    }
  };

  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const analyzeAudio = async () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            const features = await calculateFeatures(audioBuffer);
            setFeatures(features);
            setLoading(false);
          } catch (err: any) {
            setError(`Erreur d'analyse spectrale: ${err?.message || JSON.stringify(err)}`);
            setLoading(false);
          }
        };
        
        reader.onerror = () => {
          setError("Erreur de lecture du fichier");
          setLoading(false);
        };
        
        reader.readAsArrayBuffer(file);
      } catch (err: any) {
        setError(`Erreur audio: ${err?.message || JSON.stringify(err)}`);
        setLoading(false);
      }
    };
    
    analyzeAudio();
  }, [file]);

  return (
    <div className="w-full mt-6 bg-white/70 rounded-xl shadow p-6 animate-fade-in">
      <h3 className="font-bold text-fuchsia-900 text-xl mb-4">Analyse spectrale avancée</h3>
      {error && <div className="text-red-600 mb-3">{error}</div>}
      {loading && <div className="text-fuchsia-600 mb-3">Analyse en cours...</div>}
      
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={130} 
            className="w-full max-w-md h-40 bg-gray-100 rounded shadow" 
          />
          <div className="text-xs text-gray-600 text-center mt-2">Spectre de fréquences</div>
        </div>
        
        <div className="flex-1">
          {features && (
            <div className="bg-white/90 rounded-2xl shadow-xl p-6 mb-6 animate-fade-in">
              <h4 className="text-xl font-bold text-fuchsia-800 mb-3">Caractéristiques spectrales</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Centroid</div>
                  <div className="text-lg font-mono text-fuchsia-900">{features.centroid} Hz</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Flux spectral</div>
                  <div className="text-lg font-mono text-fuchsia-900">{features.flux.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Rolloff</div>
                  <div className="text-lg font-mono text-fuchsia-900">{features.rolloff} Hz</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">MFCC</div>
                  <div className="text-sm font-mono text-fuchsia-900 overflow-hidden text-ellipsis">{features.mfcc.slice(0, 5).join(", ")}...</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <b>Centroid</b> : brillance du son (fréquence moyenne)<br/>
                <b>Flux</b> : variation spectrale (changements de timbre)<br/>
                <b>Rolloff</b> : limite haute d'énergie spectrale<br/>
                <b>MFCC</b> : coefficients cepstraux (timbre, texture sonore)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
