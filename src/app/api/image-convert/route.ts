import { NextRequest, NextResponse } from "next/server";
import Jimp from "jimp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const image = await Jimp.read(buffer);
    // Redimensionner à 3000x3000 en conservant le cover
    image.cover(3000, 3000);
    const outBuffer = await image.quality(90).getBufferAsync(Jimp.MIME_JPEG);
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const fileName = `${baseName}-3000x3000.jpeg`;
    return new NextResponse(outBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur lors de la conversion." }, { status: 500 });
  }
}
