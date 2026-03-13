import React, { useState, useEffect, useContext, ReactNode } from "react";
import { downloadDir, documentDir } from "@tauri-apps/api/path";
import { mkdir, BaseDirectory } from "@tauri-apps/plugin-fs";
import { type as getOsType } from "@tauri-apps/plugin-os";
import tauriConfJson from "../../src-tauri/tauri.conf.json";

declare global {
  interface Window {
    __TAURI_CTX__?: any;
  }
}

export const APP_NAME = tauriConfJson.productName;
export const RUNNING_IN_TAURI = (window as any).__TAURI_INTERNALS__ !== undefined;

// NOTE: Add cacheable Tauri calls in this file
interface TauriContextInterface {
  loading: boolean;
  downloads: string | undefined;
  documents: string | undefined;
  appDocuments: string | undefined;
  osType: string | undefined;
  fileSep: string;
}

const TauriContext = React.createContext<TauriContextInterface | undefined>(
  undefined
);

export const useTauriContext = () => useContext(TauriContext);

export function TauriProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [downloads, setDownloadDir] = useState<string | undefined>();
  const [documents, setDocumentDir] = useState<string | undefined>();
  const [osType, setOsType] = useState<string | undefined>();
  const [fileSep, setFileSep] = useState<string>("/");
  const [appDocuments, setAppDocuments] = useState<string | undefined>();

  useEffect(() => {
    if (RUNNING_IN_TAURI) {
      const callTauriAPIs = async () => {
        setDownloadDir(await downloadDir());
        const _documents = await documentDir();
        console.log("documents", _documents);
        setDocumentDir(_documents);
        const _osType = await getOsType();
        setOsType(_osType);
        const _fileSep = _osType === "windows" ? "\\" : "/";
        setFileSep(_fileSep);
        
        try {
          await mkdir(APP_NAME, {
            baseDir: BaseDirectory.Document,
            recursive: true,
          });
        } catch (e) {
          console.error("Failed to create app directory", e);
        }
        
        setAppDocuments(`${_documents}/${APP_NAME}`);
        console.log("appDocuments", `${_documents}/${APP_NAME}`);
        setLoading(false);
      };
      callTauriAPIs().catch(console.error);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <TauriContext.Provider
      value={{ loading, fileSep, downloads, documents, osType, appDocuments }}
    >
      {children}
    </TauriContext.Provider>
  );
}
