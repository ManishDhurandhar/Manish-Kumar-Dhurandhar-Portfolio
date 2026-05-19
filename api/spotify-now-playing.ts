let cachedNowPlaying: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 3 * 60 * 1000;

async function getAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const token = await getAccessToken();
  if (!token) return res.status(200).json({ isPlaying: false });

  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204) {
      const recentResponse = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const recentData = await recentResponse.json();
      const track = recentData.items?.[0]?.track;
      return res.status(200).json({
        isPlaying: false,
        title: track?.name || "Not Listening",
        artist: track?.artists?.map((a: any) => a.name).join(", ") || "",
        albumImageUrl: track?.album?.images?.[0]?.url || "",
        songUrl: track?.external_urls?.spotify || "",
      });
    }

    const data = await response.json();
    res.status(200).json({
      isPlaying: data.is_playing,
      title: data.item?.name || "Unknown",
      artist: data.item?.artists?.map((a: any) => a.name).join(", ") || "",
      albumImageUrl: data.item?.album?.images?.[0]?.url || "",
      songUrl: data.item?.external_urls?.spotify || "",
    });
  } catch {
    res.status(500).json({ error: "Spotify error" });
  }
}
