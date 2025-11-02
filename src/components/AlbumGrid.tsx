import { cn } from "@/lib/utils";

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
}

export const AlbumGrid = ({ albums, focusedIndex, onSelect }: AlbumGridProps) => {
  return (
    <div className="grid grid-cols-5 gap-8 p-8">
      {albums.map((album, index) => {
        const isFocused = focusedIndex === index;
        
        return (
          <button
            key={album.id}
            onClick={() => onSelect(album)}
            className={cn(
              "group tv-focusable rounded-lg overflow-hidden bg-card transition-all",
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
        );
      })}
    </div>
  );
};
