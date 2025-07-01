"use client";
import React, { useRef, useState } from "react";


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
      setInfo("Select an image");
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
        setInfo("Conversion failed");
        setIsError(true);
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        let outName = file.name.replace(/\.[^/.]+$/, "");
        outName += " (3000x3000).jpeg";
        
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
        
        setInfo("Resized to 3000×3000");
        setIsError(false);
      }
    } catch {
      setInfo("Conversion failed");
      setIsError(true);
    }
    setLoading(false);
  };

  return (
    <div className="px-10 py-12">
      {/* Title */}
      <h2 className="text-lg font-light text-white mb-8 text-center">
        Resize
      </h2>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed py-12 px-8 text-center transition-colors mb-8 ${
          dragActive
            ? 'border-white'
            : 'border-gray-800 hover:border-gray-700'
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
        
        {file ? (
          <div className="space-y-3">
            <p className="text-white text-sm">{file.name}</p>
            <p className="text-gray-500 text-xs">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-gray-400 hover:text-white text-xs transition-colors"
              disabled={loading}
            >
              Change image
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">Drop image</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-white text-sm hover:text-gray-300 transition-colors"
              disabled={loading}
            >
              Browse
            </button>
          </div>
        )}
      </div>

      {/* Convert Button */}
      {file && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-white text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-gray-100"
        >
          {loading ? "Resizing..." : "Resize to 3000×3000"}
        </button>
      )}

      {/* Status */}
      {info && (
        <div className={`mt-4 text-center text-xs ${isError ? 'text-red-400' : 'text-gray-400'}`}>
          {info}
        </div>
      )}


    </div>
  );
}
