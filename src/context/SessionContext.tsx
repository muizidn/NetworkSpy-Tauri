import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";

export interface Session {
  id: string;
  name: string;
  folderId?: string;
  createdAt: string;
}

export interface SessionFolder {
  id: string;
  name: string;
}

interface SessionContextState {
  sessions: Session[];
  folders: SessionFolder[];
  isReviewMode: boolean;
  reviewedSession: Session | null;
  saveCapture: (name: string, folderId?: string) => Promise<Session>;
  importHar: (name: string, path: string, folderId?: string) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  renameFolder: (id: string, newName: string) => Promise<void>;
  moveSession: (id: string, folderId: string | null) => Promise<void>;
  viewSession: (session: Session | null) => Promise<TrafficItemMap[] | null>;
  exportSession: (id: string, format: string, path: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const SessionContext = createContext<SessionContextState | undefined>(undefined);

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [folders, setFolders] = useState<SessionFolder[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewedSession, setReviewedSession] = useState<Session | null>(null);

  const loadData = useCallback(async () => {
    try {
      const fetchedSessions = await invoke<Session[]>("get_saved_sessions");
      const fetchedFolders = await invoke<SessionFolder[]>("get_session_folders");
      setSessions(fetchedSessions);
      setFolders(fetchedFolders);
    } catch (e) {
      console.error("Failed to load sessions from DB:", e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveCapture = async (name: string, folderId?: string) => {
    const session = await invoke<Session>("save_capture_to_folder", { name, folderId: folderId || null });
    await loadData();
    return session;
  };

  const importHar = async (name: string, path: string, folderId?: string) => {
    const session = await invoke<Session>("import_session_to_folder", { name, path, folderId: folderId || null });
    await loadData();
    return session;
  };

  const deleteSession = async (id: string) => {
    await invoke("delete_saved_session", { id });
    if (reviewedSession?.id === id) {
       setIsReviewMode(false);
       setReviewedSession(null);
    }
    await loadData();
  };

  const addFolder = async (name: string) => {
    await invoke("create_session_folder", { name });
    await loadData();
  };

  const deleteFolder = async (id: string) => {
    await invoke("delete_session_folder", { id });
    await loadData();
  };

  const renameFolder = async (id: string, newName: string) => {
    await invoke("rename_session_folder", { id, newName });
    await loadData();
  };

  const moveSession = async (id: string, folderId: string | null) => {
    await invoke("move_session_to_folder", { id, folderId });
    await loadData();
  };

  const viewSession = async (session: Session | null) => {
    if (!session) {
      setIsReviewMode(false);
      setReviewedSession(null);
      return null;
    }

    try {
      // Fetch the traffic data for this session
      const traffic = await invoke<any[]>("get_session_traffic", { id: session.id });
      
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      const mappedTraffic: TrafficItemMap[] = traffic.map(t => ({
        id: t.id,
        tags: JSON.parse(t.tags || "[]"),
        url: t.uri || "-",
        client: t.client || "Local",
        method: t.method || "-",
        code: t.status_code?.toString() || "-",
        time: t.timestamp, // In sessions, timestamp is the display time
        duration: "0 ms", // We don't store duration separately in the basic metadata yet
        request: "0 B", // Needs improvement if sizes are needed
        response: "0 B",
        intercepted: t.intercepted,
        timestamp: new Date(t.timestamp).getTime(),
      }));

      setReviewedSession(session);
      setIsReviewMode(true);
      return mappedTraffic;
    } catch (e) {
      console.error("Failed to view session", e);
      throw e;
    }
  };

  const exportSession = async (id: string, format: string, path: string) => {
    await invoke("export_session_data", { id, format, path });
  };

  return (
    <SessionContext.Provider value={{
      sessions,
      folders,
      isReviewMode,
      reviewedSession,
      saveCapture,
      importHar,
      deleteSession,
      addFolder,
      deleteFolder,
      renameFolder,
      moveSession,
      viewSession,
      exportSession,
      loadData
    }}>
      {children}
    </SessionContext.Provider>
  );
};
