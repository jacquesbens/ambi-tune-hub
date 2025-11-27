import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FetchCoverRequest {
  artist: string;
  album: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artist, album }: FetchCoverRequest = await req.json();
    console.log(`🎵 Recherche pochette pour: ${artist} - ${album}`);

    // 1. Search for the release in MusicBrainz
    const searchQuery = `artist:"${artist}" AND release:"${album}"`;
    const searchUrl = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(searchQuery)}&fmt=json&limit=1`;
    
    console.log(`🔍 MusicBrainz search URL: ${searchUrl}`);
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'LovableMusicPlayer/1.0.0 (https://lovable.dev)',
        'Accept': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      console.error(`❌ MusicBrainz search failed: ${searchResponse.status}`);
      return new Response(
        JSON.stringify({ error: 'MusicBrainz search failed', coverUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    console.log(`📦 MusicBrainz response:`, searchData);

    if (!searchData.releases || searchData.releases.length === 0) {
      console.log('⚠️ No releases found in MusicBrainz');
      return new Response(
        JSON.stringify({ error: 'No release found', coverUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mbid = searchData.releases[0].id;
    console.log(`✅ Found MBID: ${mbid}`);

    // 2. Fetch cover art from Cover Art Archive
    const coverUrl = `https://coverartarchive.org/release/${mbid}/front`;
    console.log(`🎨 Fetching cover from: ${coverUrl}`);

    const coverResponse = await fetch(coverUrl, {
      headers: {
        'User-Agent': 'LovableMusicPlayer/1.0.0 (https://lovable.dev)',
      },
    });

    if (!coverResponse.ok) {
      console.log(`⚠️ No cover art found for MBID: ${mbid}`);
      return new Response(
        JSON.stringify({ error: 'No cover art available', coverUrl: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Convert image to base64
    const imageBuffer = await coverResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const contentType = coverResponse.headers.get('content-type') || 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64Image}`;

    console.log(`✅ Cover art retrieved successfully (${imageBuffer.byteLength} bytes)`);

    return new Response(
      JSON.stringify({ 
        coverUrl: dataUrl,
        mbid,
        artist: searchData.releases[0]['artist-credit']?.[0]?.name || artist,
        album: searchData.releases[0].title || album
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Error in fetch-album-cover:', error);
    return new Response(
      JSON.stringify({ error: error.message, coverUrl: null }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
