"use client";
import React, { useRef, useState } from "react";
import { ImageIcon } from "@/components/icons";
import Image from 'next/image';

export default function ImageConverterWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
      
      // Create preview URL for the image
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(f);
      setImageUrl(url);
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
      
      // Create preview URL for the image
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      const url = URL.createObjectURL(f);
      setImageUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setInfo("Merci de sélectionner une image.");
      setIsError(true);
      return;
    }
    setLoading(true);
    setInfo("");
    setIsError(false);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/image-convert", {
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
        outName += " (3000x3000).jpeg";
        
        // Mettre à jour la prévisualisation avec l'image convertie
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
        setImageUrl(url);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        
        setInfo("Image convertie !");
        setIsError(false);
        // Ne pas reset pour garder la prévisualisation
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
      <ImageIcon className="h-10 w-10 text-white mb-3 mx-auto" />
      <h3 className="text-xl font-bold tracking-tight text-white text-center mb-4">Image Converter</h3>
      <div
        className={`p-5 mb-4 border border-dashed rounded-2xl transition-all duration-200 ${
          dragActive ? "border-accent-400 bg-accent-400/10" : "border-zinc-700 bg-zinc-800/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
        <p className="text-zinc-400 text-center mb-3 text-sm">Déposez votre image ici</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="px-4 py-2.5 bg-accent-400 hover:bg-accent-500 text-white text-sm rounded-full transition-all duration-200 font-medium"
        >
          {file ? file.name : "Choisir une image"}
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
      
      {/* Image Preview */}
      {imageUrl && (
        <div className="mt-6 p-4 bg-zinc-800/70 rounded-xl border border-zinc-700 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-sm font-medium">Prévisualisation image</p>
            <span className="text-accent-400 text-xs px-2 py-1 bg-accent-400/10 rounded-full">3000×3000px</span>
          </div>
          
          <div className="bg-black/40 p-3 rounded-lg mb-3">
            <div className="relative w-full overflow-hidden rounded-lg" style={{ height: '180px' }}>
              <Image
                src={imageUrl!}
                alt="Preview"
                fill
                className="object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-white text-sm truncate">{file?.name}</p>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-zinc-400 flex justify-between">

            <span></span>
          </div>
        </div>
      )}
    </div>
  );
}
