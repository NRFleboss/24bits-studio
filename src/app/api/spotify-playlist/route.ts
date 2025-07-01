import { NextRequest, NextResponse } from "next/server";
import * as cheerio from 'cheerio';

// Spotify API credentials (réutilise ceux existants)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Demo data for testing
const DEMO_PLAYLIST = {
  name: "Today's Top Hits",
  description: "The most played songs right now.",
  image: "https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6",
  image_hq: "https://i.scdn.co/image/ab67706f00000002ca5a7517156021292e5663a6", 
  tracks_total: 50,
  owner: "Spotify",
  spotify_url: "https://open.spotify.com/playlist/37i9dQZF1DX0XUsuxWHRQd",
  platform: "spotify"
};

const DEMO_DEEZER_PLAYLIST = {
  name: "Top France",
  description: "Les titres les plus écoutés en France",
  image: "https://e-cdns-images.dzcdn.net/images/playlist/500x500/000/000/000/000000001.jpg",
  image_hq: "https://e-cdns-images.dzcdn.net/images/playlist/500x500/000/000/000/000000001.jpg",
  tracks_total: 100,
  owner: "Deezer",
  deezer_url: "https://www.deezer.com/playlist/1",
  platform: "deezer"
};

const DEMO_APPLE_PLAYLIST = {
  name: "Today's Chill",
  description: "Some of electronic music's most exciting developments",
  image: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/12/8c/f5128c0a-8b12-3c85-c6a9-123456789/artwork.jpg/632x632bb.webp",
  image_hq: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/12/8c/f5128c0a-8b12-3c85-c6a9-123456789/artwork.jpg/1000x1000bb.webp",
  tracks_total: 228,
  owner: "Apple Music",
  apple_url: "https://music.apple.com/us/playlist/todays-chill/pl.2bb29727dbc34a63936787297305c37c",
  platform: "apple"
};

const DEMO_AMAZON_PLAYLIST = {
  name: "Chill Vibes",
  description: "Relaxing music for any time",
  image: "https://m.media-amazon.com/images/S/dmm-catalog-images/playlist/B08FXWQL68/B08FXWQL68._CR0,0,512,512_UX256_UY256_.jpg",
  image_hq: "https://m.media-amazon.com/images/S/dmm-catalog-images/playlist/B08FXWQL68/B08FXWQL68._CR0,0,1024,1024_.jpg",
  tracks_total: 50,
  owner: "Amazon Music",
  amazon_url: "https://music.amazon.fr/playlists/B08FXWQL68",
  platform: "amazon"
};

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
  if (!data.access_token) {
    console.error("No access token in response:", data);
    throw new Error("No access token received");
  }

  return data.access_token;
}

function getBestQualityImage(images: any[]) {
  if (!images || images.length === 0) return null;
  
  console.log("Raw images data:", images.map(img => ({
    url: img.url,
    width: img.width,
    height: img.height
  })));
  
  // Spotify images are usually ordered by size (largest first)
  // If dimensions are available, sort by them, otherwise use the first one
  const sortedImages = images.sort((a, b) => {
    const aWidth = a.width || 0;
    const aHeight = a.height || 0;
    const bWidth = b.width || 0;
    const bHeight = b.height || 0;
    
    const aSize = aWidth * aHeight;
    const bSize = bWidth * bHeight;
    
    // If both have no dimensions, maintain original order
    if (aSize === 0 && bSize === 0) return 0;
    
    return bSize - aSize; // Descending order (largest first)
  });
  
  const bestImage = sortedImages[0];
  console.log("Selected best image:", {
    url: bestImage?.url,
    width: bestImage?.width,
    height: bestImage?.height
  });
  
  return bestImage?.url || null;
}

async function getPlaylistInfo(playlistUrl: string) {
  // Extract playlist ID from URL
  const match = playlistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error("Invalid Spotify playlist URL");
  
  const playlistId = match[1];
  console.log("Getting playlist info for ID:", playlistId);
  
  try {
    const token = await getSpotifyToken();
    
    const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!res.ok) {
      console.log("Spotify API returned error, using demo data");
      // Return demo data when API fails
      return DEMO_PLAYLIST;
    }
    
    const data = await res.json();
    console.log("Playlist data received:", {
      name: data.name,
      images: data.images?.length || 0,
      tracks: data.tracks?.total || 0,
      imagesSizes: data.images?.map((img: any) => `${img.width}x${img.height}`) || []
    });
    
    const bestImage = getBestQualityImage(data.images);
    
    return {
      name: data.name,
      description: data.description,
      image: bestImage, // Highest quality for preview
      image_hq: bestImage, // Same for download (highest available)
      tracks_total: data.tracks.total,
      owner: data.owner.display_name,
      spotify_url: data.external_urls.spotify,
      platform: "spotify"
    };
  } catch (error) {
    console.log("Using demo data due to error:", error);
    // Return demo data when there's any error
    return DEMO_PLAYLIST;
  }
}

function detectPlatform(url: string): 'spotify' | 'deezer' | 'apple' | 'amazon' | 'unknown' {
  if (url.includes('spotify.com/playlist/')) return 'spotify';
  if (url.includes('deezer.com/playlist/') || url.includes('deezer.com/en/playlist/') || url.includes('deezer.com/fr/playlist/')) return 'deezer';
  if (url.includes('music.apple.com/') && url.includes('/playlist/')) return 'apple';
  if (url.includes('music.amazon.') && url.includes('/playlists/')) return 'amazon';
  return 'unknown';
}

async function getDeezerPlaylistInfo(playlistUrl: string) {
  try {
    console.log("Scraping Deezer playlist:", playlistUrl);
    
    // Fetch the HTML page
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log("Failed to fetch Deezer page, using demo data");
      return DEMO_DEEZER_PLAYLIST;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract data from meta tags and JSON-LD
    let playlistData: any = {};
    
    // Try to get data from JSON-LD first
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || '');
        if (jsonData['@type'] === 'MusicPlaylist') {
          playlistData = jsonData;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    // Fallback to meta tags and page elements
    const name = playlistData.name || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('h1').first().text().trim() ||
                 'Unknown Playlist';
                 
    const description = playlistData.description || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';
                       
    const image = playlistData.image || 
                 $('meta[property="og:image"]').attr('content') || 
                 $('.playlist-cover img').attr('src') ||
                 '';
                 
    // Try to extract track count
    const trackCountText = $('.playlist-tracks-count').text() || 
                          $('.tracks-count').text() || 
                          $('[data-testid="track-count"]').text() ||
                          '';
    const trackMatch = trackCountText.match(/(\d+)/);
    const tracks_total = trackMatch ? parseInt(trackMatch[1]) : 0;
    
    // Extract owner
    const owner = $('meta[name="author"]').attr('content') || 
                 $('.playlist-owner').text().trim() ||
                 'Unknown';
    
    console.log("Extracted Deezer data:", {
      name: name.substring(0, 50),
      hasImage: !!image,
      tracks_total,
      owner
    });
    
    // Clean up image URL to get highest quality
    let image_hq = image;
    if (image && image.includes('dzcdn.net')) {
      // Deezer images: replace size parameters to get highest quality
      image_hq = image.replace(/\/\d+x\d+\//, '/500x500/');
    }
    
    return {
      name,
      description,
      image,
      image_hq,
      tracks_total,
      owner,
      deezer_url: playlistUrl,
      platform: "deezer"
    };
    
  } catch (error) {
    console.log("Deezer scraping error, using demo data:", error);
    return DEMO_DEEZER_PLAYLIST;
  }
}

async function getApplePlaylistInfo(playlistUrl: string) {
  try {
    console.log("Scraping Apple Music playlist:", playlistUrl);
    
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.log("Failed to fetch Apple Music page, using demo data");
      return DEMO_APPLE_PLAYLIST;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract data from meta tags and page elements
    let name = $('meta[property="og:title"]').attr('content') || 
               $('meta[name="twitter:title"]').attr('content') ||
               $('h1').first().text().trim() ||
               'Unknown Playlist';
               
    // Clean up the name - remove " on Apple Music" suffix
    name = name.replace(/ on Apple Music$/i, '').trim();
                 
    const description = $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="description"]').attr('content') || 
                       '';
                       
    let image = $('meta[property="og:image"]').attr('content') || 
                $('meta[name="twitter:image"]').attr('content') ||
                '';
    
    // Extract track count from various possible locations
    const trackInfo = $('.songs-list-header').text() || 
                     $('.song-count').text() ||
                     $('.track-count').text() ||
                     $('[data-testid="track-count"]').text() ||
                     '';
    const trackMatch = trackInfo.match(/(\d+)/);
    const tracks_total = trackMatch ? parseInt(trackMatch[1]) : 0;
    
    const owner = "Apple Music";
    
    console.log("Extracted Apple Music data:", {
      name: name.substring(0, 50),
      hasImage: !!image,
      originalImageUrl: image,
      tracks_total,
      owner
    });
    
    // Get highest quality image for Apple Music
    let image_hq = image;
    if (image && image.includes('mzstatic.com')) {
      // Apple Music URL patterns:
      // Original: https://is1-ssl.mzstatic.com/image/thumb/Features125/v4/.../file.png/1200x630SC.DN01-60.jpg?l=en-US
      // Target: https://is1-ssl.mzstatic.com/image/Features125/v4/.../file.png
      
      image_hq = image
        .replace('/thumb/', '/') // Remove thumb directory
        .replace(/\/\d+x\d+[^\/]*\.(jpg|jpeg|png)(\?.*)?$/, '') // Remove resolution suffix and query params
        .replace(/\.webp$/, '.png') // Prefer PNG for quality
        .replace(/preview/, ''); // Remove any preview indicators
      
      console.log("Enhanced Apple image URL:", image_hq);
    }
    
    return {
      name,
      description,
      image: image_hq, // Use high quality for preview too
      image_hq,
      tracks_total,
      owner,
      apple_url: playlistUrl,
      platform: "apple"
    };
    
  } catch (error) {
    console.log("Apple Music scraping error, using demo data:", error);
    return DEMO_APPLE_PLAYLIST;
  }
}

async function getAmazonPlaylistInfo(playlistUrl: string) {
  try {
    console.log("Scraping Amazon Music playlist:", playlistUrl);
    
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      console.log("Failed to fetch Amazon Music page, using demo data");
      return DEMO_AMAZON_PLAYLIST;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("Amazon page title:", $('title').text());
    
    // Extract data from meta tags and JSON-LD
    let playlistData: any = {};
    
    // Try JSON-LD first
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const jsonData = JSON.parse($(el).html() || '');
        console.log("Found JSON-LD data:", jsonData);
        if (jsonData['@type'] === 'MusicPlaylist' || jsonData.name) {
          playlistData = jsonData;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
    
    let name = playlistData.name || 
               $('meta[property="og:title"]').attr('content') || 
               $('meta[property="twitter:title"]').attr('content') ||
               $('h1').first().text().trim() ||
               $('.playlist-title').text().trim() ||
               $('[data-automation-id="playlist-title"]').text().trim() ||
               'Unknown Playlist';
               
    const description = playlistData.description || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[property="twitter:description"]').attr('content') ||
                       '';
                       
    let image = playlistData.image || 
                $('meta[property="og:image"]').attr('content') || 
                $('meta[property="twitter:image"]').attr('content') ||
                $('.playlist-image img').attr('src') ||
                $('img[alt*="playlist"], img[alt*="Playlist"]').attr('src') ||
                '';
    
    // Extract track count
    const trackInfo = $('.track-count').text() || 
                     $('.song-count').text() ||
                     $('.songs-count').text() ||
                     $('[data-automation-id="track-count"]').text() ||
                     $('[data-automation-id="song-count"]').text() ||
                     '';
    const trackMatch = trackInfo.match(/(\d+)/);
    const tracks_total = trackMatch ? parseInt(trackMatch[1]) : 0;
    
    const owner = "Amazon Music";
    
    console.log("Extracted Amazon Music data:", {
      name: name.substring(0, 50),
      hasImage: !!image,
      originalImageUrl: image,
      tracks_total,
      owner
    });
    
    // Enhance image quality for Amazon Music
    let image_hq = image;
    if (image && image.includes('media-amazon.com')) {
      // Amazon images: try to get larger version
      image_hq = image
        .replace(/UX\d+_UY\d+/, 'UX2048_UY2048')
        .replace(/_CR\d+,\d+,\d+,\d+_/, '_CR0,0,2048,2048_')
        .replace(/\._.*?\./g, '.')
        .replace(/\.jpg.*$/, '.jpg');
      
      console.log("Enhanced Amazon image URL:", image_hq);
    }
    
    // If no image found, return demo data
    if (!image) {
      console.log("No image found for Amazon playlist, using demo data");
      return DEMO_AMAZON_PLAYLIST;
    }
    
    return {
      name,
      description,
      image: image_hq, // Use high quality for preview too
      image_hq,
      tracks_total,
      owner,
      amazon_url: playlistUrl,
      platform: "amazon"
    };
    
  } catch (error) {
    console.log("Amazon Music scraping error, using demo data:", error);
    return DEMO_AMAZON_PLAYLIST;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { playlist_url } = await req.json();
    
    if (!playlist_url) {
      return NextResponse.json({ error: "No playlist URL provided" }, { status: 400 });
    }

    console.log("Processing playlist URL:", playlist_url);

    const platform = detectPlatform(playlist_url);
    
    let playlistInfo;
    if (platform === 'spotify') {
      playlistInfo = await getPlaylistInfo(playlist_url);
    } else if (platform === 'deezer') {
      playlistInfo = await getDeezerPlaylistInfo(playlist_url);
    } else if (platform === 'apple') {
      playlistInfo = await getApplePlaylistInfo(playlist_url);
    } else if (platform === 'amazon') {
      playlistInfo = await getAmazonPlaylistInfo(playlist_url);
    } else {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
    }
    
    if (!playlistInfo.image) {
      return NextResponse.json({ error: "No artwork found for this playlist" }, { status: 404 });
    }

    return NextResponse.json({
      ...playlistInfo,
      demo: playlistInfo === DEMO_PLAYLIST || playlistInfo === DEMO_DEEZER_PLAYLIST || playlistInfo === DEMO_APPLE_PLAYLIST || playlistInfo === DEMO_AMAZON_PLAYLIST, // Only true if we used demo data
    });
  } catch (err: unknown) {
    console.error("API error:", err);
    let errorMsg = "Unknown error";
    if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
      errorMsg = (err as { message: string }).message;
    } else if (typeof err === "string") {
      errorMsg = err;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
} 