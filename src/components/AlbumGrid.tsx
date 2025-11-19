import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useState } from "react";

interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  year: number;
}

interface AlbumGridProps {
  albums: Album[];
  focusedIndex: number;
  onSelect: (album: Album) => void;
  onDelete?: (albumId: string) => void;
}

export const AlbumGrid = ({ albums, focusedIndex, onSelect, onDelete }: AlbumGridProps) => {
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-5 gap-8 p-8">
        {albums.map((album, index) => {
          const isFocused = focusedIndex === index;
          
          return (
            <div key={album.id} className="relative group">
              <button
                onClick={() => onSelect(album)}
                className={cn(
                  "w-full tv-focusable rounded-lg overflow-hidden bg-card transition-all",
                  isFocused && "ring-4 ring-primary scale-105 z-10"
                )}
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={album.cover}
                    alt={album.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate text-foreground">
                    {album.title}
                  </h3>
                  <p className="text-muted-foreground truncate">{album.artist}</p>
                  <p className="text-sm text-muted-foreground">{album.year}</p>
                </div>
              </button>
              
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteAlbumId(album.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-destructive/80 hover:bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  aria-label="Supprimer l'album"
                >
                  <Trash2 className="w-4 h-4 text-destructive-foreground" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteAlbumId} onOpenChange={() => setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'album ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'album et toutes ses pistes seront supprimés de votre bibliothèque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteAlbumId && onDelete) {
                  onDelete(deleteAlbumId);
                }
                setDeleteAlbumId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
