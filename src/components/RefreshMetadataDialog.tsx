import { useRef, useState } from "react";
import { Track } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import * as musicMetadata from "music-metadata-browser";
import { RefreshCw, Upload } from "lucide-react";

interface RefreshMetadataDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (trackId: string, updates: Partial<Track>) => void;
}

export const RefreshMetadataDialog = ({
  track,
  open,
  onOpenChange,
  onUpdate,
}: RefreshMetadataDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getMetadataValue = (value: any): string | number | null => {
    if (value == null) return null;

    if (Array.isArray(value)) {
      return getMetadataValue(value[0]) as string | number | null;
    }

    if (typeof value === "string" || typeof value === "number") {
      const str = String(value).trim();
      if (!str || str.toLowerCase() === "undefined") return null;
      return str;
    }

    if (typeof value === "object" && "value" in value) {
      return getMetadataValue((value as any).value) as string | number | null;
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!track) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const metadata = await musicMetadata.parseBlob(file, {
        skipCovers: false,
        includeChapters: false,
      });

      const artist = getMetadataValue(metadata.common.artist);
      const album = getMetadataValue(metadata.common.album);
      const title = getMetadataValue(metadata.common.title);
      const duration = metadata.format?.duration || track.duration;

      // Extract cover art
      let coverUrl = track.cover;
      if (metadata.common.picture?.[0]) {
        const { data, format } = metadata.common.picture[0];
        const blob = new Blob([new Uint8Array(data)], { type: format });
        coverUrl = URL.createObjectURL(blob);
      }

      // Create new audio URL
      const url = URL.createObjectURL(file);

      onUpdate(track.id, {
        title: (title as string) || track.title,
        artist: (artist as string) || "Artiste inconnu",
        album: (album as string) || "Album inconnu",
        duration,
        cover: coverUrl,
        url,
      });

      toast({
        title: "Métadonnées mises à jour",
        description: "Les métadonnées ont été rafraîchies depuis le fichier",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Erreur lors de la lecture des métadonnées:", error);
      toast({
        title: "Erreur",
        description: "Impossible de lire les métadonnées du fichier",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac,audio/mp4,audio/x-m4a,audio/m4a"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rafraîchir les métadonnées</DialogTitle>
            <DialogDescription>
              Sélectionnez le fichier audio pour ré-extraire ses métadonnées (titre, artiste, album, pochette)
            </DialogDescription>
          </DialogHeader>

          <div className="py-8">
            <div className="bg-muted rounded-lg p-6 space-y-4">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Piste actuelle</h3>
                <p className="text-sm text-muted-foreground">{track?.title}</p>
                <p className="text-xs text-muted-foreground">
                  {track?.artist} • {track?.album}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Sélectionner le fichier
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
