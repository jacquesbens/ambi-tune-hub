import { useState, useEffect } from "react";
import { Album } from "@/data/mockData";

const STORAGE_KEY = "music_library";

export const useAlbumStorage = () => {
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAlbums(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading albums:", e);
      }
    }
  }, []);

  const saveAlbums = (newAlbums: Album[]) => {
    setAlbums(newAlbums);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAlbums));
  };

  const addAlbums = (newAlbums: Album[]) => {
    const updated = [...albums, ...newAlbums];
    saveAlbums(updated);
  };

  const clearAlbums = () => {
    setAlbums([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { albums, addAlbums, clearAlbums, saveAlbums };
};
