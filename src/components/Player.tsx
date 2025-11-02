import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PlayerProps {
  currentTrack?: {
    title: string;
    artist: string;
    album: string;
    cover: string;
    duration: number;
  };
  isPlaying: boolean;
  onPlayPause: () => void;
  focusedControl: number;
}

export const Player = ({ currentTrack, isPlaying, onPlayPause, focusedControl }: PlayerProps) => {
  const [progress, setProgress] = useState(45);

  if (!currentTrack) {
    return null;
  }

  const controls = [
    { icon: SkipBack, label: "Précédent" },
    { icon: isPlaying ? Pause : Play, label: isPlaying ? "Pause" : "Lecture" },
    { icon: SkipForward, label: "Suivant" },
  ];

  return (
    <div className="h-32 bg-card border-t border-border px-8 flex items-center gap-8">
      {/* Album Cover */}
      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
        <img
          src={currentTrack.cover}
          alt={currentTrack.album}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-semibold truncate text-foreground">
          {currentTrack.title}
        </h3>
        <p className="text-lg text-muted-foreground truncate">
          {currentTrack.artist} • {currentTrack.album}
        </p>
        
        {/* Progress Bar */}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">2:45</span>
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.floor(currentTrack.duration / 60)}:{String(currentTrack.duration % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {controls.map((Control, index) => {
          const Icon = Control.icon;
          const isFocused = focusedControl === index;
          
          return (
            <button
              key={index}
              onClick={index === 1 ? onPlayPause : undefined}
              className={cn(
                "w-14 h-14 rounded-full bg-secondary flex items-center justify-center",
                "tv-focusable transition-all",
                isFocused && "ring-4 ring-primary bg-primary text-primary-foreground"
              )}
            >
              <Icon className="w-7 h-7" />
            </button>
          );
        })}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <Volume2 className="w-6 h-6 text-muted-foreground" />
        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="w-3/4 h-full bg-primary" />
        </div>
      </div>
    </div>
  );
};
