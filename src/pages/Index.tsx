import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AlbumGrid } from "@/components/AlbumGrid";
import { Player } from "@/components/Player";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { mockAlbums, mockCurrentTrack, type Album } from "@/data/mockData";

const Index = () => {
  const [activeView, setActiveView] = useState("library");
  const [isPlaying, setIsPlaying] = useState(true);
  const [navigationMode, setNavigationMode] = useState<"sidebar" | "content" | "player">("sidebar");

  // Sidebar navigation
  const sidebarNav = useKeyboardNavigation({
    itemCount: 4,
    enabled: navigationMode === "sidebar",
    onSelect: (index) => {
      const views = ["home", "library", "search", "settings"];
      setActiveView(views[index]);
      setNavigationMode("content");
    },
  });

  // Content grid navigation
  const contentNav = useKeyboardNavigation({
    itemCount: mockAlbums.length,
    enabled: navigationMode === "content",
    onSelect: (index) => {
      console.log("Selected album:", mockAlbums[index]);
    },
    onBack: () => setNavigationMode("sidebar"),
  });

  // Player controls navigation
  const playerNav = useKeyboardNavigation({
    itemCount: 3,
    enabled: navigationMode === "player",
    onSelect: (index) => {
      if (index === 1) {
        setIsPlaying(!isPlaying);
      }
    },
    onBack: () => setNavigationMode("content"),
  });

  const handleAlbumSelect = (album: Album) => {
    console.log("Playing album:", album);
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
              <div className="p-8 pb-4">
                <h2 className="text-4xl font-bold text-foreground mb-2">Bibliothèque</h2>
                <p className="text-xl text-muted-foreground">
                  {mockAlbums.length} albums dans votre collection
                </p>
              </div>
              
              <AlbumGrid
                albums={mockAlbums}
                focusedIndex={navigationMode === "content" ? contentNav.focusedIndex : -1}
                onSelect={handleAlbumSelect}
              />
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
                  <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium tv-focusable">
                    Ajouter un dossier
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Player
        currentTrack={mockCurrentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        focusedControl={navigationMode === "player" ? playerNav.focusedIndex : -1}
      />
    </div>
  );
};

export default Index;
