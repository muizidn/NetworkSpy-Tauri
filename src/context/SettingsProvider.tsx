import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";

interface SettingsContextInterface {
  theme: string;
  setTheme: (theme: string) => void;
  sizesCenterPane: number[];
  setSizesCenterPane: (sizesCenterPane: number[]) => void;
  showConnectMethod: boolean;
  setShowConnectMethod: (show: boolean) => void;
  streamCertificateLogs: boolean;
  setStreamCertificateLogs: (stream: boolean) => void;
}

export const SettingsContext = createContext<SettingsContextInterface>({
  theme: "dark",
  setTheme: () => {},
  sizesCenterPane: [],
  setSizesCenterPane: () => {},
  showConnectMethod: false,
  setShowConnectMethod: () => {},
  streamCertificateLogs: false,
  setStreamCertificateLogs: () => {},
});

export const useSettingsContext = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [sizesCenterPane, setSizesCenterPane] = useState(() => {
    const saved = localStorage.getItem("ns_center_pane_sizes");
    return saved ? JSON.parse(saved) : [0, 0];
  });
  const [showConnectMethod, setShowConnectMethod] = useState(false);
  const [streamCertificateLogs, setStreamCertificateLogs] = useState(false);

  useEffect(() => {
    invoke<{ show_connect_method: boolean; stream_certificate_logs: boolean }>("get_proxy_settings")
      .then((settings) => {
        if (settings) {
          setShowConnectMethod(settings.show_connect_method);
          setStreamCertificateLogs(settings.stream_certificate_logs);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ns_center_pane_sizes", JSON.stringify(sizesCenterPane));
  }, [sizesCenterPane]);

  useEffect(() => {
    invoke("update_proxy_settings", { 
      new_settings: { 
        show_connect_method: showConnectMethod,
        stream_certificate_logs: streamCertificateLogs
      } 
    }).catch(console.error);
  }, [showConnectMethod, streamCertificateLogs]);

  return (
    <SettingsContext.Provider
      value={{ 
        theme, 
        setTheme, 
        sizesCenterPane, 
        setSizesCenterPane,
        showConnectMethod,
        setShowConnectMethod,
        streamCertificateLogs,
        setStreamCertificateLogs
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
