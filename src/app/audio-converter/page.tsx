"use client";
import React, { useRef, useState } from "react";
import Layout from "@/components/Layout"; // Import du Layout
import { ConverterIcon } from "@/components/icons";

export default function AudioConverterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false); // Pour styliser le message d'info
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setInfo("");
      setIsError(false);
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
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url); // Nettoyer l'URL blob
        setInfo("Fichier converti et téléchargé !");
        setIsError(false);
        setFile(null); // Réinitialiser après succès
        if (inputRef.current) {
          inputRef.current.value = ""; // Réinitialiser l'input file natif
        }
      }
    } catch (e) {
      setInfo("Erreur de connexion ou de conversion.");
      setIsError(true);
    }
    setLoading(false);
  };

  // Style dynamique pour le message d'info
  const infoStyle = isError
    ? "text-red-400"
    : "text-green-400";

  return (
    <Layout> {/* Utilisation du Layout */}
      <div
        className={`flex flex-col items-center animate-in fade-in duration-500 bg-finance-800/50 backdrop-blur-md shadow-glass-lg p-8 rounded-lg w-full max-w-md border-2 ${dragActive ? 'border-accent-400' : 'border-finance-600'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ConverterIcon className="h-16 w-16 text-accent-400 mx-auto mb-4" />
        <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-finance-50">
            Audio Converter
          </h1>
          <p className="text-base md:text-lg text-finance-300 leading-relaxed max-w-xl">
            Convertis n'importe quel fichier audio en{" "}
            <span className="font-semibold text-accent-400">WAV 24bits, 44,1kHz</span>.
          </p>
           <p className="mt-2 text-sm text-finance-400 max-w-lg">
             Idéal pour le studio, le mastering ou l'archivage haute qualité.
           </p>
        </div>

        {/* Formulaire avec animation */}
        <form
          className="w-full max-w-md flex flex-col items-center gap-5 animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out delay-150"
          onSubmit={handleSubmit}
        >
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            ref={inputRef}
            onChange={handleFileChange}
            disabled={loading}
          />

          {/* Bouton de sélection de fichier */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="w-full px-6 py-3 bg-finance-700/50 rounded-lg border border-finance-600 text-finance-100 font-medium shadow-sm hover:bg-finance-600/50 hover:border-finance-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 ease-out focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 text-center truncate"
          >
            {file ? `Fichier : ${file.name}` : "Choisir un fichier audio"}
          </button>

          {/* Bouton de conversion */}
          <button
            type="submit"
            disabled={!file || loading}
            className="w-full px-8 py-3 bg-accent-500 hover:bg-accent-600 rounded-lg text-white font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ease-out focus:ring-2 focus:ring-offset-2 focus:ring-accent-400 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Conversion...
              </>
            ) : (
              "Convertir en WAV 24bits/44,1kHz"
            )}
          </button>

          {/* Barre de progression */}
          {loading && (
            <div className="w-full bg-finance-700/50 rounded-full h-2 overflow-hidden mt-4">
              <div className="h-full bg-accent-400 animate-pulse" style={{ width: '75%' }}></div>
            </div>
          )}
          {/* Message d'information */}
          {info && (
            <div className={`text-center text-sm mt-2 ${infoStyle} animate-in fade-in duration-300`}>
              {info}
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}