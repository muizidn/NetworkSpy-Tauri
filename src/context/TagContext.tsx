import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { ToolMethod } from "@src/models/ToolMethod";
import { v4 as uuidv4 } from 'uuid';
import { invoke } from "@tauri-apps/api/core";

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

export const TagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tags, setTags] = useState<TagModel[]>([]);
  const [folders, setFolders] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const fetchedTags = await invoke<TagModel[]>("get_tags_from_db");
      const fetchedFolders = await invoke<string[]>("get_tag_folders");
      setTags(fetchedTags);
      setFolders(fetchedFolders);
    } catch (e) {
      console.error("Failed to load tags from DB:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addTag = useCallback(async (tag: Omit<TagModel, "id">) => {
    const newTag = { ...tag, id: uuidv4() } as TagModel;
    try {
      await invoke("add_tag_to_db", { rule: newTag });
      await loadData();
    } catch (e) {
      console.error("Failed to add tag:", e);
    }
  }, [loadData]);

  const updateTag = useCallback(async (id: string, updatedFields: Partial<TagModel>) => {
    const existing = tags.find(t => t.id === id);
    if (!existing) return;
    const updatedRule = { ...existing, ...updatedFields } as TagModel;
    try {
      await invoke("update_tag_in_db", { id, rule: updatedRule });
      await loadData();
    } catch (e) {
      console.error("Failed to update tag", e);
    }
  }, [tags, loadData]);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await invoke("delete_tag_from_db", { id });
      await loadData();
    } catch (e) {
      console.error("Failed to delete tag", e);
    }
  }, [loadData]);

  const toggleTag = useCallback(async (id: string) => {
    const tag = tags.find(t => t.id === id);
    if (!tag) return;
    try {
      await invoke("toggle_tag_in_db", { id, enabled: !tag.enabled });
      await loadData();
    } catch (e) {
      console.error("Failed to toggle tag", e);
    }
  }, [tags, loadData]);

  const addFolder = useCallback(async (name: string) => {
    try {
      await invoke("add_tag_folder", { name });
      await loadData();
    } catch (e) {
      console.error("Failed to add folder", e);
    }
  }, [loadData]);

  const deleteFolder = useCallback(async (folderName: string) => {
    try {
      await invoke("delete_tag_folder_from_db", { name: folderName });
      await loadData();
    } catch (e) {
      console.error("Failed to delete folder", e);
    }
  }, [loadData]);

  const renameFolder = useCallback(async (oldName: string, newName: string) => {
     // Not yet implemented in backend, but we can do it if needed
     // For now, just skip or implement simple version
  }, []);

  const moveTag = useCallback(async (tagId: string, targetFolder: string) => {
    try {
      await invoke("move_tag_to_folder", { id: tagId, folder: targetFolder });
      await loadData();
    } catch (e) {
      console.error("Failed to move tag", e);
    }
  }, [loadData]);

  const toggleFolder = useCallback(async (folderName: string, enabled: boolean) => {
    // Backend doesn't have toggleFolder yet, but we can iterate
    const tagsInFolder = tags.filter(t => t.folder === folderName);
    for (const t of tagsInFolder) {
      await invoke("toggle_tag_in_db", { id: t.id, enabled });
    }
    await loadData();
  }, [tags, loadData]);

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
