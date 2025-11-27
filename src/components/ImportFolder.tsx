import { useRef, useState } from "react";
import { FolderOpen, Upload, Trash2, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFolderHistory } from "@/hooks/useFolderHistory";
import { Album, Track } from "@/data/mockData";
import { parseBlob } from "music-metadata";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface ImportFolderProps {
  onImport: (albums: Album[]) => void;
  currentAlbums: Album[];
  onUpdateAlbums: (albums: Album[]) => void;
  onRemoveFolderAlbums: (folderName: string) => void;
  onProgressiveImport?: (album: Album) => void;
}

export const ImportFolder = ({ onImport, currentAlbums, onUpdateAlbums, onRemoveFolderAlbums, onProgressiveImport }: ImportFolderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reindexInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { folders, addFolder, removeFolder, getFolderHandle } = useFolderHistory();
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, isReindex = false, directoryHandle?: FileSystemDirectoryHandle) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) {
      return;
    }

    // Extract folder name from first file path
    const firstFile = files[0];
    const folderName = directoryHandle?.name || 
      (firstFile.webkitRelativePath 
        ? firstFile.webkitRelativePath.split('/')[0] 
        : "Fichiers sélectionnés");

    toast({
      title: isReindex ? "Ré-indexation en cours" : "Import en cours",
      description: `Traitement de ${files.length} fichiers depuis "${folderName}"...`,
    });

    try {
      const albums = await processFiles(files, folderName, onProgressiveImport);
      
      if (isReindex) {
        // Ré-indexation: compare et met à jour
        const updatedAlbums = reindexAlbums(currentAlbums, albums, folderName);
        onUpdateAlbums(updatedAlbums);
        addFolder(folderName, files.length, directoryHandle);
        
        toast({
          title: "Ré-indexation terminée",
          description: `"${folderName}" a été mis à jour`,
        });
      } else if (albums.length > 0) {
        // Import normal
        addFolder(folderName, files.length, directoryHandle);
        
        // Only call onImport if progressive import wasn't used
        // (progressive import already added albums one by one)
        if (!onProgressiveImport) {
          onImport(albums);
        }
        
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
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur d'import",
        description: `Détails: ${errorMessage}`,
        variant: "destructive",
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (reindexInputRef.current) {
      reindexInputRef.current.value = "";
    }
  };

  const handleReindexFolder = async (folderName: string) => {
    console.log(`🔄 Tentative de ré-indexation du dossier: ${folderName}`);
    const handle = getFolderHandle(folderName);
    console.log(`📁 Handle trouvé:`, handle ? 'Oui' : 'Non');
    
    if (!handle) {
      // Pas de handle stocké - utiliser showDirectoryPicker si disponible
      if ('showDirectoryPicker' in window) {
        try {
          toast({
            title: "Sélection du dossier",
            description: `Sélectionnez le dossier "${folderName}" pour le ré-indexer`,
          });
          
          const dirHandle = await (window as any).showDirectoryPicker();
          const files: File[] = [];
          await readDirectoryRecursively(dirHandle, files, dirHandle.name);
          
          if (files.length > 0) {
            const mockEvent = { target: { files } } as any;
            await handleFileSelect(mockEvent, true, dirHandle);
          }
          return;
        } catch (error) {
          if ((error as any).name === 'AbortError') {
            console.log('Sélection annulée par l\'utilisateur');
            return;
          }
          console.error("Directory picker error:", error);
        }
      }
      
      // Fallback: demander avec l'input traditionnel
      toast({
        title: "Ré-indexation",
        description: `Sélectionnez à nouveau le dossier "${folderName}"`,
      });
      reindexInputRef.current?.click();
      return;
    }

    try {
      console.log('✅ Utilisation du handle stocké pour ré-indexation automatique');
      
      // Vérifier les permissions (File System Access API)
      const handleWithPermission = handle as any;
      const permission = await handleWithPermission.queryPermission({ mode: 'read' });
      console.log(`🔐 Permission actuelle: ${permission}`);
      
      if (permission !== 'granted') {
        const newPermission = await handleWithPermission.requestPermission({ mode: 'read' });
        console.log(`🔐 Nouvelle permission: ${newPermission}`);
        
        if (newPermission !== 'granted') {
          toast({
            title: "Permission refusée",
            description: "Accès au dossier refusé. Veuillez le sélectionner à nouveau.",
            variant: "destructive",
          });
          
          // Redemander la sélection
          if ('showDirectoryPicker' in window) {
            const dirHandle = await (window as any).showDirectoryPicker();
            const files: File[] = [];
            await readDirectoryRecursively(dirHandle, files, dirHandle.name);
            
            if (files.length > 0) {
              const mockEvent = { target: { files } } as any;
              await handleFileSelect(mockEvent, true, dirHandle);
            }
          } else {
            reindexInputRef.current?.click();
          }
          return;
        }
      }

      // Lire tous les fichiers du dossier
      console.log('📂 Lecture du dossier...');
      const files: File[] = [];
      await readDirectoryRecursively(handle, files);
      console.log(`📄 ${files.length} fichiers trouvés`);

      if (files.length === 0) {
        toast({
          title: "Dossier vide",
          description: "Aucun fichier trouvé dans le dossier",
          variant: "destructive",
        });
        return;
      }

      // Créer un événement fictif pour réutiliser handleFileSelect
      const mockEvent = {
        target: {
          files: files
        }
      } as any;

      await handleFileSelect(mockEvent, true, handle);
    } catch (error) {
      console.error("Reindex error:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au dossier. Veuillez le sélectionner à nouveau.",
        variant: "destructive",
      });
      
      // Redemander la sélection avec l'API moderne si disponible
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker();
          const files: File[] = [];
          await readDirectoryRecursively(dirHandle, files, dirHandle.name);
          
          if (files.length > 0) {
            const mockEvent = { target: { files } } as any;
            await handleFileSelect(mockEvent, true, dirHandle);
          }
        } catch (pickerError) {
          if ((pickerError as any).name !== 'AbortError') {
            console.error("Picker error:", pickerError);
            reindexInputRef.current?.click();
          }
        }
      } else {
        reindexInputRef.current?.click();
      }
    }
  };

  const readDirectoryRecursively = async (
    dirHandle: FileSystemDirectoryHandle,
    files: File[],
    path: string = ""
  ) => {
    const dirHandleWithIterator = dirHandle as any;
    for await (const entry of dirHandleWithIterator.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        // Add webkitRelativePath to mimic folder selection
        Object.defineProperty(file, 'webkitRelativePath', {
          value: path ? `${path}/${file.name}` : file.name,
          writable: false
        });
        files.push(file);
      } else if (entry.kind === 'directory') {
        await readDirectoryRecursively(
          entry,
          files,
          path ? `${path}/${entry.name}` : entry.name
        );
      }
    }
  };

  const reindexAlbums = (current: Album[], newAlbums: Album[], folderName: string): Album[] => {
    // Filtre les albums qui ne proviennent pas de ce dossier
    const otherAlbums = current.filter(album => {
      // On suppose qu'un album appartient au dossier s'il a des tracks avec des URLs blob
      // et que le nom d'album ou artiste correspond
      return !album.tracks.some(track => track.url.startsWith('blob:'));
    });

    // Combine avec les nouveaux albums du dossier
    return [...otherAlbums, ...newAlbums];
  };

  const processFiles = async (files: File[], sourceFolderName?: string, onProgress?: (album: Album) => void): Promise<Album[]> => {
    console.log(`📂 Début du traitement de ${files.length} fichiers...`);
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
    console.log(`🎵 Traitement de ${audioFiles.length} fichiers audio...`);
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

    // Extract folder name from files
    const firstFile = audioFiles[0];
    const extractedFolderName = sourceFolderName || 
      (firstFile && (firstFile as any).webkitRelativePath 
        ? (firstFile as any).webkitRelativePath.split("/")[0] 
        : "Fichiers importés");

    // Group tracks by album
    const albumsMap = new Map<string, {
      id: string;
      artist: string;
      album: string;
      year: number;
      cover: string;
      tracks: Track[];
      folderName: string;
    }>();

    tracksData.forEach(({ file, metadata, url }) => {
      const relativePath = (file as any).webkitRelativePath as string | undefined;
      const folderName = relativePath ? relativePath.split("/")[0] : extractedFolderName;

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
        const albumId = `album-${Date.now()}-${Math.random()}`;
        albumsMap.set(albumKey, {
          id: albumId,
          artist,
          album: albumName,
          year: typeof year === 'string' ? parseInt(year) : year,
          cover: coverUrl,
          tracks: [],
          folderName: extractedFolderName,
        });
      }

      const albumData = albumsMap.get(albumKey)!;
      const genre = metadata.tags?.genre?.[0] || metadata.tags?.genre;
      albumData.tracks.push({
        id: `track-${Date.now()}-${Math.random()}`,
        title,
        artist,
        album: albumName,
        albumId: albumData.id,
        duration: metadata.format?.duration || 0,
        cover: coverUrl,
        url,
        genre: typeof genre === 'string' ? genre : undefined,
      });
    });

    // Convert map to albums array and emit progressively
    console.log(`📚 Création de ${albumsMap.size} albums...`);
    const albums: Album[] = [];
    for (const [key, data] of albumsMap.entries()) {
      const album: Album = {
        id: data.id,
        title: data.album,
        artist: data.artist,
        cover: data.cover,
        year: data.year,
        tracks: data.tracks,
        folderName: data.folderName,
      };
      albums.push(album);
      console.log(`➕ Album créé: ${album.artist} - ${album.title} (${album.tracks.length} pistes)`);
      
      // Emit album progressively if callback provided
      if (onProgress) {
        console.log(`📤 Émission progressive de l'album: ${album.title}`);
        try {
          onProgress(album);
        } catch (error) {
          console.error(`❌ Erreur lors de l'émission progressive:`, error);
        }
      }
    }

    // Fetch missing covers from MusicBrainz (with rate limiting)
    const albumsWithMissingCovers = albums.filter(album => 
      album.cover.includes('unsplash.com')
    );
    
    if (albumsWithMissingCovers.length > 0) {
      console.log(`🎨 ${albumsWithMissingCovers.length} pochettes manquantes - Recherche limitée aux 10 premières...`);
      
      // Limiter à 10 albums pour éviter de dépasser les quotas
      const limitedAlbums = albumsWithMissingCovers.slice(0, 10);
      let processedCount = 0;
      
      for (const album of limitedAlbums) {
        processedCount++;
        console.log(`🔍 [${processedCount}/${limitedAlbums.length}] Recherche pochette pour: ${album.artist} - ${album.title}`);
        
        // Update toast with progress
        toast({
          title: "Recherche des pochettes",
          description: `${processedCount}/${limitedAlbums.length}: ${album.artist} - ${album.title}`,
        });
        
        try {
          const { data, error } = await supabase.functions.invoke('fetch-album-cover', {
            body: { artist: album.artist, album: album.title }
          });

          if (error) {
            console.error(`❌ Erreur lors de la récupération de la pochette:`, error);
            // Si on dépasse le quota, arrêter la recherche
            if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
              console.log('⚠️ Quota dépassé, arrêt de la recherche de pochettes');
              toast({
                title: "Limite atteinte",
                description: "Recherche de pochettes interrompue (limite API atteinte)",
              });
              break;
            }
            continue;
          }

          if (data?.coverUrl) {
            console.log(`✅ Pochette trouvée pour: ${album.artist} - ${album.title}`);
            // Update album and all its tracks with the new cover
            album.cover = data.coverUrl;
            album.tracks.forEach(track => {
              track.cover = data.coverUrl;
            });
          } else {
            console.log(`⚠️ Aucune pochette trouvée pour: ${album.artist} - ${album.title}`);
          }
        } catch (error) {
          console.error(`❌ Erreur inattendue lors de la récupération de la pochette:`, error);
          // Si erreur de quota, arrêter
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
            console.log('⚠️ Quota dépassé, arrêt de la recherche de pochettes');
            break;
          }
        }
        
        // Délai de 1 seconde entre chaque requête pour respecter les limites
        if (processedCount < limitedAlbums.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final success toast
      const foundCount = albums.filter(a => !a.cover.includes('unsplash.com')).length;
      if (albumsWithMissingCovers.length > 10) {
        toast({
          title: "Recherche terminée",
          description: `${foundCount} pochette(s) trouvée(s). ${albumsWithMissingCovers.length - 10} albums ignorés (limite de 10 par import)`,
        });
      } else {
        toast({
          title: "Recherche terminée",
          description: `${foundCount} pochette(s) trouvée(s) sur ${albums.length} albums`,
        });
      }
    }

    return albums;
  };

  const readMetadata = async (file: File): Promise<any> => {
    try {
      console.log(
        `Lecture métadonnées (music-metadata) pour: ${file.name}, type: ${file.type}, taille: ${file.size} bytes`
      );

      const metadata = await parseBlob(file, {
        skipCovers: false,
        duration: true,
      });

      console.log("📦 Format détecté:", metadata.format);
      console.log("📝 Common tags:", metadata.common);
      console.log("🏷️ Native tags:", metadata.native);

      // Helper pour extraire valeur primitive
      const getValue = (value: any): string | number | null => {
        if (value == null) return null;
        if (Array.isArray(value)) return getValue(value[0]);
        if (typeof value === "string" || typeof value === "number") {
          const s = String(value).trim();
          return s && s.toLowerCase() !== "undefined" ? s : null;
        }
        if (typeof value === "object" && "value" in value) {
          return getValue((value as any).value);
        }
        return null;
      };

      const artist = getValue(metadata.common.artist) || "Artiste inconnu";
      const album = getValue(metadata.common.album) || "Album inconnu";
      const title = getValue(metadata.common.title) || file.name.replace(/\.[^/.]+$/, "");
      const year = Number(getValue(metadata.common.year) || new Date().getFullYear());

      // Pochette - essayer plusieurs sources
      let picture: { data: Uint8Array; format: string } | null = null;
      
      // Tentative 1: Common picture tag (standard)
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        picture = {
          data: new Uint8Array(pic.data),
          format: pic.format || "image/jpeg",
        };
        console.log(`🎨 Pochette extraite (common): ${pic.format}, ${pic.data.length} bytes`);
      }
      
      // Tentative 2: Native iTunes tags (covr)
      if (!picture && metadata.native?.iTunes) {
        const covrTag = metadata.native.iTunes.find((tag: any) => tag.id === 'covr');
        if (covrTag?.value && typeof covrTag.value === 'object' && 'data' in covrTag.value) {
          const pic = covrTag.value as { data: Buffer | Uint8Array; format?: string };
          picture = {
            data: new Uint8Array(pic.data),
            format: pic.format || "image/jpeg",
          };
          console.log(`🎨 Pochette extraite (iTunes covr): ${pic.format || 'image/jpeg'}, ${pic.data.length} bytes`);
        }
      }
      
      // Tentative 3: Parcourir tous les tags natifs pour trouver une image
      if (!picture && metadata.native) {
        for (const [tagType, tags] of Object.entries(metadata.native)) {
          if (Array.isArray(tags)) {
            const pictureTag = tags.find((tag: any) => {
              const id = String(tag.id || "").toLowerCase();
              return id.includes('pic') || id.includes('covr') || id.includes('apic');
            });
            
            if (pictureTag?.value && typeof pictureTag.value === 'object' && 'data' in pictureTag.value) {
              const pic = pictureTag.value as { data: Buffer | Uint8Array; format?: string };
              picture = {
                data: new Uint8Array(pic.data),
                format: pic.format || "image/jpeg",
              };
              console.log(`🎨 Pochette extraite (${tagType} ${pictureTag.id}): ${pic.format || 'image/jpeg'}, ${pic.data.length} bytes`);
              break;
            }
          }
        }
      }
      
      if (!picture) {
        console.warn(`⚠️ Aucune pochette trouvée pour ${file.name}`);
        console.log('📋 Tags disponibles:', {
          commonPicture: metadata.common.picture?.length || 0,
          nativeTags: metadata.native ? Object.keys(metadata.native) : []
        });
      }

      console.log(`📊 Métadonnées finales pour ${file.name}:`, {
        artist,
        album,
        title,
        year,
        duration: metadata.format?.duration,
        hasPicture: !!picture,
        pictureFormat: picture?.format,
      });

      return {
        format: metadata.format,
        tags: {
          artist,
          album,
          title,
          year,
          picture,
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
  const handleConfirmDelete = () => {
    if (folderToDelete) {
      const albumsInFolder = currentAlbums.filter(album => album.folderName === folderToDelete);
      const trackCount = albumsInFolder.reduce((sum, album) => sum + album.tracks.length, 0);
      
      onRemoveFolderAlbums(folderToDelete);
      removeFolder(folderToDelete);
      
      toast({
        title: "Dossier supprimé",
        description: `"${folderToDelete}" et ${albumsInFolder.length} album(s) (${trackCount} titre(s)) ont été supprimés`,
      });
      
      setFolderToDelete(null);
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
        onChange={(e) => handleFileSelect(e, false)}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
      <input
        ref={reindexInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac,audio/mp4,audio/x-m4a,audio/m4a"
        onChange={(e) => handleFileSelect(e, true)}
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as any)}
      />
      
      <div className="flex gap-4">
        <Button
          onClick={async () => {
            // Try to use File System Access API for better handle storage
            if ('showDirectoryPicker' in window) {
              try {
                const dirHandle = await (window as any).showDirectoryPicker();
                const files: File[] = [];
                await readDirectoryRecursively(dirHandle, files, dirHandle.name);
                
                if (files.length > 0) {
                  const mockEvent = {
                    target: { files }
                  } as any;
                  await handleFileSelect(mockEvent, false, dirHandle);
                }
              } catch (error) {
                // User cancelled or error occurred, fallback to input
                if ((error as any).name !== 'AbortError') {
                  console.error("Directory picker error:", error);
                }
                fileInputRef.current?.click();
              }
            } else {
              // Fallback to traditional file input
              fileInputRef.current?.click();
            }
          }}
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
              Ré-indexez vos dossiers pour synchroniser les modifications
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
                    onClick={() => handleReindexFolder(folder.name)}
                    title="Ré-indexer ce dossier"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setFolderToDelete(folder.name)}
                    title="Supprimer de l'historique et tous les titres"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={folderToDelete !== null} onOpenChange={(open) => !open && setFolderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              {folderToDelete && (
                <>
                  Êtes-vous sûr de vouloir supprimer le dossier <strong>"{folderToDelete}"</strong> ?
                  <br /><br />
                  Cette action supprimera :
                  <ul className="list-disc list-inside mt-2">
                    <li>
                      <strong>{currentAlbums.filter(album => album.folderName === folderToDelete).length}</strong> album(s)
                    </li>
                    <li>
                      <strong>
                        {currentAlbums
                          .filter(album => album.folderName === folderToDelete)
                          .reduce((sum, album) => sum + album.tracks.length, 0)}
                      </strong> titre(s)
                    </li>
                  </ul>
                  <br />
                  Cette action est irréversible.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
