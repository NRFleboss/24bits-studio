import { NextRequest, NextResponse } from "next/server";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export const runtime = "edge"; // WASM compatible

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const fileExt = file.name.split('.').pop() || 'input';
  const inputName = `input.${fileExt}`;
  const outputName = `output.wav`;

  const ffmpeg = createFFmpeg({ log: false });
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  await ffmpeg.FS('writeFile', inputName, new Uint8Array(inputBuffer));
  // Convert to wav 24bits, 44.1kHz
  await ffmpeg.run(
    '-i', inputName,
    '-ar', '44100',
    '-acodec', 'pcm_s24le',
    outputName
  );
  const outBuffer = ffmpeg.FS('readFile', outputName);

  // Clean up (optionnel, car en mémoire)
  ffmpeg.FS('unlink', inputName);
  ffmpeg.FS('unlink', outputName);

  return new NextResponse(Buffer.from(outBuffer), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Disposition": `attachment; filename=converted.wav`,
    },
  });
}
