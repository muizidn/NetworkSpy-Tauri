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
}

interface TagContextState {
  tags: TagModel[];
  addTag: (tag: Omit<TagModel, "id">) => void;
  updateTag: (id: string, tag: Partial<TagModel>) => void;
  deleteTag: (id: string) => void;
  toggleTag: (id: string) => void;
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
        isSync: true
      },
      {
        id: uuidv4(),
        enabled: true,
        name: "Static Assets",
        method: "GET",
        matchingRule: "*.png,*.jpg,*.jpeg,*.gif,*.svg,*.css,*.js",
        tag: "STATIC",
        isSync: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  }, [tags]);

  const enforceSyncLimit = useCallback((allTags: TagModel[]) => {
    const syncTags = allTags.filter(t => t.isSync);
    if (syncTags.length <= MAX_SYNC_TAGS) return allTags;

    // Find tags that should be moved to async
    // We'll keep the ones at the end (newest or most recently modified) as sync
    const tagsToAsyncCount = syncTags.length - MAX_SYNC_TAGS;
    let demotedCount = 0;
    
    return allTags.map(t => {
      if (t.isSync && demotedCount < tagsToAsyncCount) {
        demotedCount++;
        return { ...t, isSync: false };
      }
      return t;
    });
  }, []);

  const addTag = useCallback((tag: Omit<TagModel, "id">) => {
    setTags(prev => {
      const newTags = [...prev, { ...tag, id: uuidv4() }];
      return enforceSyncLimit(newTags);
    });
  }, [enforceSyncLimit]);

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

  return (
    <TagContext.Provider value={{ tags, addTag, updateTag, deleteTag, toggleTag }}>
      {children}
    </TagContext.Provider>
  );
};
