"use client";
import React, { useState } from "react";

export default function LyricsFormatterWidget() {
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [lyricsBy, setLyricsBy] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [info, setInfo] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !title || !lyricsBy || !lyrics) {
      setInfo("Fill all fields");
      setIsError(true);
      return;
    }
    setLoading(true);
    setInfo("");
    setIsError(false);
    
    try {
      const res = await fetch("/api/lyrics-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artist, title, lyricsBy, lyrics }),
      });
      if (!res.ok) {
        const err = await res.json();
        setInfo("Generation failed");
        setIsError(true);
      } else {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const outName = `${artist} - ${title} (lyrics).pdf`;
        const a = document.createElement("a");
        a.href = url;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setInfo("PDF generated");
        setIsError(false);
      }
    } catch {
      setInfo("Generation failed");
      setIsError(true);
    }
    setLoading(false);
  };

  const isFormValid = artist && title && lyricsBy && lyrics;

  return (
    <div className="px-10 py-12">
      {/* Title */}
      <h2 className="text-lg font-light text-white mb-8 text-center">
        Format
      </h2>

      {/* Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Artist & Title */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist"
            className="py-3 px-0 bg-transparent text-white border-0 border-b border-gray-800 focus:outline-none focus:border-white transition-colors text-sm placeholder-gray-500"
            disabled={loading}
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="py-3 px-0 bg-transparent text-white border-0 border-b border-gray-800 focus:outline-none focus:border-white transition-colors text-sm placeholder-gray-500"
            disabled={loading}
          />
        </div>

        {/* Lyrics By */}
        <input
          type="text"
          value={lyricsBy}
          onChange={(e) => setLyricsBy(e.target.value)}
          placeholder="Lyrics by"
          className="w-full py-3 px-0 bg-transparent text-white border-0 border-b border-gray-800 focus:outline-none focus:border-white transition-colors text-sm placeholder-gray-500"
          disabled={loading}
        />

        {/* Lyrics */}
        <div className="relative">
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            rows={8}
            placeholder="Paste your lyrics here..."
            className="w-full py-4 px-0 bg-transparent text-white border border-gray-800 focus:outline-none focus:border-white transition-colors text-sm placeholder-gray-500 resize-none"
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        {isFormValid && (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-gray-100"
          >
            {loading ? "Generating..." : "Generate PDF"}
          </button>
        )}
      </form>

      {/* Status */}
      {info && (
        <div className={`mt-4 text-center text-xs ${isError ? 'text-red-400' : 'text-gray-400'}`}>
          {info}
        </div>
      )}
    </div>
  );
}
