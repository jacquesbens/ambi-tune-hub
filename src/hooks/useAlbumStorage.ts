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
    setAlbums(prev => {
      const updated = [...prev, ...newAlbums];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearAlbums = () => {
    setAlbums([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const removeAlbum = (albumId: string) => {
    const updated = albums.filter(album => album.id !== albumId);
    saveAlbums(updated);
  };

  const removeTrack = (albumId: string, trackId: string) => {
    const updated = albums.map(album => {
      if (album.id === albumId) {
        return {
          ...album,
          tracks: album.tracks.filter(track => track.id !== trackId)
        };
      }
      return album;
    }).filter(album => album.tracks.length > 0);
    saveAlbums(updated);
  };

  const updateTrack = (albumId: string, trackId: string, updates: Partial<typeof albums[0]['tracks'][0]>) => {
    const updated = albums.map(album => {
      if (album.id === albumId) {
        return {
          ...album,
          tracks: album.tracks.map(track => 
            track.id === trackId ? { ...track, ...updates } : track
          )
        };
      }
      return album;
    });
    saveAlbums(updated);
  };

  return { albums, addAlbums, clearAlbums, saveAlbums, removeAlbum, removeTrack, updateTrack };
};
