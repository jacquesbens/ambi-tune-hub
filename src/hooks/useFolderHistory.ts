import { useState, useEffect } from "react";

interface FolderInfo {
  name: string;
  addedAt: string;
  fileCount: number;
}

const STORAGE_KEY = "imported_folders_history";

// Map to store directory handles (not persisted in localStorage due to security)
const directoryHandles = new Map<string, FileSystemDirectoryHandle>();

export const useFolderHistory = () => {
  const [folders, setFolders] = useState<FolderInfo[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFolders(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading folder history:", e);
      }
    }
  }, []);

  const addFolder = (name: string, fileCount: number, handle?: FileSystemDirectoryHandle) => {
    // Store the directory handle if provided
    if (handle) {
      directoryHandles.set(name, handle);
    }

    const newFolder: FolderInfo = {
      name,
      addedAt: new Date().toISOString(),
      fileCount,
    };

    setFolders((prev) => {
      // Check if folder already exists
      const existing = prev.find(f => f.name === name);
      if (existing) {
        // Update existing folder
        const updated = prev.map(f => 
          f.name === name 
            ? { ...f, addedAt: newFolder.addedAt, fileCount } 
            : f
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      }

      // Add new folder
      const updated = [newFolder, ...prev].slice(0, 10); // Keep last 10 folders
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const removeFolder = (name: string) => {
    directoryHandles.delete(name);
    setFolders((prev) => {
      const updated = prev.filter(f => f.name !== name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    directoryHandles.clear();
    setFolders([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const getFolderHandle = (name: string): FileSystemDirectoryHandle | undefined => {
    return directoryHandles.get(name);
  };

  return { folders, addFolder, removeFolder, clearHistory, getFolderHandle };
};
