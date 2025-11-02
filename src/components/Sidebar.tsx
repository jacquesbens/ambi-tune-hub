import { Home, Library, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  focusedIndex: number;
}

const menuItems = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "library", label: "Bibliothèque", icon: Library },
  { id: "search", label: "Recherche", icon: Search },
  { id: "settings", label: "Paramètres", icon: Settings },
];

export const Sidebar = ({ activeView, onNavigate, focusedIndex }: SidebarProps) => {
  return (
    <aside className="w-64 h-full bg-card border-r border-border flex flex-col py-8">
      <div className="px-6 mb-12">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          MusicTV
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isFocused = focusedIndex === index;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-4 rounded-lg text-lg font-medium transition-all",
                "tv-focusable",
                isActive && "bg-primary/20 text-primary",
                !isActive && "text-muted-foreground hover:bg-secondary hover:text-foreground",
                isFocused && "ring-2 ring-primary"
              )}
            >
              <Icon className="w-6 h-6" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
