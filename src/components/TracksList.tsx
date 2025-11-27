import { useState } from "react";
import { Track } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface TracksListProps {
  tracks: Track[];
  onTrackPlay: (track: Track) => void;
}

type SortField = "title" | "artist" | "album" | "genre" | "duration";
type SortOrder = "asc" | "desc";

export const TracksList = ({ tracks, onTrackPlay }: TracksListProps) => {
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedTracks = [...tracks].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (sortField) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "artist":
        aValue = a.artist.toLowerCase();
        bValue = b.artist.toLowerCase();
        break;
      case "album":
        aValue = a.album.toLowerCase();
        bValue = b.album.toLowerCase();
        break;
      case "genre":
        aValue = (a.genre || "").toLowerCase();
        bValue = (b.genre || "").toLowerCase();
        break;
      case "duration":
        aValue = a.duration;
        bValue = b.duration;
        break;
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className={`gap-2 ${sortField === field ? "text-primary" : "text-muted-foreground"}`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
        <span className="text-sm text-muted-foreground mr-2">Trier par:</span>
        <SortButton field="title" label="Titre" />
        <SortButton field="artist" label="Artiste" />
        <SortButton field="album" label="Album" />
        <SortButton field="genre" label="Genre" />
        <SortButton field="duration" label="Durée" />
      </div>

      <div className="space-y-1">
        {sortedTracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
            onClick={() => onTrackPlay(track)}
          >
            <img
              src={track.cover}
              alt={track.title}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0 grid grid-cols-4 gap-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {track.title}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {track.artist}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {track.album}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {track.genre || "—"}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
