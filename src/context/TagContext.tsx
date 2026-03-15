import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
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
  folderId?: string;
}

export interface TagFolder {
  id: string;
  name: string;
}

interface TagContextState {
  tags: TagModel[];
  folders: TagFolder[];
  addTag: (tag: Omit<TagModel, "id">) => void;
  updateTag: (id: string, tag: Partial<TagModel>) => void;
  deleteTag: (id: string) => void;
  deleteFolder: (id: string) => void;
  addFolder: (name: string) => void;
  renameFolder: (id: string, newName: string) => void;
  moveTag: (tagId: string, targetFolderId: string) => void;
  toggleTag: (id: string) => void;
  toggleFolder: (folderId: string, enabled: boolean) => void;
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
  const [folders, setFolders] = useState<TagFolder[]>([]);

  const loadData = useCallback(async () => {
    try {
      const fetchedTags = await invoke<TagModel[]>("get_tags_from_db");
      const fetchedFolders = await invoke<TagFolder[]>("get_tag_folders");
      setTags(fetchedTags);
      setFolders(fetchedFolders);
    } catch (e) {
      console.error("Failed to load data from DB:", e);
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
      throw e;
    }
  }, [loadData]);

  const updateTag = useCallback(async (id: string, updatedFields: Partial<TagModel>) => {
    try {
      await invoke("update_tag_in_db", { id, updates: updatedFields });
      await loadData();
    } catch (e) {
      console.error("Failed to update tag", e);
      throw e;
    }
  }, [loadData]);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await invoke("delete_tag_from_db", { id });
      await loadData();
    } catch (e) {
      console.error("Failed to delete tag", e);
      throw e;
    }
  }, [loadData]);

  const toggleTag = useCallback(async (id: string) => {
    try {
      await invoke("toggle_tag_in_db", { id });
      await loadData();
    } catch (e) {
      console.error("Failed to toggle tag", e);
      throw e;
    }
  }, [loadData]);

  const addFolder = useCallback(async (name: string) => {
    try {
      await invoke("add_tag_folder", { id: uuidv4(), name });
      await loadData();
    } catch (e) {
      console.error("Failed to add folder", e);
      throw e;
    }
  }, [loadData]);

  const deleteFolder = useCallback(async (id: string) => {
    try {
      await invoke("delete_tag_folder_from_db", { id });
      await loadData();
    } catch (e) {
      console.error("Failed to delete folder", e);
      throw e;
    }
  }, [loadData]);

  const renameFolder = useCallback(async (id: string, newName: string) => {
    try {
      await invoke("rename_tag_folder", { id, newName });
      await loadData();
    } catch (e) {
      console.error("Failed to rename folder", e);
      throw e;
    }
  }, [loadData]);

  const moveTag = useCallback(async (tagId: string, targetFolderId: string) => {
    try {
      await invoke("move_tag_to_folder", { id: tagId, folderId: targetFolderId });
      await loadData();
    } catch (e) {
      console.error("Failed to move tag", e);
      throw e;
    }
  }, [loadData]);

  const toggleFolder = useCallback(async (folderId: string, enabled: boolean) => {
    try {
      await invoke("toggle_folder_in_db", { folderId, enabled });
      await loadData();
    } catch (e) {
      console.error("Failed to toggle folder", e);
      throw e;
    }
  }, [loadData]);

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
