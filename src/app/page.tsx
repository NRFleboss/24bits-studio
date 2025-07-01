import Link from "next/link";
import AudioConverterWidget from "@/components/AudioConverterWidget";
import ImageConverterWidget from "@/components/ImageConverterWidget";
import LyricsFormatterWidget from "@/components/LyricsFormatterWidget";
import SpotifyPlaylistWidget from "@/components/SpotifyPlaylistWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      {/* Ultra-minimal header */}
      <div className="fixed top-0 left-0 right-0 z-50 p-8">
        <div className="flex items-center justify-between">
          <div className="text-white text-lg font-light">
            24bits
          </div>
          <nav className="hidden md:flex items-center space-x-12 text-sm text-gray-500">
            <Link href="/audio-converter" className="hover:text-white transition-colors">
              Convert
            </Link>
            <Link href="/track-analyzer" className="hover:text-white transition-colors">
              Analyze
            </Link>
            <Link href="/lyrics-formatter" className="hover:text-white transition-colors">
              Format
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content with massive spacing */}
      <div className="pt-32 pb-20 px-8">
        {/* Hero - ultra minimal */}
        <div className="text-center max-w-2xl mx-auto mb-32">
          <h1 className="text-5xl md:text-7xl font-extralight text-white mb-8 tracking-wide">
            Audio Tools
          </h1>
          <p className="text-gray-400 text-lg font-light leading-relaxed">
            Convert, resize, format, extract.
          </p>
        </div>

        {/* Tools - 2x2 grid on large screens */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12">
            <AudioConverterWidget />
            <ImageConverterWidget />
            <LyricsFormatterWidget />
            <SpotifyPlaylistWidget />
          </div>
        </div>
      </div>
    </main>
  );
}
