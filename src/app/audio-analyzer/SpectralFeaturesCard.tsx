import React from "react";

interface SpectralFeaturesCardProps {
  mfcc: number[];
  centroid: number;
  flux: number;
  rolloff: number;
}

export default function SpectralFeaturesCard({ mfcc, centroid, flux, rolloff }: SpectralFeaturesCardProps) {
  return (
    <div className="bg-white/90 rounded-2xl shadow-xl p-6 mb-6 animate-fade-in">
      <h3 className="text-xl font-bold text-fuchsia-800 mb-3">Analyse spectrale avancée</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">Spectral Centroid</div>
          <div className="text-lg font-mono text-fuchsia-900">{centroid.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Spectral Flux</div>
          <div className="text-lg font-mono text-fuchsia-900">{flux.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">Spectral Rolloff</div>
          <div className="text-lg font-mono text-fuchsia-900">{rolloff.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500 mb-1">MFCC (moyenne)</div>
          <div className="text-lg font-mono text-fuchsia-900">{mfcc.map(v => v.toFixed(2)).join(", ")}</div>
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-600">
        <b>MFCC</b> : caractérise le timbre.<br/>
        <b>Centroid</b> : brillance du son.<br/>
        <b>Flux</b> : variation spectrale.<br/>
        <b>Rolloff</b> : limite d'énergie spectrale.
      </div>
    </div>
  );
}
