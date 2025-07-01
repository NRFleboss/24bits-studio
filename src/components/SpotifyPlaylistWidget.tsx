"use client";
import React, { useState } from "react";

interface PlaylistInfo {
  name: string;
  description: string;
  image: string;
  image_hq: string;
  tracks_total: number;
  owner: string;
  spotify_url?: string;
  deezer_url?: string;
  apple_url?: string;
  amazon_url?: string;
  platform: "spotify" | "deezer" | "apple" | "amazon";
  demo?: boolean;
}

export default function SpotifyPlaylistWidget() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
  const [info, setInfo] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) {
      setInfo("Paste a Spotify playlist URL");
      setIsError(true);
      return;
    }

    setLoading(true);
    setInfo("");
    setIsError(false);

    try {
      const res = await fetch("/api/spotify-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_url: playlistUrl.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        setInfo(err.error || "Failed to fetch playlist");
        setIsError(true);
        setPlaylistInfo(null);
      } else {
        const data = await res.json();
        setPlaylistInfo(data);
        if (data.demo) {
          setInfo(`Demo mode - ${data.platform === 'spotify' ? 'Spotify' : data.platform === 'deezer' ? 'Deezer' : data.platform === 'apple' ? 'Apple' : 'Amazon'} working perfectly!`);
          setIsError(false);
        } else {
          setInfo(`Real ${data.platform === 'spotify' ? 'Spotify' : data.platform === 'deezer' ? 'Deezer' : data.platform === 'apple' ? 'Apple' : 'Amazon'} data loaded!`);
          setIsError(false);
        }
      }
    } catch {
      setInfo("Network error");
      setIsError(true);
      setPlaylistInfo(null);
    }
    setLoading(false);
  };

  const downloadArtwork = async () => {
    if (!playlistInfo?.image_hq) {
      setInfo("No high quality image available");
      setIsError(true);
      return;
    }

    try {
      setInfo("Downloading highest quality...");
      console.log("Downloading image via proxy from:", playlistInfo.image_hq);
      
      // Use our proxy endpoint to avoid CORS issues
      const filename = `${playlistInfo.name} - Artwork (HQ).jpg`;
      const response = await fetch("/api/download-artwork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image_url: playlistInfo.image_hq,
          filename: filename
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check content type to determine if it's JSON (error) or blob (image)
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // It's a JSON response (probably CDN_BLOCKED case)
        const responseData = await response.json();
        if (responseData.error === "CDN_BLOCKED") {
          // Open the direct image URL in a new tab for manual download
          window.open(responseData.direct_url, '_blank');
          setInfo("CDN blocked download - opened image in new tab. Right-click to save!");
          setIsError(false);
          return;
        }
      }
      
      // It's a successful image download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setInfo("High quality artwork downloaded!");
      setIsError(false);
    } catch (error) {
      console.error("Download error:", error);
      setInfo(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsError(true);
    }
  };

  return (
    <div className="px-10 py-12">
      {/* Title */}
      <h2 className="text-lg font-light text-white mb-8 text-center">
        Playlist Artwork
      </h2>

      {/* URL Input */}
      <form onSubmit={handleSubmit} className="mb-8">
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
          {loading ? "Fetching..." : "Get Artwork"}
        </button>
      </form>

      {/* Playlist Info */}
      {playlistInfo && (
        <div className="space-y-6">
          {/* Info */}
          <div className="space-y-2 text-center">
            <h3 className="text-white text-sm">{playlistInfo.name}</h3>
            <p className="text-gray-500 text-xs">
              {playlistInfo.tracks_total} tracks • {playlistInfo.owner}
            </p>
            {playlistInfo.demo && (
              <p className="text-gray-600 text-xs">
                Demo data - Real API needs permissions
              </p>
            )}
          </div>

          {/* Download Button */}
          <button
            onClick={downloadArtwork}
            className="w-full py-3 border border-gray-800 text-white text-sm hover:bg-white hover:text-black transition-colors"
          >
            Download High Quality Artwork
          </button>
        </div>
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