import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  // Save temp input
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const tempDir = "/tmp";
  const inputPath = path.join(tempDir, `input-${Date.now()}`);
  const outputPath = path.join(tempDir, `output-${Date.now()}.wav`);
  await fs.writeFile(inputPath, inputBuffer);

  // ffmpeg args: convert to wav, 24bits, 44.1kHz
  const ffmpegArgs = [
    "-y",
    "-i", inputPath,
    "-ar", "44100",
    "-acodec", "pcm_s24le",
    outputPath
  ];

  try {
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", ffmpegArgs);
      ffmpeg.on("error", reject);
      ffmpeg.on("close", (code) => {
        code === 0 ? resolve(null) : reject(new Error("ffmpeg failed"));
      });
    });
    const outBuffer = await fs.readFile(outputPath);
    // Clean up
    await fs.unlink(inputPath);
    await fs.unlink(outputPath);
    return new NextResponse(outBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename=converted.wav`,
      },
    });
  } catch (e) {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
    return NextResponse.json({ error: "Erreur lors de la conversion." }, { status: 500 });
  }
}
