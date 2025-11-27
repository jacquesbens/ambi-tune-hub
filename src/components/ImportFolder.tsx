import { useRef } from "react";
import { FolderOpen, Upload, Trash2, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFolderHistory } from "@/hooks/useFolderHistory";
import { Album, Track } from "@/data/mockData";
import * as musicMetadata from "music-metadata-browser";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ImportFolderProps {
  onImport: (albums: Album[]) => void;
  onRefreshMetadata?: () => void;
}

export const ImportFolder = ({ onImport, onRefreshMetadata }: ImportFolderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { folders, addFolder, removeFolder } = useFolderHistory();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      return;
    }

    // Extract folder name from first file path
    const firstFile = files[0];
    const folderName = firstFile.webkitRelativePath 
      ? firstFile.webkitRelativePath.split('/')[0] 
      : "Fichiers sélectionnés";

    toast({
      title: "Import en cours",
      description: `Traitement de ${files.length} fichiers depuis "${folderName}"...`,
    });

    try {
      const albums = await processFiles(files);
      
      if (albums.length > 0) {
        // Add folder to history
        addFolder(folderName, files.length);
        
        onImport(albums);
        toast({
          title: "Import réussi",
          description: `${albums.length} albums ajoutés depuis "${folderName}"`,
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
    const audioFiles = files.filter(file => {
      const isAudioType = file.type.startsWith("audio/") || 
        file.type === "audio/mp4" || 
        file.type === "audio/x-m4a" ||
        file.type === "audio/m4a";
      const hasAudioExtension = /\.(mp3|m4a|wav|flac|ogg|aac)$/i.test(file.name);
      return isAudioType || hasAudioExtension;
    });

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
        console.log(`✓ Fichier traité: ${file.name}`);
      } catch (error) {
        console.error(`✗ Erreur traitement ${file.name}:`, error);
      }
    }

    console.log(`Total fichiers traités: ${tracksData.length}/${audioFiles.length}`);

    // Group tracks by album
    const albumsMap = new Map<string, {
      artist: string;
      album: string;
      year: number;
      cover: string;
      tracks: Track[];
    }>();

    tracksData.forEach(({ file, metadata, url }) => {
      const relativePath = (file as any).webkitRelativePath as string | undefined;
      const folderName = relativePath ? relativePath.split("/")[0] : null;

      const cleanTitleFromFilename = (name: string) => {
        const base = name.replace(/\.[^/.]+$/, "");
        return base.replace(/^\s*\d+[-_.\s]*/u, "").trim();
      };

      const artist = metadata.tags?.artist || "Artiste inconnu";
      const albumName = metadata.tags?.album || folderName || "Album inconnu";
      const year = metadata.tags?.year || new Date().getFullYear();
      const title = metadata.tags?.title || cleanTitleFromFilename(file.name);
      
      console.log(`Ajout piste: ${title} - ${artist} - ${albumName} (dossier: ${folderName || "n/a"})`);
      
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
        duration: metadata.format?.duration || 0,
        cover: coverUrl,
        url,
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

  const readMetadata = async (file: File): Promise<any> => {
    try {
      console.log(`Lecture métadonnées pour: ${file.name}, type: ${file.type}, taille: ${file.size} bytes`);
      const metadata = await musicMetadata.parseBlob(file, {
        skipCovers: false,
        includeChapters: false,
        duration: true,
      });

      // Log complete structure with more detail
      console.log(`📦 Format:`, metadata.format);
      console.log(`📝 Common tags:`, JSON.stringify(metadata.common, null, 2));
      console.log(`🏷️ Native tags:`, metadata.native);
      
      // Log all native tag types available
      if (metadata.native) {
        Object.keys(metadata.native).forEach(tagType => {
          console.log(`  Native [${tagType}]:`, metadata.native[tagType]);
        });
      }

      // Helper to normalize any value (string | number | array | object) into a primitive
      const getMetadataValue = (value: any): string | number | null => {
        if (value == null) return null;

        // If it's an array, take the first meaningful value
        if (Array.isArray(value)) {
          return getMetadataValue(value[0]) as string | number | null;
        }

        // Direct primitive
        if (typeof value === "string" || typeof value === "number") {
          const str = String(value).trim();
          if (!str || str.toLowerCase() === "undefined") return null;
          return str;
        }

        // Objects coming from some tag formats: try their `value` field
        if (typeof value === "object" && "value" in value) {
          return getMetadataValue((value as any).value) as string | number | null;
        }

        return null;
      };

      // Some containers (like MP4/M4A) store useful tags only in native tags
      // Try multiple native tag types: mp4, iTunes, QuickTime
      const nativeMp4 = (metadata as any).native?.mp4 as Array<{ id: string; value: any }> | undefined;
      const nativeItunes = (metadata as any).native?.iTunes as Array<{ id: string; value: any }> | undefined;
      const nativeAll = [...(nativeMp4 || []), ...(nativeItunes || [])];

      const getFromNative = (id: string): string | number | null => {
        if (nativeAll.length === 0) return null;
        const tag = nativeAll.find((t) => t.id === id);
        if (!tag) return null;
        return getMetadataValue(tag.value);
      };

      // Prefer common tags, then fall back to MP4/iTunes native tags when needed
      const artist =
        getMetadataValue(metadata.common.artist) ??
        getFromNative("©ART") ??
        getFromNative("aART") ??
        getFromNative("artist");

      const album =
        getMetadataValue(metadata.common.album) ??
        getFromNative("©alb") ??
        getFromNative("album");

      const title =
        getMetadataValue(metadata.common.title) ??
        getFromNative("©nam") ??
        getFromNative("title");

      const year =
        getMetadataValue(metadata.common.year) ??
        getFromNative("©day") ??
        getFromNative("year");

      // Cover art: first try common.picture, then MP4/iTunes native 'covr'
      let picture = metadata.common.picture?.[0] ?? null;

      if (!picture && nativeAll.length > 0) {
        const coverTag = nativeAll.find((t) => t.id === "covr" || t.id === "cover");
        if (coverTag) {
          console.log(`🖼️ Cover tag trouvé:`, coverTag);
          const raw = Array.isArray(coverTag.value) ? coverTag.value[0] : coverTag.value;
          if (raw) {
            try {
              // Handle different data formats
              let uint8: Uint8Array;
              if (raw instanceof Uint8Array) {
                uint8 = raw;
              } else if (raw.data) {
                uint8 = raw.data instanceof Uint8Array ? raw.data : new Uint8Array(raw.data);
              } else if (ArrayBuffer.isView(raw)) {
                uint8 = new Uint8Array(raw.buffer);
              } else {
                uint8 = new Uint8Array(raw);
              }
              
              picture = {
                data: uint8 as any,
                format: raw.format || raw.type || "image/jpeg",
              } as any;
              console.log(`✅ Pochette extraite: ${uint8.length} bytes, format: ${picture.format}`);
            } catch (e) {
              console.error(`❌ Erreur extraction pochette:`, e);
            }
          }
        }
      }

      console.log(`📊 Métadonnées finales pour ${file.name}:`, {
        artist,
        album,
        title,
        year,
        duration: metadata.format?.duration,
        hasPictureCommon: !!metadata.common.picture?.[0],
        hasPictureNative: !!picture,
        pictureFormat: picture?.format,
      });

      return {
        format: metadata.format,
        tags: {
          artist,
          album,
          title,
          year,
          picture: picture
            ? {
                data: picture.data,
                format: picture.format,
              }
            : null,
        },
      };
    } catch (error) {
      console.error(`Erreur lecture métadonnées ${file.name}:`, error);
      return {
        format: { duration: 0 },
        tags: {
          artist: null,
          album: null,
          title: null,
          year: null,
          picture: null,
        },
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac,audio/mp4,audio/x-m4a,audio/m4a"
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

      {folders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Dossiers récemment importés
            </CardTitle>
            <CardDescription>
              Ré-importez facilement vos dossiers pour rafraîchir les métadonnées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {folders.map((folder) => (
              <div
                key={folder.name}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{folder.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {folder.fileCount} fichiers • {formatDate(folder.addedAt)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toast({
                        title: "Ré-import du dossier",
                        description: `Veuillez sélectionner à nouveau le dossier "${folder.name}"`,
                      });
                      fileInputRef.current?.click();
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFolder(folder.name)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
