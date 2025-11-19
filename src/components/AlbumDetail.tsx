import { ArrowLeft, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Album, Track } from "@/data/mockData";
import { Button } from "@/components/ui/button";

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  currentTrack?: Track;
  isPlaying: boolean;
}

export const AlbumDetail = ({ 
  album, 
  onBack, 
  onPlayTrack,
  currentTrack,
  isPlaying 
}: AlbumDetailProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="p-8">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Retour à la bibliothèque
      </Button>

      <div className="flex gap-8 mb-8">
        <div className="w-64 h-64 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={album.cover}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-foreground mb-2">{album.title}</h1>
          <p className="text-2xl text-muted-foreground mb-2">{album.artist}</p>
          <p className="text-lg text-muted-foreground">{album.year} • {album.tracks.length} pistes</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Pistes</h2>
        </div>
        
        <div className="divide-y divide-border">
          {album.tracks.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            const isTrackPlaying = isCurrentTrack && isPlaying;

            return (
              <button
                key={track.id}
                onClick={() => onPlayTrack(track)}
                className={cn(
                  "w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors text-left",
                  isCurrentTrack && "bg-accent"
                )}
              >
                <div className="w-12 text-center">
                  {isTrackPlaying ? (
                    <Pause className="w-5 h-5 inline text-primary" />
                  ) : isCurrentTrack ? (
                    <Play className="w-5 h-5 inline text-primary" />
                  ) : (
                    <span className="text-muted-foreground">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-medium truncate",
                    isCurrentTrack ? "text-primary" : "text-foreground"
                  )}>
                    {track.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatDuration(track.duration)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
