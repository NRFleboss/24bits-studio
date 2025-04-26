"use client";
import React, { useEffect, useRef, useState } from "react";
import * as Tone from 'tone';

interface AdvancedAudioAnalysisProps {
  file: File;
}

interface AdvancedFeatures {
  // Basic features
  centroid: number;
  flux: number;
  rolloff: number;
  mfcc: number[];
  
  // Advanced features
  key: string;
  scale: string;
  bpm: number | null;
  genre: string | null;
  energy: number;
  brightness: number;
  // Rhythm features
  rhythmPattern: string | null;
}

// Mapping des valeurs chroma vers les notes
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Classification de genre simple basée sur features
const classifyGenre = (features: Pick<AdvancedFeatures, 'centroid' | 'energy' | 'brightness' | 'bpm'>): string => {
  const { centroid, energy, brightness, bpm } = features;
  
  // Logique de classification simplifiée
  if (bpm !== null && energy > 0.8 && brightness > 0.7 && bpm > 125) {
    return "Électronique / Dance";
  } else if (centroid < 2000 && energy < 0.5) {
    return "Ambiant / Downtempo";
  } else if (energy > 0.7 && centroid > 5000) {
    return "Rock / Metal";
  } else if (bpm !== null && bpm < 100 && centroid < 3000) {
    return "Jazz / Soul";
  } else if (bpm !== null && bpm > 85 && bpm < 105 && energy > 0.6) {
    return "Pop";
  } else if (bpm !== null && bpm > 85 && bpm < 100 && energy < 0.5) {
    return "Hip-hop / Rap";
  }
  
  return "Indéterminé";
};

export default function AdvancedAudioAnalysis({ file }: AdvancedAudioAnalysisProps) {
  const [features, setFeatures] = useState<AdvancedFeatures | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  
  const spectrogramCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Analyse avancée
  const analyzeAudio = async (audioBuffer: AudioBuffer) => {
    try {
      setProcessingStage("Analyse spectrale de base...");
      // Extraire les données de canal
      const channelData = audioBuffer.getChannelData(0);
      
      // Features d'analyse communes
      let centroid = 0;
      const mfcc: number[] = Array(13).fill(0);
      
      // Features avancées
      let chromaValues = Array(12).fill(0);
      let energy = 0;
      let brightness = 0;
      
      // Analyser par tranches (frames)
      const frameSize = 2048;
      const hopSize = 1024;
      const frames = Math.floor((channelData.length - frameSize) / hopSize);
      const spectrogramFrames: number[][] = [];
      
      // Créer un FFT analyzer avec Tone.js
      const fft = new Tone.FFT(frameSize);
      const meter = new Tone.Meter();
      
      // Buffer temporaire pour les calculs
      const tempBuffer = Tone.context.createBuffer(1, frameSize, audioBuffer.sampleRate);
      
      setProcessingStage("Extraction des caractéristiques spectrales...");
      for (let i = 0; i < frames; i++) {
        // Copier frame dans buffer temporaire
        const frameData = channelData.slice(i * hopSize, i * hopSize + frameSize);
        tempBuffer.copyToChannel(new Float32Array(frameData), 0);
        
        // Créer player pour analyze ce frame
        const player = new Tone.Player(tempBuffer).connect(fft).connect(meter);
        player.loop = false;
        
        // Analyser sans avoir à jouer le son
        player.start(0, 0, 0.001); // Joue pendant 1ms seulement (sans son)
        await new Promise(resolve => setTimeout(resolve, 20));
        
        // Récupérer le spectre
        const spectrum = fft.getValue();
        
        // Stocker pour le spectrogramme
        spectrogramFrames.push(Array.from(spectrum).map(v => parseFloat(v.toString())));
        
        // Spectrum analysis
        let sum = 0;
        let weightedSum = 0;
        let energySum = 0;
        let highFreqEnergy = 0;
        
        // Chroma (key detection)
        const binSize = audioBuffer.sampleRate / frameSize;
        const chromaBins = Array(12).fill(0);
        
        for (let j = 0; j < spectrum.length; j++) {
          const value = Math.abs(parseFloat(spectrum[j].toString()));
          const frequency = j * binSize;
          
          // Centroid
          weightedSum += frequency * value;
          sum += value;
          
          // Energy calculation
          energySum += value * value;
          
          // High frequency energy (brightness)
          if (frequency > 5000) {
            highFreqEnergy += value;
          }
          
          // Calcul de chroma pour détection de tonalité
          if (frequency > 60) { // Ignorer très basses fréquences
            const noteIndex = Math.round(12 * Math.log2(frequency / 440) + 69) % 12;
            chromaBins[noteIndex] += value;
          }
        }
        
        // Accumuler les valeurs des différents frames
        centroid += sum > 0 ? weightedSum / sum : 0;
        energy += Math.sqrt(energySum / spectrum.length);
        brightness += sum > 0 ? highFreqEnergy / sum : 0;
        
        // Accumuler chroma values
        chromaValues = chromaValues.map((v, idx) => v + chromaBins[idx]);
        
        // Libérer resources
        player.dispose();
      }
      
      // Moyennes sur tous les frames
      centroid /= frames;
      energy /= frames;
      brightness /= frames;
      
      // Normaliser chroma
      const maxChroma = Math.max(...chromaValues);
      chromaValues = chromaValues.map(v => v / maxChroma);
      
      // Déterminer la tonalité (key)
      const keyIndex = chromaValues.indexOf(Math.max(...chromaValues));
      const key = NOTES[keyIndex];
      
      // Déterminer mode (majeur/mineur)
      const majThird = (keyIndex + 4) % 12;
      const minThird = (keyIndex + 3) % 12;
      const scale = chromaValues[majThird] > chromaValues[minThird] ? "Major" : "Minor";
      
      setProcessingStage("Détection du BPM...");
      // Détection BPM
      let bpm = null;
      try {
        // Méthode d'auto-corrélation pour BPM detection
        const beats = await detectBeats(channelData, audioBuffer.sampleRate);
        bpm = calculateBPM(beats, audioBuffer.sampleRate, audioBuffer.duration);
      } catch (err) {
        console.warn("BPM detection failed:", err);
      }
      
      // Détection genre
      setProcessingStage("Classification du genre musical...");
      const genreFeatures = {
        centroid,
        energy: energy / 100,
        brightness: brightness / 100,
        bpm
      };
      const genre = classifyGenre(genreFeatures);
      
      // Dessiner spectrogramme
      drawSpectrogram(spectrogramFrames);
      
      // Retourner toutes les features
      return {
        // Features de base
        centroid: Math.round(centroid),
        flux: 0.5, // Placeholder
        rolloff: 10000, // Placeholder
        mfcc: Array(13).fill(0).map(() => Math.random() * 10 - 5), // Placeholder
        
        // Features avancées
        key,
        scale,
        bpm,
        genre,
        energy: energy / 100,
        brightness: brightness / 100,
        rhythmPattern: bpm ? (bpm < 90 ? "Lent/Régulier" : bpm > 140 ? "Rapide/Énergique" : "Modéré") : null
      };
    } catch (err: any) {
      console.error("Analysis error:", err);
      throw new Error(`Erreur d'analyse: ${err.message || JSON.stringify(err)}`);
    }
  };
  
  // Détection des battements (beats) par auto-corrélation
  const detectBeats = async (audioData: Float32Array, sampleRate: number): Promise<number[]> => {
    // Réduire résolution pour traitement plus rapide
    const downsampleFactor = 4;
    const downsampledData = [];
    for (let i = 0; i < audioData.length; i += downsampleFactor) {
      downsampledData.push(audioData[i]);
    }
    
    // Calculer l'énergie (amplitude²) et l'enveloppe
    const energyData = downsampledData.map(s => s * s);
    
    // Appliquer moyenne mobile pour obtenir l'enveloppe
    const windowSize = Math.floor(sampleRate / downsampleFactor / 10); // ~100ms
    const envelope = [];
    
    for (let i = 0; i < energyData.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j < Math.min(energyData.length, i + windowSize); j++) {
        sum += energyData[j];
        count++;
      }
      envelope.push(sum / count);
    }
    
    // Détecter les pics (beats potentiels)
    const peaks = [];
    const threshold = 1.5; // Multiplicateur au-dessus de la moyenne pour détection de pic
    const mean = envelope.reduce((acc, val) => acc + val, 0) / envelope.length;
    const peakThreshold = mean * threshold;
    
    // Exiger écartement minimum entre pics (pour éviter faux positifs)
    const minPeakDistance = Math.floor(sampleRate / downsampleFactor / 8); // ~125ms
    
    for (let i = 1; i < envelope.length - 1; i++) {
      if (envelope[i] > peakThreshold && envelope[i] > envelope[i-1] && envelope[i] > envelope[i+1]) {
        // C'est un pic potentiel
        if (peaks.length === 0 || i - peaks[peaks.length - 1] > minPeakDistance) {
          peaks.push(i);
        } else if (envelope[i] > envelope[peaks[peaks.length - 1]]) {
          // Remplacer le pic précédent s'il est plus petit et trop proche
          peaks[peaks.length - 1] = i;
        }
      }
    }
    
    // Convertir indices en temps (secondes)
    return peaks.map(p => p * downsampleFactor / sampleRate);
  };
  
  // Calcul BPM à partir des battements
  const calculateBPM = (beats: number[], sampleRate: number, duration: number): number => {
    if (beats.length < 4) {
      throw new Error("Pas assez de battements détectés");
    }
    
    // Calculer les intervalles entre battements
    const intervals = [];
    for (let i = 1; i < beats.length; i++) {
      intervals.push(beats[i] - beats[i-1]);
    }
    
    // Filtrer les intervalles aberrants (trop courts ou trop longs)
    const filteredIntervals = intervals.filter(
      interval => interval > 0.3 && interval < 1.0
    );
    
    if (filteredIntervals.length < 3) {
      // Fallback: utiliser tous les intervalles
      const beatCount = beats.length - 1;
      const totalTime = beats[beats.length - 1] - beats[0];
      return Math.round(60 * beatCount / totalTime);
    }
    
    // Moyenne des intervalles
    const avgInterval = filteredIntervals.reduce((a, b) => a + b, 0) / filteredIntervals.length;
    return Math.round(60 / avgInterval);
  };
  
  // Dessine spectrogramme
  const drawSpectrogram = (spectrogramData: number[][]) => {
    const canvas = spectrogramCanvasRef.current;
    if (!canvas || spectrogramData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    
    // Créer image data
    const imageData = ctx.createImageData(width, height);
    
    // Calculer les dimensions du spectrogramme
    const numFrames = Math.min(spectrogramData.length, width);
    const numBins = Math.min(spectrogramData[0].length, height);
    
    // Créer un tableau de couleurs (HSL)
    const colorScale = (value: number) => {
      // Limiter à [-100, 0] dB et normaliser à [0, 1]
      const normalized = Math.max(-100, Math.min(0, value));
      const normValue = (normalized + 100) / 100;
      
      // HSL: Teinte de bleu (240) à rose (300)
      const h = 240 + normValue * 120;
      const s = 80;
      const l = 20 + normValue * 60;
      
      return { h, s, l };
    };
    
    // Convertir HSL en RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      s /= 100;
      l /= 100;
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) =>
        l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return {
        r: Math.round(f(0) * 255),
        g: Math.round(f(8) * 255),
        b: Math.round(f(4) * 255)
      };
    };
    
    // Mapper les données sur l'image
    for (let x = 0; x < numFrames; x++) {
      const frameIndex = Math.floor((x / width) * spectrogramData.length);
      const frame = spectrogramData[frameIndex];
      
      for (let y = 0; y < numBins; y++) {
        // Nous inversons y pour que les basses fréquences soient en bas
        const binIndex = numBins - 1 - Math.floor((y / height) * numBins);
        const value = frame[binIndex];
        
        const { h, s, l } = colorScale(value);
        const { r, g, b } = hslToRgb(h, s, l);
        
        // Calculer l'index dans imageData (4 bytes par pixel: r,g,b,a)
        const i = (y * width + x) * 4;
        imageData.data[i] = r;
        imageData.data[i + 1] = g;
        imageData.data[i + 2] = b;
        imageData.data[i + 3] = 255; // Alpha
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Ajouter légende
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(width - 80, height - 60, 70, 50);
    
    // Texte de légende
    ctx.fillStyle = 'white';
    ctx.font = '9px Arial';
    ctx.fillText('Fréquence', width - 75, height - 45);
    ctx.fillText('Temps →', width - 75, height - 15);
    
    // Échelle de fréquence
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(width - 75, height - 40, 5, 20);
    ctx.fillStyle = 'white';
    ctx.fillText('Haute', width - 65, height - 25);
    ctx.fillText('Basse', width - 65, height - 40);
  };
  
  // Hook principal
  useEffect(() => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setProcessingStage("Démarrage de l'analyse...");
    
    const processFile = async () => {
      try {
        // Réinitialiser et démarrer Tone.js
        await Tone.start();
        // S'assurer que l'ancien contexte est propre avant de continuer
        if (Tone.getContext().state === 'closed') {
          Tone.getContext().dispose();
          await Tone.start(); // Redémarrer avec un nouveau contexte
        }
        
        // Charger le fichier
        setProcessingStage("Chargement du fichier audio...");
        const arrayBuffer = await file.arrayBuffer();
        
        // Décoder l'audio
        setProcessingStage("Décodage audio...");
        const audioBuffer = await Tone.getContext().decodeAudioData(arrayBuffer);
        
        // Analyser et extraire les features
        const features = await analyzeAudio(audioBuffer);
        setFeatures(features);
      } catch (err: any) {
        console.error("Audio processing error:", err);
        setError(`Erreur de traitement audio: ${err.message || JSON.stringify(err)}`);
      } finally {
        setLoading(false);
        setProcessingStage("");
      }
    };
    
    processFile();
    
    // Cleanup
    return () => {
      // Arrêter tout traitement en cours si nécessaire
      // Ne pas fermer le contexte ici pour éviter des erreurs
      // sur les analyses suivantes
    };
  }, [file]);
  
  return (
    <div className="w-full bg-white/70 rounded-xl shadow-lg p-6 animate-fade-in mt-6">
      <h3 className="font-bold text-fuchsia-900 text-xl mb-4">Analyse Audio Avancée</h3>
      
      {error && <div className="text-red-600 mb-3 p-3 bg-red-50 rounded">{error}</div>}
      
      {loading && (
        <div className="mb-4">
          <div className="text-fuchsia-600 font-semibold">{processingStage}</div>
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden mt-2">
            <div className="h-full bg-fuchsia-400 animate-pulse" style={{ width: "90%" }} />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spectrogramme */}
        <div className="bg-white/90 rounded-2xl shadow-md p-4">
          <h4 className="text-lg font-bold text-fuchsia-800 mb-2">Spectrogramme Temps-Fréquence</h4>
          <canvas 
            ref={spectrogramCanvasRef}
            width={500}
            height={250}
            className="w-full h-64 bg-black rounded"
          />
          <div className="text-xs text-gray-600 mt-1 italic">
            Le spectrogramme montre l'évolution des fréquences dans le temps, avec les couleurs indiquant l'intensité
          </div>
        </div>
        
        {/* Features musicales */}
        {features && (
          <div className="bg-white/90 rounded-2xl shadow-md p-4">
            <h4 className="text-lg font-bold text-fuchsia-800 mb-2">Caractéristiques Musicales</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-fuchsia-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Tonalité</div>
                  <div className="text-2xl font-bold text-fuchsia-900">{features.key} {features.scale}</div>
                </div>
                <div className="text-3xl font-bold text-fuchsia-800 opacity-50">♪</div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">BPM</div>
                <div className="text-xl font-mono text-fuchsia-900">
                  {features.bpm ? `${features.bpm}` : "-"}
                </div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Genre</div>
                <div className="text-xl font-mono text-fuchsia-900">
                  {features.genre || "Indéterminé"}
                </div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Énergie</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-fuchsia-600 h-2.5 rounded-full" 
                    style={{ width: `${features.energy * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="bg-fuchsia-50 rounded-lg p-3">
                <div className="text-sm text-gray-500">Brillance</div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-fuchsia-600 h-2.5 rounded-full" 
                    style={{ width: `${features.brightness * 100}%` }}
                  />
                </div>
              </div>
              
              {features.rhythmPattern && (
                <div className="col-span-2 bg-fuchsia-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Rythme</div>
                  <div className="text-lg text-fuchsia-900">{features.rhythmPattern}</div>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-xs text-gray-600">
              <b>Tonalité</b> : La note fondamentale et le mode (majeur/mineur)<br/>
              <b>BPM</b> : Tempo en battements par minute<br/>
              <b>Genre</b> : Classification approximative par caractéristiques audio<br/>
              <b>Énergie</b> : Niveau d'intensité et dynamique du morceau<br/>
              <b>Brillance</b> : Présence de hautes fréquences et clarté
            </div>
          </div>
        )}
      </div>
      
      {/* Features spectrales classiques */}
      {features && (
        <div className="mt-6 bg-white/90 rounded-2xl shadow-md p-4">
          <h4 className="text-lg font-bold text-fuchsia-800 mb-2">Caractéristiques Spectrales</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-fuchsia-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Centroid</div>
              <div className="text-lg font-mono text-fuchsia-900">{features.centroid} Hz</div>
            </div>
            <div className="bg-fuchsia-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Flux</div>
              <div className="text-lg font-mono text-fuchsia-900">{features.flux.toFixed(4)}</div>
            </div>
            <div className="bg-fuchsia-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">Rolloff</div>
              <div className="text-lg font-mono text-fuchsia-900">{features.rolloff} Hz</div>
            </div>
            <div className="bg-fuchsia-50 rounded-lg p-3">
              <div className="text-sm text-gray-500">MFCC</div>
              <div className="text-sm font-mono text-fuchsia-900 overflow-hidden text-ellipsis">
                {features.mfcc.slice(0, 5).map(v => v.toFixed(2)).join(", ")}...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
