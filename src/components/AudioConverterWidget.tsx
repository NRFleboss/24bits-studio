"use client";
import React, { useRef, useState } from "react";
import { ConverterIcon } from "@/components/icons";

export default function AudioConverterWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [info, setInfo] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setInfo("");
      setIsError(false);
      
      // Create preview URL for the audio file
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setInfo("");
      setIsError(false);
      
      // Create preview URL for the audio file
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const url = URL.createObjectURL(f);
      setAudioUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setInfo("Merci de sélectionner un fichier audio.");
      setIsError(true);
      return;
    }
    setLoading(true);
    setInfo("");
    setIsError(false);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/audio-convert", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setInfo("Erreur : " + (err.error || "Conversion impossible."));
        setIsError(true);
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        let outName = file.name.replace(/\.[^/.]+$/, "");
        outName += " (24bits).wav";
        
        // Mise à jour de la prévisualisation avec le fichier converti
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(url);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        setInfo("Fichier converti !");
        setIsError(false);
        // Ne pas reset le fichier et l'URL pour garder la prévisualisation
        // setFile(null);
        // if (inputRef.current) inputRef.current.value = "";
      }
    } catch {
      setInfo("Erreur de conversion.");
      setIsError(true);
    }
    setLoading(false);
  };

  const infoStyle = isError ? "text-red-400" : "text-green-400";

  return (
    <div className="group bg-zinc-900 p-6 rounded-3xl border border-zinc-800 overflow-hidden transition-all duration-300 hover:bg-zinc-800/80 hover:border-accent-500/30">
      <ConverterIcon className="h-10 w-10 text-white mb-3 mx-auto" />
      <h3 className="text-xl font-bold tracking-tight text-white text-center mb-4">Audio Converter</h3>
      <div
        className={`p-5 mb-4 border border-dashed rounded-2xl ${
          dragActive ? "border-accent-400 bg-accent-400/10" : "border-zinc-700 bg-zinc-800/50"
        } transition-all duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="audio/*"
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
        <p className="text-zinc-400 text-center mb-3 text-sm">Déposez votre fichier audio ici</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="px-4 py-2.5 bg-accent-400 hover:bg-accent-500 text-white text-sm rounded-full transition-all duration-200 font-medium"
        >
          {file ? file.name : "Choisir un fichier"}
        </button>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 bg-accent-400 hover:bg-accent-500 text-white rounded-full font-semibold tracking-wide transition-all duration-200 mb-2"
      >
        {loading ? "Conversion..." : "Convertir"}
      </button>
      {loading && (
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-accent-300 animate-pulse"
            style={{ width: "75%" }}
          ></div>
        </div>
      )}
      {info && <div className={`${infoStyle} text-sm text-center mt-2`}>{info}</div>}
      
      {/* Audio Preview */}
      {audioUrl && (
        <div className="mt-6 p-4 bg-zinc-800/70 rounded-xl border border-zinc-700 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-sm font-medium">Prévisualisation audio</p>
            <span className="text-accent-400 text-xs px-2 py-1 bg-accent-400/10 rounded-full">24bits/44.1kHz</span>
          </div>
          
          <div className="bg-black/40 p-3 rounded-lg mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-400 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="text-white text-sm truncate">{file?.name}</p>
                <audio 
                  src={audioUrl} 
                  controls 
                  className="w-full h-8 mt-1" 
                  controlsList="nodownload"
                />
              </div>
            </div>
          </div>
          
          <div className="text-xs text-zinc-400">

          </div>
        </div>
      )}
    </div>
  );
}
