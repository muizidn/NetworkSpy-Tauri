import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { ToolMethod } from "@src/models/ToolMethod";
import { v4 as uuidv4 } from 'uuid';

export interface TagModel {
  id: string;
  enabled: boolean;
  name: string;
  method: ToolMethod;
  matchingRule: string;
  tag: string;
  isSync: boolean;
  scope: 'metadata' | 'body';
  color?: string;
  bgColor?: string;
  folder?: string;
}

interface TagContextState {
  tags: TagModel[];
  folders: string[];
  addTag: (tag: Omit<TagModel, "id">) => void;
  updateTag: (id: string, tag: Partial<TagModel>) => void;
  deleteTag: (id: string) => void;
  deleteFolder: (folderName: string) => void;
  addFolder: (name: string) => void;
  renameFolder: (oldName: string, newName: string) => void;
  moveTag: (tagId: string, targetFolder: string) => void;
  toggleTag: (id: string) => void;
  toggleFolder: (folderName: string, enabled: boolean) => void;
}

const TagContext = createContext<TagContextState | undefined>(undefined);

export const useTagContext = () => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error("useTagContext must be used within a TagProvider");
  }
  return context;
};

const STORAGE_KEY = "ns_traffic_tags";
const FOLDERS_KEY = "ns_traffic_tag_folders";
const MAX_SYNC_TAGS = 10;

export const TagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<TagModel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tags from localStorage", e);
      }
    }
    return [
      {
        id: uuidv4(),
        enabled: true,
        name: "Identify Auth",
        method: "ALL",
        matchingRule: "*/v1/auth/*",
        tag: "AUTH",
        isSync: true,
        scope: 'metadata',
        color: '#60a5fa',
        bgColor: '#1e3a8a33',
        folder: ''
      },
      {
        id: uuidv4(),
        enabled: true,
        name: "Static Assets",
        method: "GET",
        matchingRule: "*.png,*.jpg,*.jpeg,*.gif,*.svg,*.css,*.js",
        tag: "STATIC",
        isSync: true,
        scope: 'metadata',
        color: '#a1a1aa',
        bgColor: '#27272a',
        folder: ''
      }
    ];
  });

  const [folders, setFolders] = useState<string[]>(() => {
    const saved = localStorage.getItem(FOLDERS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    const initialFolders = Array.from(new Set(tags.map(t => t.folder || ""))).filter(f => f !== "");
    return initialFolders;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  }, [folders]);

  const enforceSyncLimit = useCallback((allTags: TagModel[]) => {
    // 1. Force scope='body' to be async
    let processedTags = allTags.map(t => {
      if (t.scope === 'body' && t.isSync) {
        return { ...t, isSync: false };
      }
      return t;
    });

    // 2. Enforce 10-slot limit
    const syncTags = processedTags.filter(t => t.isSync);
    if (syncTags.length <= MAX_SYNC_TAGS) return processedTags;

    const tagsToAsyncCount = syncTags.length - MAX_SYNC_TAGS;
    let demotedCount = 0;
    
    return processedTags.map(t => {
      if (t.isSync && demotedCount < tagsToAsyncCount) {
        demotedCount++;
        return { ...t, isSync: false };
      }
      return t;
    });
  }, []);

  const addTag = useCallback((tag: Omit<TagModel, "id">) => {
    setTags(prev => {
      const newTagFolder = tag.folder || "";
      if (newTagFolder && !folders.includes(newTagFolder)) {
        setFolders(f => Array.from(new Set([...f, newTagFolder])));
      }
      const newTags = [...prev, { ...tag, id: uuidv4() }];
      return enforceSyncLimit(newTags as TagModel[]);
    });
  }, [enforceSyncLimit, folders]);

  const updateTag = useCallback((id: string, updatedFields: Partial<TagModel>) => {
    setTags(prev => {
      const newTags = prev.map(t => t.id === id ? { ...t, ...updatedFields } : t);
      return enforceSyncLimit(newTags);
    });
  }, [enforceSyncLimit]);

  const deleteTag = useCallback((id: string) => {
    setTags(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTag = useCallback((id: string) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t));
  }, []);

  const deleteFolder = useCallback((folderName: string) => {
    setTags(prev => prev.filter(t => t.folder !== folderName));
    setFolders(prev => prev.filter(f => f !== folderName));
  }, []);

  const addFolder = useCallback((name: string) => {
    setFolders(prev => {
      if (prev.includes(name)) return prev;
      return [...prev, name];
    });
  }, []);

  const renameFolder = useCallback((oldName: string, newName: string) => {
    setFolders(prev => prev.map(f => f === oldName ? newName : f));
    setTags(prev => prev.map(t => t.folder === oldName ? { ...t, folder: newName } : t));
  }, []);

  const moveTag = useCallback((tagId: string, targetFolder: string) => {
    setTags(prev => prev.map(t => t.id === tagId ? { ...t, folder: targetFolder } : t));
  }, []);

  const toggleFolder = useCallback((folderName: string, enabled: boolean) => {
    setTags(prev => prev.map(t => t.folder === folderName ? { ...t, enabled } : t));
  }, []);

  return (
    <TagContext.Provider value={{ 
      tags, 
      folders, 
      addTag, 
      updateTag, 
      deleteTag, 
      deleteFolder, 
      addFolder, 
      renameFolder, 
      moveTag, 
      toggleTag, 
      toggleFolder 
    }}>
      {children}
    </TagContext.Provider>
  );
};
