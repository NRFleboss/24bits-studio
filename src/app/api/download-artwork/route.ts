import { NextRequest, NextResponse } from "next/server";

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyToken() {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify credentials not configured");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Spotify token error:", res.status, errorText);
    throw new Error(`Failed to get Spotify token: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function getSpotifyArtwork(trackUrl: string) {
  // Extract track, album, or playlist ID from Spotify URL
  const trackMatch = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
  const albumMatch = trackUrl.match(/album\/([a-zA-Z0-9]+)/);
  const playlistMatch = trackUrl.match(/playlist\/([a-zA-Z0-9]+)/);
  
  if (!trackMatch && !albumMatch && !playlistMatch) {
    throw new Error("Invalid Spotify URL - must be a track, album, or playlist");
  }

  const token = await getSpotifyToken();
  let apiUrl: string;
  let artworkData: any;

  if (trackMatch) {
    // Get track info to get album artwork
    const trackId = trackMatch[1];
    apiUrl = `https://api.spotify.com/v1/tracks/${trackId}`;
    
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch track info: ${res.status}`);
    }
    
    const trackData = await res.json();
    artworkData = trackData.album;
  } else if (albumMatch) {
    // Get album info directly
    const albumId = albumMatch[1];
    apiUrl = `https://api.spotify.com/v1/albums/${albumId}`;
    
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch album info: ${res.status}`);
    }
    
    artworkData = await res.json();
  } else {
    // Get playlist info directly
    const playlistId = playlistMatch![1];
    apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}`;
    
    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch playlist info: ${res.status}`);
    }
    
    artworkData = await res.json();
  }

  // Get the highest quality image
  const images = artworkData.images || [];
  if (images.length === 0) {
    throw new Error("No artwork available for this track/album");
  }

  // Sort by size to get the highest quality
  const highestQualityImage = images.sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0];
  
  return {
    url: highestQualityImage.url,
    name: artworkData.name,
    artist: artworkData.artists?.[0]?.name || 'Unknown Artist'
  };
}

export async function POST(req: NextRequest) {
  try {
    const { image_url, filename, spotify_url } = await req.json();
    
    let finalImageUrl = image_url;
    let finalFilename = filename;

    // If it's a Spotify URL, use the API to get the correct artwork
    if (spotify_url && (spotify_url.includes('open.spotify.com') || spotify_url.includes('spotify:'))) {
      try {
        console.log("Getting Spotify artwork from API for:", spotify_url);
        const spotifyArtwork = await getSpotifyArtwork(spotify_url);
        finalImageUrl = spotifyArtwork.url;
        
        // Generate a better filename if not provided
        if (!filename) {
          finalFilename = `${spotifyArtwork.artist} - ${spotifyArtwork.name}`.replace(/[^\x20-\x7E]/g, '').replace(/[^a-zA-Z0-9\s\-_().]/g, '').trim() || 'spotify_artwork';
        }
        
        console.log("Using Spotify API artwork:", finalImageUrl);
      } catch (spotifyError) {
        console.error("Failed to get Spotify artwork:", spotifyError);
        // Fallback to the provided image_url if Spotify API fails
        if (!image_url) {
          return NextResponse.json({ 
            error: "SPOTIFY_API_FAILED",
            message: spotifyError instanceof Error ? spotifyError.message : "Failed to get Spotify artwork"
          }, { status: 400 });
        }
      }
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    console.log("Downloading image from:", finalImageUrl);

    // Sanitize filename to remove Unicode characters
    const sanitizedFilename = finalFilename 
      ? finalFilename.replace(/[^\x20-\x7E]/g, '').replace(/[^a-zA-Z0-9\s\-_().]/g, '').trim() || 'artwork'
      : 'artwork';

    // Only support Spotify and Deezer downloads for direct URLs
    if (!spotify_url && (finalImageUrl.includes('mzstatic.com') || finalImageUrl.includes('media-amazon.com'))) {
      return NextResponse.json({ 
        error: "PLATFORM_NOT_SUPPORTED",
        message: "Downloads only supported for Spotify and Deezer",
        suggestion: "Right-click on the image and save manually"
      }, { status: 200 });
    }

    // Determine the origin based on the image URL
    let referer = '';
    let origin = '';
    if (finalImageUrl.includes('dzcdn.net')) {
      referer = 'https://www.deezer.com/';
      origin = 'https://www.deezer.com';
    } else if (finalImageUrl.includes('scdn.co')) {
      referer = 'https://open.spotify.com/';
      origin = 'https://open.spotify.com';
    }

    // Fetch the image with comprehensive browser simulation
    const response = await fetch(finalImageUrl, {
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
          direct_url: finalImageUrl,
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