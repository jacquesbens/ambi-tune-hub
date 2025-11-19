import { useRef } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Album, Track } from "@/data/mockData";
import jsmediatags from "jsmediatags";

interface ImportFolderProps {
  onImport: (albums: Album[]) => void;
}

export const ImportFolder = ({ onImport }: ImportFolderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      return;
    }

    toast({
      title: "Import en cours",
      description: `Traitement de ${files.length} fichiers...`,
    });

    try {
      const albums = await processFiles(files);
      
      if (albums.length > 0) {
        onImport(albums);
        toast({
          title: "Import réussi",
          description: `${albums.length} albums ajoutés à votre bibliothèque`,
        });
      } else {
        toast({
          title: "Aucun fichier musical",
          description: "Aucun fichier audio valide trouvé",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import",
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processFiles = async (files: File[]): Promise<Album[]> => {
    const audioFiles = files.filter(file => 
      file.type.startsWith("audio/") || 
      /\.(mp3|m4a|wav|flac|ogg|aac)$/i.test(file.name)
    );

    const tracksData: Array<{
      file: File;
      metadata: any;
      url: string;
    }> = [];

    // Read metadata for all files
    for (const file of audioFiles) {
      try {
        const metadata = await readMetadata(file);
        const url = URL.createObjectURL(file);
        tracksData.push({ file, metadata, url });
      } catch (error) {
        console.error(`Error reading ${file.name}:`, error);
      }
    }

    // Group tracks by album
    const albumsMap = new Map<string, {
      artist: string;
      album: string;
      year: number;
      cover: string;
      tracks: Track[];
    }>();

    tracksData.forEach(({ file, metadata, url }) => {
      const artist = metadata.tags?.artist || "Artiste inconnu";
      const albumName = metadata.tags?.album || "Album inconnu";
      const year = metadata.tags?.year || new Date().getFullYear();
      const title = metadata.tags?.title || file.name.replace(/\.[^/.]+$/, "");
      
      // Extract cover art
      let coverUrl = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500";
      if (metadata.tags?.picture) {
        const { data, format } = metadata.tags.picture;
        const blob = new Blob([new Uint8Array(data)], { type: format });
        coverUrl = URL.createObjectURL(blob);
      }

      const albumKey = `${artist}-${albumName}`;
      
      if (!albumsMap.has(albumKey)) {
        albumsMap.set(albumKey, {
          artist,
          album: albumName,
          year: typeof year === 'string' ? parseInt(year) : year,
          cover: coverUrl,
          tracks: [],
        });
      }

      const albumData = albumsMap.get(albumKey)!;
      albumData.tracks.push({
        id: `track-${Date.now()}-${Math.random()}`,
        title,
        artist,
        album: albumName,
        duration: 0, // Duration would need audio element to determine
        cover: coverUrl,
      });
    });

    // Convert map to albums array
    const albums: Album[] = Array.from(albumsMap.entries()).map(([key, data]) => ({
      id: `album-${Date.now()}-${Math.random()}`,
      title: data.album,
      artist: data.artist,
      cover: data.cover,
      year: data.year,
      tracks: data.tracks,
    }));

    return albums;
  };

  const readMetadata = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      jsmediatags.read(file, {
        onSuccess: (tag) => resolve(tag),
        onError: (error) => reject(error),
      });
    });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac"
        onChange={handleFileSelect}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
      
      <div className="flex gap-4">
        <Button
          onClick={() => fileInputRef.current?.click()}
          size="lg"
          className="gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          Importer un dossier
        </Button>
        
        <Button
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.removeAttribute("webkitdirectory");
              fileInputRef.current.removeAttribute("directory");
              fileInputRef.current.click();
              // Reset attributes after click
              setTimeout(() => {
                fileInputRef.current?.setAttribute("webkitdirectory", "");
                fileInputRef.current?.setAttribute("directory", "");
              }, 100);
            }
          }}
          size="lg"
          variant="outline"
          className="gap-2"
        >
          <Upload className="w-5 h-5" />
          Importer des fichiers
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Formats supportés : MP3, M4A, WAV, FLAC, OGG, AAC
      </p>
    </div>
  );
};
