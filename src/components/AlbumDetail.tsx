import { ArrowLeft, Play, Pause, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Album, Track } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditMetadataDialog } from "./EditMetadataDialog";
import { useState } from "react";

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  currentTrack?: Track;
  isPlaying: boolean;
  onDeleteTrack?: (trackId: string) => void;
  onUpdateTrack?: (trackId: string, updates: Partial<Track>) => void;
}

export const AlbumDetail = ({ 
  album, 
  onBack, 
  onPlayTrack,
  currentTrack,
  isPlaying,
  onDeleteTrack,
  onUpdateTrack
}: AlbumDetailProps) => {
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);
  const [editTrack, setEditTrack] = useState<Track | null>(null);
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
              <div
                key={track.id}
                className={cn(
                  "group flex items-center gap-4 hover:bg-accent transition-colors",
                  isCurrentTrack && "bg-accent"
                )}
              >
                <button
                  onClick={() => onPlayTrack(track)}
                  className="flex-1 p-4 flex items-center gap-4 text-left"
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

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onUpdateTrack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTrack(track);
                      }}
                      className="p-4"
                      aria-label="Modifier les métadonnées"
                    >
                      <Edit className="w-4 h-4 text-foreground" />
                    </button>
                  )}
                  
                  {onDeleteTrack && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTrackId(track.id);
                      }}
                      className="p-4"
                      aria-label="Supprimer la piste"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog open={!!deleteTrackId} onOpenChange={() => setDeleteTrackId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette piste ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La piste sera supprimée de l'album.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTrackId && onDeleteTrack) {
                  onDeleteTrack(deleteTrackId);
                }
                setDeleteTrackId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditMetadataDialog
        track={editTrack}
        open={!!editTrack}
        onOpenChange={(open) => !open && setEditTrack(null)}
        onSave={(trackId, updates) => {
          if (onUpdateTrack) {
            onUpdateTrack(trackId, updates);
          }
        }}
      />
    </div>
  );
};
