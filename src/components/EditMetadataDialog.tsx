import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface EditMetadataDialogProps {
  track: Track | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (trackId: string, updates: Partial<Track>) => void;
}

export const EditMetadataDialog = ({
  track,
  open,
  onOpenChange,
  onSave,
}: EditMetadataDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: track?.title || "",
    artist: track?.artist || "",
    album: track?.album || "",
  });

  const handleSave = () => {
    if (!track) return;

    // Validation simple
    if (!formData.title.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le titre ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    onSave(track.id, {
      title: formData.title.trim(),
      artist: formData.artist.trim() || "Artiste inconnu",
      album: formData.album.trim() || "Album inconnu",
    });

    toast({
      title: "Métadonnées mises à jour",
      description: "Les modifications ont été enregistrées",
    });

    onOpenChange(false);
  };

  // Update form data when track changes
  if (track && (formData.title !== track.title || formData.artist !== track.artist || formData.album !== track.album)) {
    setFormData({
      title: track.title,
      artist: track.artist,
      album: track.album,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier les métadonnées</DialogTitle>
          <DialogDescription>
            Modifiez les informations de la piste
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Titre de la piste"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artiste</Label>
            <Input
              id="artist"
              value={formData.artist}
              onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
              placeholder="Nom de l'artiste"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album">Album</Label>
            <Input
              id="album"
              value={formData.album}
              onChange={(e) => setFormData({ ...formData, album: e.target.value })}
              placeholder="Nom de l'album"
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
