import Link from "next/link";
import AudioConverterWidget from "@/components/AudioConverterWidget";
import ImageConverterWidget from "@/components/ImageConverterWidget";
import LyricsFormatterWidget from "@/components/LyricsFormatterWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Header moderne sticky */}
      <header className="sticky top-0 z-20 w-full border-b border-zinc-800/50 px-8 py-4 flex items-center justify-between bg-black/80 backdrop-blur-lg shadow-sm">
        <span className="text-2xl font-bold tracking-tighter text-accent-400 select-none">24bits <span className="text-white">Studio</span></span>
        {/* Outils intégrés inline, navigation remplacée par les widgets */}
      </header>
      {/* Section centrale moderne */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 overflow-hidden">
        {/* Section title removed to free space */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 w-full max-w-6xl">
  <div className="md:col-span-2">
    <AudioConverterWidget />
  </div>
  <div className="md:col-span-3">
    <ImageConverterWidget />
  </div>
  <div className="md:col-span-5">
    <LyricsFormatterWidget />
  </div>
</div>
      </section>
      {/* Footer sobre */}
      <footer className="text-zinc-500 text-xs text-center py-6"> 2025 24bits Studio. Tous droits réservés.</footer>
    </main>
  );
}
