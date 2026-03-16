import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ViewerBlock {
  id: string;
  type: 'text' | 'json' | 'headers' | 'table' | 'html';
  title: string;
  code: string;
  html?: string;
  css?: string;
  padding?: number;
}

export interface ViewerContent {
  blocks: ViewerBlock[];
  previewConfig?: {
    testSource: 'live' | 'session';
    selectedSessionId?: string;
    filter?: string;
    selectedTrafficId?: string;
  };
}

export interface Viewer {
  id: string;
  name: string;
  folderId?: string;
  content: string; // JSON string of ViewerContent
  createdAt: string;
}

export interface ViewerFolder {
  id: string;
  name: string;
}

interface ViewerContextState {
  viewers: Viewer[];
  folders: ViewerFolder[];
  saveViewer: (name: string, content: string, id?: string, folderId?: string) => Promise<Viewer>;
  deleteViewer: (id: string) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  moveViewer: (id: string, folderId: string | null) => Promise<void>;
  loadData: () => Promise<void>;
}

const ViewerContext = createContext<ViewerContextState | undefined>(undefined);

export const useViewerContext = () => {
  const context = useContext(ViewerContext);
  if (!context) {
    throw new Error("useViewerContext must be used within a ViewerProvider");
  }
  return context;
};

export const ViewerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [folders, setFolders] = useState<ViewerFolder[]>([]);

  const loadData = useCallback(async () => {
    try {
      const fetchedViewers = await invoke<Viewer[]>("get_custom_viewers");
      const fetchedFolders = await invoke<ViewerFolder[]>("get_viewer_folders");
      setViewers(fetchedViewers);
      setFolders(fetchedFolders);
    } catch (e) {
      console.error("Failed to load viewers from DB:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveViewer = async (name: string, content: string, id?: string, folderId?: string) => {
    const viewer = await invoke<Viewer>("save_custom_viewer", { name, content, id: id || null, folderId: folderId || null });
    await loadData();
    return viewer;
  };

  const deleteViewer = async (id: string) => {
    await invoke("delete_custom_viewer", { id });
    await loadData();
  };

  const addFolder = async (name: string) => {
    await invoke("create_viewer_folder", { name });
    await loadData();
  };

  const deleteFolder = async (id: string) => {
    await invoke("delete_viewer_folder", { id });
    await loadData();
  };

  const renameFolder = async (id: string, newName: string) => {
    await invoke("rename_viewer_folder", { id, newName });
    await loadData();
  };

  const moveViewer = async (id: string, folderId: string | null) => {
    await invoke("move_viewer_to_folder", { id, folderId });
    await loadData();
  };

  return (
    <ViewerContext.Provider value={{
      viewers,
      folders,
      saveViewer,
      deleteViewer,
      addFolder,
      deleteFolder,
      renameFolder,
      moveViewer,
      loadData
    }}>
      {children}
    </ViewerContext.Provider>
  );
};
