import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image_url, filename } = await req.json();
    
    if (!image_url) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    console.log("Downloading image from:", image_url);

    // Sanitize filename to remove Unicode characters
    const sanitizedFilename = filename 
      ? filename.replace(/[^\x20-\x7E]/g, '').replace(/[^a-zA-Z0-9\s\-_().]/g, '').trim() || 'artwork'
      : 'artwork';

    // Only support Spotify and Deezer downloads
    if (image_url.includes('mzstatic.com') || image_url.includes('media-amazon.com')) {
      return NextResponse.json({ 
        error: "PLATFORM_NOT_SUPPORTED",
        message: "Downloads only supported for Spotify and Deezer",
        suggestion: "Right-click on the image and save manually"
      }, { status: 200 });
    }

    // Determine the origin based on the image URL
    let referer = '';
    let origin = '';
    if (image_url.includes('dzcdn.net')) {
      referer = 'https://www.deezer.com/';
      origin = 'https://www.deezer.com';
    } else if (image_url.includes('scdn.co')) {
      referer = 'https://open.spotify.com/';
      origin = 'https://open.spotify.com';
    }

    // Fetch the image with comprehensive browser simulation
    const response = await fetch(image_url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': referer,
        'Origin': origin,
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'image',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'DNT': '1',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      console.error("Failed to fetch image:", response.status, response.statusText);
      
      // If it's a 403/400 (blocked), return the direct URL for manual download
      if (response.status === 403 || response.status === 400) {
        return NextResponse.json({ 
          error: "CDN_BLOCKED",
          message: "Image download blocked by CDN",
          direct_url: image_url,
          suggestion: "Right-click and save the image manually"
        }, { status: 200 }); // Return 200 so the frontend can handle the fallback
      }
      
      return NextResponse.json({ 
        error: `Failed to fetch image: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    // Get the image data
    const arrayBuffer = await response.arrayBuffer();

    // Determine content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    console.log("Image downloaded successfully, size:", arrayBuffer.byteLength, "bytes");

    // Return the image with appropriate headers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': arrayBuffer.byteLength.toString(),
        'Content-Disposition': `attachment; filename="${sanitizedFilename}.jpg"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 