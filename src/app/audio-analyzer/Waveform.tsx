import React, { useEffect, useRef } from "react";

interface WaveformProps {
  file: File;
}

// Affiche la forme d'onde du fichier audio uploadé
export default function Waveform({ file }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file) return;
    const reader: FileReader = new FileReader();
    reader.onload = async (e) => {
      const audioCtx = new (window.AudioContext || (window as typeof globalThis).webkitAudioContext)();
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      // On réduit la résolution pour le dessin
      const samples = 300;
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData = Array(samples).fill(0).map((_, i) => {
        const blockStart = i * blockSize;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        return sum / blockSize;
      });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      ctx!.fillStyle = "#a21caf";
      const max = Math.max(...filteredData);
      filteredData.forEach((val, i) => {
        const x = (i / samples) * canvas.width;
        const y = (1 - val / max) * canvas.height;
        ctx!.fillRect(x, y, canvas.width / samples, canvas.height - y);
      });
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  return (
    <canvas ref={canvasRef} width={400} height={80} className="w-full h-20 bg-gray-100 rounded my-4" />
  );
}
