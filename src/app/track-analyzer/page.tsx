import React from "react";

export default function TrackAnalyzerPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-900 to-emerald-700 text-white">
      <h1 className="text-4xl font-bold mb-6">Track Analyzer</h1>
      <p className="mb-8 text-lg max-w-xl text-center">
        Analyse le tempo et d'autres caractéristiques d'un morceau, simplement en collant un lien Spotify !
      </p>
      {/* UI pour coller un lien et afficher l'analyse à venir */}
      <div className="rounded-lg border border-emerald-600 bg-emerald-800 p-8 shadow-lg">
        <span className="text-emerald-200">Fonctionnalité à venir</span>
      </div>
    </main>
  );
}
