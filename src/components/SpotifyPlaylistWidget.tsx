"use client";
import React, { useState } from "react";

export default function SpotifyPlaylistWidget() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [info, setInfo] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const downloadArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setInfo("Please enter a playlist URL");
      setIsError(true);
      return;
    }

    setLoading(true);
    setInfo("Getting playlist info...");
    setIsError(false);

    try {
      // First, get playlist info
      const playlistRes = await fetch("/api/spotify-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_url: playlistUrl.trim() }),
      });

      if (!playlistRes.ok) {
        const err = await playlistRes.json();
        setInfo(err.error || "Failed to fetch playlist");
        setIsError(true);
        setLoading(false);
        return;
      }

      const playlistData = await playlistRes.json();
      
      if (!playlistData.image_hq) {
        setInfo("No artwork available for this playlist");
        setIsError(true);
        setLoading(false);
        return;
      }

      setInfo("Downloading artwork...");

      // Then download the artwork
      const filename = `${playlistData.name} - Artwork (HQ).jpg`;
      const downloadRes = await fetch("/api/download-artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image_url: playlistData.image_hq,
          filename: filename,
          spotify_url: playlistData.platform === 'spotify' ? playlistData.spotify_url : undefined
        }),
      });
      
      if (!downloadRes.ok) {
        const errorData = await downloadRes.json();
        throw new Error(errorData.error || `HTTP ${downloadRes.status}: ${downloadRes.statusText}`);
      }
      
      // Check content type to determine if it's JSON (error) or blob (image)
      const contentType = downloadRes.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // It's a JSON response (probably CDN_BLOCKED case)
        const responseData = await downloadRes.json();
        if (responseData.error === "CDN_BLOCKED") {
          // Open the direct image URL in a new tab for manual download
          window.open(responseData.direct_url, '_blank');
          setInfo("CDN blocked download - opened image in new tab. Right-click to save!");
          setIsError(false);
          setLoading(false);
          return;
        }
      }
      
      // It's a successful image download
      const blob = await downloadRes.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setInfo(`"${playlistData.name}" artwork downloaded!`);
      setIsError(false);

    } catch (error) {
      console.error("Download error:", error);
      setInfo(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsError(true);
    }
    
    setLoading(false);
  };

  return (
    <div className="px-10 py-12">
      {/* Title */}
      <h2 className="text-lg font-light text-white mb-8 text-center">
        Playlist Artwork
      </h2>

      {/* URL Input */}
      <form onSubmit={downloadArtwork} className="mb-8">
        <div className="mb-6">
          <input
            type="text"
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="Spotify, Deezer, Apple Music, or Amazon Music playlist URL..."
            className="w-full py-3 px-0 bg-transparent text-white border-0 border-b border-gray-800 focus:outline-none focus:border-white transition-colors text-sm placeholder-gray-500"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !playlistUrl.trim()}
          className="w-full py-4 bg-white text-black text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-gray-100"
        >
          {loading ? "Downloading..." : "Download Artwork"}
        </button>
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