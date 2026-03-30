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
}

export const SettingsContext = createContext<SettingsContextInterface>({
  theme: localStorage.getItem("theme") || "dark",
  setTheme: () => {},
  sizesCenterPane: [],
  setSizesCenterPane: () => {},
  showConnectMethod: localStorage.getItem("ns_show_connect_method") === "true",
  setShowConnectMethod: () => {},
});

export const useSettingsContext = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [sizesCenterPane, setSizesCenterPane] = useState(() => {
    const saved = localStorage.getItem("ns_center_pane_sizes");
    return saved ? JSON.parse(saved) : [0, 0];
  });
  const [showConnectMethod, setShowConnectMethod] = useState(false);

  useEffect(() => {
    // Load initial settings from SQLite via Rust
    invoke<{ show_connect_method: boolean }>("get_proxy_settings")
      .then((settings) => {
        if (settings) {
          setShowConnectMethod(settings.show_connect_method);
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
    // Only update if we are not in the middle of initial load 
    // (though update_proxy_settings is idempotent so it's fine)
    invoke("update_proxy_settings", { 
      new_settings: { show_connect_method: showConnectMethod } 
    }).catch(console.error);
  }, [showConnectMethod]);

  return (
    <SettingsContext.Provider
      value={{ 
        theme, 
        setTheme, 
        sizesCenterPane, 
        setSizesCenterPane,
        showConnectMethod,
        setShowConnectMethod 
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
