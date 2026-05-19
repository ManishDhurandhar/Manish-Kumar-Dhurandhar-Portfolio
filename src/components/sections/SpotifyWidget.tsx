import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Music, ExternalLink } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

interface SpotifyData {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumImageUrl: string;
  songUrl: string;
}

export function SpotifyWidget() {
  const [data, setData] = useState<SpotifyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/spotify/now-playing");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Spotify Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 60000); // 1 minute client refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <section className="px-6 py-6 max-w-7xl mx-auto w-full">
      <GlassCard className="max-w-md ml-0 flex items-center gap-6 group">
        <div className="relative w-20 h-20 flex-shrink-0">
          {data?.albumImageUrl ? (
            <img 
              src={data.albumImageUrl} 
              alt={data.album} 
              className="w-full h-full rounded-xl object-cover shadow-lg"
            />
          ) : (
            <div className="w-full h-full rounded-xl bg-foreground/5 flex items-center justify-center">
              <Music className="text-foreground/40" />
            </div>
          )}
          {data?.isPlaying && (
            <div className="absolute -bottom-1 -right-1 bg-[#1DB954] w-4 h-4 rounded-full border-2 border-background flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-widest uppercase text-brand-muted">
              {data?.isPlaying ? "Now Playing" : "Last Played"}
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={data?.isPlaying ? { height: [4, 12, 4] } : { height: 4 }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 bg-[#1DB954] rounded-full"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-bold truncate text-sm">
              {data?.title || "Not Listening"}
            </h4>
            {data?.songUrl && (
              <a 
                href={data.songUrl} 
                target="_blank" 
                rel="noreferrer"
                className="hover:scale-110 transition-transform flex-shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.508 17.304c-.216.336-.66.444-.996.228-2.736-1.668-6.18-2.052-10.236-1.128-.384.084-.768-.156-.852-.528-.084-.384.156-.768.528-.852 4.416-1.02 8.244-.576 11.328 1.308.336.192.444.648.228.972zM18.816 14c-.276.432-.84.564-1.272.3-3.132-1.92-7.896-2.484-11.592-1.356-.48.144-.996-.132-1.14-.612-.144-.48.132-.996.612-1.14 4.224-1.284 9.468-.648 13.092 1.572.432.264.564.828.3 1.236zm.156-3.444c-3.756-2.232-9.948-2.436-13.524-1.356-.576.18-1.188-.144-1.356-.72-.18-.576.144-1.188.72-1.356 4.116-1.248 10.968-1.008 15.3 1.56.516.312.684.984.372 1.5-.312.516-.984.684-1.512.372z"/>
                </svg>
              </a>
            )}
          </div>
          <p className="text-xs text-brand-muted truncate mb-2">
            {data?.artist || "Spotify"}
          </p>
          {data?.songUrl && (
            <a 
              href={data.songUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-brand-muted hover:text-foreground transition-all"
            >
              See on Spotify <ExternalLink size={10} />
            </a>
          )}
        </div>
      </GlassCard>
    </section>
  );
}
