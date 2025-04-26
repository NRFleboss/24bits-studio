"use client";
import React, { useEffect, useRef, useState } from "react";

interface SimpleAudioFeaturesProps {
  file: File;
}

export default function SimpleAudioFeatures({ file }: SimpleAudioFeaturesProps) {
  const [features, setFeatures] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const analyzeAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Extraction basique des caractéristiques
            const channelData = audioBuffer.getChannelData(0);
            
            // Calcul de l'énergie moyenne (RMS)
            let rmsSum = 0;
            for (let i = 0; i < channelData.length; i++) {
              rmsSum += channelData[i] * channelData[i];
            }
            const rms = Math.sqrt(rmsSum / channelData.length);
            
            // Calcul du zero-crossing rate
            let zcr = 0;
            for (let i = 1; i < channelData.length; i++) {
              if ((channelData[i] * channelData[i-1]) < 0) {
                zcr++;
              }
            }
            zcr = zcr / channelData.length;
            
            // Détection du BPM (simplifié)
            const bpm = estimateBPM(channelData, audioBuffer.sampleRate);
            
            // Détection simple de la tonalité majeure/mineure
            const keyInfo = estimateKey(channelData, audioBuffer.sampleRate);
            
            // Draw the frequency spectrum
            drawFrequencySpectrum(channelData, audioBuffer.sampleRate);
            
            setFeatures({
              rms,
              zcr,
              bpm,
              key: keyInfo.key,
              scale: keyInfo.scale,
              energy: Math.min(rms * 100, 1),
              brightness: keyInfo.brightness
            });
            
            setLoading(false);
          } catch (err: any) {
            console.error("Analysis error:", err);
            setError(`Erreur d'analyse: ${err.message || "Erreur inconnue"}`);
            setLoading(false);
          }
        };
        
        reader.onerror = () => {
          setError("Erreur de lecture du fichier");
          setLoading(false);
        };
        
        reader.readAsArrayBuffer(file);
      } catch (err: any) {
        setError(`Erreur audio: ${err.message || "Erreur inconnue"}`);
        setLoading(false);
      }
    };
    
    analyzeAudio();
  }, [file]);
  
  const drawFrequencySpectrum = (channelData: Float32Array, sampleRate: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculer le spectre avec une FFT simplifiée
    const fftSize = 2048;
    const bufferLength = fftSize / 2;
    
    // Simplification: utilisons un sous-ensemble de données pour la démo
    const dataSegment = channelData.slice(0, fftSize);
    
    // Pseudo-FFT (version très simplifiée pour la démo)
    const magnitude = Array(bufferLength).fill(0);
    
    // Pour chaque bin de fréquence, mesurons l'énergie
    for (let i = 0; i < bufferLength; i++) {
      const freq = i * sampleRate / fftSize;
      const correlation = 1 / freq;
      let sum = 0;
      
      // Cherche la corrélation pour cette fréquence
      for (let j = 0; j < dataSegment.length - 1; j++) {
        sum += Math.abs(dataSegment[j]);
      }
      
      // Plus forte pour les fréquences basses (comme l'ouïe humaine)
      magnitude[i] = sum * Math.exp(-i/bufferLength * 3);
    }
    
    // Normaliser
    const maxVal = Math.max(...magnitude);
    const normalizedMag = magnitude.map(val => val / maxVal);
    
    // Dessiner
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, width, height);
    
    // Dessiner les barres
    const barWidth = width / bufferLength;
    
    for (let i = 0; i < bufferLength; i++) {
      const value = normalizedMag[i];
      const percent = i / bufferLength;
      const hue = 250 - percent * 170; // Couleur: bleu -> rose
      const saturation = 60 + percent * 20; // Plus saturé sur les aigus
      const lightness = 30 + value * 30; // Plus lumineux si plus fort
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      
      const x = i * barWidth;
      const h = value * height;
      ctx.fillRect(x, height - h, barWidth, h);
    }
  };
  
  const estimateBPM = (channelData: Float32Array, sampleRate: number): number | null => {
    try {
      // Calcul simplifié du BPM
      const hopSize = 512;
      const rmsValues: number[] = [];
      
      // Calculer l'énergie (RMS) par frame
      for (let i = 0; i < channelData.length; i += hopSize) {
        let sum = 0;
        for (let j = 0; j < hopSize && (i + j) < channelData.length; j++) {
          sum += channelData[i + j] * channelData[i + j];
        }
        rmsValues.push(Math.sqrt(sum / hopSize));
      }
      
      // Seuil d'énergie pour considérer un beat
      const mean = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;
      const threshold = mean * 1.5;
      
      // Trouver les pics d'énergie
      const peaks: number[] = [];
      for (let i = 1; i < rmsValues.length - 1; i++) {
        if (rmsValues[i] > threshold && 
            rmsValues[i] > rmsValues[i-1] && 
            rmsValues[i] > rmsValues[i+1]) {
          peaks.push(i);
        }
      }
      
      // Calculer les intervalles entre pics
      if (peaks.length < 2) return null;
      
      const intervals: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i-1]);
      }
      
      // Moyenne des intervalles
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      // Convertir en BPM
      const frameTime = hopSize / sampleRate;
      const timeBetweenBeats = frameTime * avgInterval;
      const bpm = 60 / timeBetweenBeats;
      
      return Math.round(bpm);
    } catch (e) {
      console.error("BPM estimation failed:", e);
      return null;
    }
  };
  
  const estimateKey = (channelData: Float32Array, sampleRate: number): KeyInfo => {
    try {
      // Notes (chroma)
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const chromaBins = Array(12).fill(0);
      
      // Analyse de fréquence très simplifiée
      const fftSize = 8192;
      const segment = channelData.slice(0, Math.min(fftSize, channelData.length));
      
      // Pour chaque bin
      for (let i = 0; i < segment.length; i++) {
        const amplitude = Math.abs(segment[i]);
        const phase = i / segment.length;
        
        // Associer à une note approximativement
        const noteIndex = Math.floor(phase * 12);
        chromaBins[noteIndex] += amplitude;
      }
      
      // Trouver la note dominante
      const maxBin = chromaBins.indexOf(Math.max(...chromaBins));
      const key = notes[maxBin];
      
      // Mode majeur/mineur (très approximatif)
      const major = (maxBin + 4) % 12; 
      const minor = (maxBin + 3) % 12;
      const scale = chromaBins[major] > chromaBins[minor] ? "Major" : "Minor";
      
      // Estimation de la brillance (haute fréquence)
      const brightness = Math.min(0.1 + Math.max(...chromaBins.slice(6)) / Math.max(...chromaBins), 1);
      
      return { key, scale, brightness };
    } catch (e) {
      console.error("Key estimation failed:", e);
      return { key: "?", scale: "?", brightness: 0.5 };
    }
  };
  
  return (
    <div className="w-full bg-white/70 rounded-xl shadow-lg p-6 animate-fade-in">
      <h3 className="font-bold text-fuchsia-900 text-xl mb-4">Analyse Audio</h3>
      
      {error && <div className="text-red-600 mb-3 p-3 bg-red-50 rounded">{error}</div>}
      {loading && <div className="text-fuchsia-600 mb-3">Analyse en cours...</div>}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Spectre de fréquences */}
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-fuchsia-800 mb-2">Spectre de fréquences</h4>
          <canvas 
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-40 bg-black rounded shadow-md"
          />
          <div className="text-xs text-gray-600 mt-1 italic">
            Représentation des fréquences dominantes
          </div>
        </div>
        
        {/* Caractéristiques musicales */}
        {features && (
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-fuchsia-800 mb-2">Caractéristiques</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Tonalité</div>
                <div className="text-xl font-bold text-fuchsia-900">
                  {features.key} {features.scale}
                </div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">BPM</div>
                <div className="text-xl font-bold text-fuchsia-900">
                  {features.bpm || "-"}
                </div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Énergie</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-fuchsia-600 h-2.5 rounded-full" 
                       style={{ width: `${features.energy * 100}%` }} />
                </div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Brillance</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-fuchsia-600 h-2.5 rounded-full" 
                       style={{ width: `${features.brightness * 100}%` }} />
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-600">
              <b>Tonalité</b> : La note fondamentale et le mode<br/>
              <b>BPM</b> : Tempo en battements par minute<br/>
              <b>Énergie</b> : Niveau d'intensité du son<br/>
              <b>Brillance</b> : Présence de hautes fréquences
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
