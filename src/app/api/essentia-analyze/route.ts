import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // Force l'exécution côté serveur

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Lire le buffer du fichier
    const arrayBuffer = await file.arrayBuffer();
    // Import dynamique d'Essentia côté serveur
    const Essentia = (await import("essentia.js/dist/essentia-wasm.module.js")).EssentiaWASM;
    const EssentiaModule = (await import("essentia.js")).default;
    const essentia = new Essentia(EssentiaModule);

    // Décodage audio (PCM mono 16kHz) avec un package Node.js compatible si besoin
    // (Ici, il faudrait utiliser un décodeur Node.js, car AudioContext n'existe pas côté serveur)
    // Placeholder: on suppose que le buffer est déjà en Float32Array mono 16kHz
    // TODO: Utiliser un décodeur comme 'wav-decoder' ou 'audiobuffer-to-wav' si besoin
    // const pcm = ...

    // Pour l'instant, retourne une erreur explicite
    return NextResponse.json({ error: "Décodage audio non implémenté côté serveur. Utilisez un décodeur PCM Node.js." }, { status: 500 });

    // Exemple d'appel Essentia (à activer quand le PCM est prêt)
    // const result = essentia.musicStructureSegmentation(pcm, 16000);
    // return NextResponse.json({ segments: result.sections });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || JSON.stringify(err) }, { status: 500 });
  }
}
