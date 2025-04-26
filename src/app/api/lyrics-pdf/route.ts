import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { artist, title, lyricsBy, lyrics } = data;
  if (!artist || !title || !lyricsBy || !lyrics) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  // Création du PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 portrait
  const { width, height } = page.getSize();

  // Fonts

  const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Styles
  const margin = 48;
  let y = height - margin;

  // En-tête institutionnel
  // Titre de section
  const fontSize = 12;
  page.drawText(`Work title: ${title}`, {
    x: margin,
    y: y,
    size: fontSize,
    font: fontText,
    color: rgb(0, 0, 0),
  });
  y -= fontSize + 8;

  page.drawText(`Artist: ${artist}`, {
    x: margin,
    y: y,
    size: fontSize,
    font: fontText,
    color: rgb(0, 0, 0),
  });
  y -= fontSize + 8;

  page.drawText(`Lyrics by: ${lyricsBy}`, {
    x: margin,
    y: y,
    size: fontSize,
    font: fontText,
    color: rgb(0, 0, 0),
  });
  y -= fontSize + 8;

  // Ligne horizontale de séparation (gris clair, transparent)
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: width - margin, y: y },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
    opacity: 0.3,
  });
  y -= fontSize + 12;

  y -= (fontSize + 8); // Ajoute une ligne vide entre la barre et les paroles

  // Paroles (respect des lignes vides et balises couplet/refrain)
  const rawLines = lyrics.split(/\r?\n/);
  const maxChars = 70;
  let prevWasSection = false;
  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    const isSection = /\[(refrain|chorus|verse|pont|bridge)\]/i.test(line.trim());
    if (line.trim() === "") {
      y -= fontSize + 5; // saut de ligne pour ligne vide
      prevWasSection = false;
      continue;
    }
    if (isSection) {
      if (!prevWasSection) y -= fontSize + 5; // saut avant section
      page.drawText(line, {
        x: margin,
        y: y,
        size: fontSize,
        font: fontText,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 10; // saut après section
      prevWasSection = true;
      continue;
    }
    // Wrap les lignes trop longues
    while (line.length > maxChars) {
      page.drawText(line.slice(0, maxChars), {
        x: margin,
        y: y,
        size: fontSize,
        font: fontText,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 5;
      line = line.slice(maxChars);
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y: y,
        size: fontSize,
        font: fontText,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 5;
    }
    prevWasSection = false;
  }

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=lyrics.pdf`,
    },
  });
}
