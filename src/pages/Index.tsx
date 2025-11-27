import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AlbumGrid } from "@/components/AlbumGrid";
import { AlbumDetail } from "@/components/AlbumDetail";
import { Player } from "@/components/Player";
import { ImportFolder } from "@/components/ImportFolder";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useAlbumStorage } from "@/hooks/useAlbumStorage";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { type Album, type Track } from "@/data/mockData";

const Index = () => {
  const [activeView, setActiveView] = useState("library");
  const [navigationMode, setNavigationMode] = useState<"sidebar" | "content" | "player">("sidebar");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { albums: importedAlbums, addAlbums, saveAlbums, removeAlbum, removeTrack, updateTrack } = useAlbumStorage();
  const [deletedAlbumIds, setDeletedAlbumIds] = useState<Set<string>>(new Set());
  const audioPlayer = useAudioPlayer();

  const handleProgressiveImport = (album: Album) => {
    addAlbums([album]);
  };

  // Only use imported albums, excluding deleted ones
  const allAlbums = importedAlbums.filter(
    album => !deletedAlbumIds.has(album.id)
  );

  // Sidebar navigation
  const sidebarNav = useKeyboardNavigation({
    itemCount: 5,
    enabled: navigationMode === "sidebar",
    onSelect: (index) => {
      const views = ["home", "library", "tracks", "search", "settings"];
      setActiveView(views[index]);
      setNavigationMode("content");
    },
  });

  // Content grid navigation
  const contentNav = useKeyboardNavigation({
    itemCount: allAlbums.length,
    enabled: navigationMode === "content",
    onSelect: (index) => {
      console.log("Selected album:", allAlbums[index]);
    },
    onBack: () => setNavigationMode("sidebar"),
  });

  // Player controls navigation
  const playerNav = useKeyboardNavigation({
    itemCount: 3,
    enabled: navigationMode === "player",
    onSelect: (index) => {
      if (index === 1) {
        audioPlayer.togglePlayPause();
      }
    },
    onBack: () => setNavigationMode("content"),
  });

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleTrackPlay = (track: Track) => {
    audioPlayer.loadTrack(track);
    if (audioPlayer.isPlaying && audioPlayer.currentTrack?.id === track.id) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
  };

  const handleBackToLibrary = () => {
    setSelectedAlbum(null);
  };

  const handleDeleteAlbum = (albumId: string) => {
    // Check if this is an imported album
    const isImportedAlbum = importedAlbums.some(album => album.id === albumId);
    
    if (isImportedAlbum) {
      // Remove from localStorage
      removeAlbum(albumId);
    } else {
      // For mock albums, add to deleted set
      setDeletedAlbumIds(prev => new Set(prev).add(albumId));
    }
    
    // If the deleted album is currently selected, go back
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum(null);
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    if (selectedAlbum) {
      const isImportedAlbum = importedAlbums.some(album => album.id === selectedAlbum.id);
      
      if (isImportedAlbum) {
        removeTrack(selectedAlbum.id, trackId);
      }
      
      const updatedAlbum = {
        ...selectedAlbum,
        tracks: selectedAlbum.tracks.filter(track => track.id !== trackId)
      };
      
      if (updatedAlbum.tracks.length === 0) {
        // If no tracks left, delete the album
        handleDeleteAlbum(selectedAlbum.id);
        setSelectedAlbum(null);
      } else {
        setSelectedAlbum(updatedAlbum);
      }
      
      // Stop playing if the deleted track is currently playing
      if (audioPlayer.currentTrack?.id === trackId) {
        audioPlayer.pause();
      }
    }
  };

  const handleUpdateTrack = (trackId: string, updates: Partial<Track>) => {
    if (selectedAlbum) {
      const isImportedAlbum = importedAlbums.some(album => album.id === selectedAlbum.id);
      
      if (isImportedAlbum) {
        updateTrack(selectedAlbum.id, trackId, updates);
      }
      
      const updatedAlbum = {
        ...selectedAlbum,
        tracks: selectedAlbum.tracks.map(track => 
          track.id === trackId ? { ...track, ...updates } : track
        )
      };
      
      setSelectedAlbum(updatedAlbum);
    }
  };

  const handleRemoveFolderAlbums = (folderName: string) => {
    console.log(`🗑️ Suppression des albums du dossier: ${folderName}`);
    const updatedAlbums = importedAlbums.filter(album => album.folderName !== folderName);
    console.log(`📊 Albums avant: ${importedAlbums.length}, après: ${updatedAlbums.length}`);
    saveAlbums(updatedAlbums);
    
    // If the currently selected album is from this folder, deselect it
    if (selectedAlbum?.folderName === folderName) {
      setSelectedAlbum(null);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeView={activeView}
          onNavigate={(view) => {
            setActiveView(view);
            setNavigationMode("content");
          }}
          focusedIndex={navigationMode === "sidebar" ? sidebarNav.focusedIndex : -1}
        />
        
        <main className="flex-1 overflow-auto">
          {activeView === "library" && (
            <div>
              {selectedAlbum ? (
                <AlbumDetail
                  album={selectedAlbum}
                  onBack={handleBackToLibrary}
                  onPlayTrack={handleTrackPlay}
                  currentTrack={audioPlayer.currentTrack}
                  isPlaying={audioPlayer.isPlaying}
                  onDeleteTrack={handleDeleteTrack}
                  onUpdateTrack={handleUpdateTrack}
                />
              ) : (
                <>
                  <div className="p-8 pb-4">
                    <h2 className="text-4xl font-bold text-foreground mb-2">Albums</h2>
                    <p className="text-xl text-muted-foreground">
                      {allAlbums.length} albums dans votre collection
                    </p>
                  </div>
                  
                  <AlbumGrid
                    albums={allAlbums}
                    focusedIndex={navigationMode === "content" ? contentNav.focusedIndex : -1}
                    onSelect={handleAlbumSelect}
                    onDelete={handleDeleteAlbum}
                  />
                </>
              )}
            </div>
          )}

          {activeView === "home" && (
            <div className="p-8">
              <h2 className="text-4xl font-bold text-foreground mb-8">Accueil</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h3 className="text-2xl font-semibold mb-4">Récemment ajouté</h3>
                  <p className="text-muted-foreground">Vos derniers albums</p>
                </div>
                <div className="bg-card rounded-2xl p-8 border border-border">
                  <h3 className="text-2xl font-semibold mb-4">Lecture récente</h3>
                  <p className="text-muted-foreground">Continuez l'écoute</p>
                </div>
              </div>
            </div>
          )}

          {activeView === "tracks" && (
            <div className="p-8">
              <h2 className="text-4xl font-bold text-foreground mb-2">Morceaux</h2>
              <p className="text-xl text-muted-foreground mb-8">
                {allAlbums.reduce((sum, album) => sum + album.tracks.length, 0)} morceaux dans votre collection
              </p>
              
              <div className="space-y-1">
                {allAlbums.flatMap(album => 
                  album.tracks.map(track => (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                      onClick={() => handleTrackPlay(track)}
                    >
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {track.title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artist} • {track.album}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.floor(track.duration / 60)}:{String(Math.floor(track.duration % 60)).padStart(2, "0")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeView === "search" && (
            <div className="p-8">
              <h2 className="text-4xl font-bold text-foreground mb-8">Recherche</h2>
              <div className="bg-card rounded-2xl p-8 border border-border">
                <p className="text-xl text-muted-foreground text-center">
                  Fonctionnalité de recherche à venir
                </p>
              </div>
            </div>
          )}

          {activeView === "settings" && (
            <div className="p-8">
              <h2 className="text-4xl font-bold text-foreground mb-8">Paramètres</h2>
              <div className="bg-card rounded-2xl p-8 border border-border space-y-6">
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Dossiers musicaux</h3>
                  <p className="text-muted-foreground mb-4">
                    Gérez les dossiers contenant votre musique
                  </p>
                  <ImportFolder 
                    onImport={addAlbums}
                    currentAlbums={importedAlbums}
                    onUpdateAlbums={saveAlbums}
                    onRemoveFolderAlbums={handleRemoveFolderAlbums}
                    onProgressiveImport={handleProgressiveImport}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Player
        currentTrack={audioPlayer.currentTrack}
        isPlaying={audioPlayer.isPlaying}
        onPlayPause={audioPlayer.togglePlayPause}
        focusedControl={navigationMode === "player" ? playerNav.focusedIndex : -1}
        currentTime={audioPlayer.currentTime}
        duration={audioPlayer.duration}
        volume={audioPlayer.volume}
        onSeek={audioPlayer.seek}
        onVolumeChange={audioPlayer.changeVolume}
      />
    </div>
  );
};

export default Index;
