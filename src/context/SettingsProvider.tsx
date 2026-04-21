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
  mcpStdioEnabled: boolean;
  setMcpStdioEnabled: (enabled: boolean) => void;
  mcpHttpEnabled: boolean;
  setMcpHttpEnabled: (enabled: boolean) => void;
  mcpHttpPort: number;
  setMcpHttpPort: (port: number) => void;
  smartViewerMatch: boolean;
  setSmartViewerMatch: (enabled: boolean) => void;
  plan: string | null;
  isVerified: boolean;
  apiFeatures: any | null;
  verifyLicense: (key: string) => Promise<any>;
  revokeLicense: () => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextInterface>({
  theme: "dark",
  setTheme: () => { },
  sizesCenterPane: [],
  setSizesCenterPane: () => { },
  showConnectMethod: false,
  setShowConnectMethod: () => { },
  streamCertificateLogs: false,
  setStreamCertificateLogs: () => { },
  mcpStdioEnabled: false,
  setMcpStdioEnabled: () => { },
  mcpHttpEnabled: false,
  setMcpHttpEnabled: () => { },
  mcpHttpPort: 3001,
  setMcpHttpPort: () => { },
  smartViewerMatch: false,
  setSmartViewerMatch: () => { },
  plan: null,
  isVerified: false,
  apiFeatures: null,
  verifyLicense: async () => { },
  revokeLicense: async () => { }
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
  const [mcpStdioEnabled, setMcpStdioEnabled] = useState(false);
  const [mcpHttpEnabled, setMcpHttpEnabled] = useState(false);
  const [mcpHttpPort, setMcpHttpPort] = useState(3001);
  const [smartViewerMatch, setSmartViewerMatch] = useState(() => {
    return localStorage.getItem("ns_smart_viewer_match") === "true";
  });
  const [plan, setPlan] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [apiFeatures, setApiFeatures] = useState<any | null>(null);

  const verifyLicense = async (key: string | null = null) => {
    try {
      const result: any = await invoke("verify_license", { licenseKey: key });
      if (result.success) {
        setIsVerified(true);
        setPlan(result.plan);
        setApiFeatures(result.features || null);
      } else {
        setIsVerified(false);
        setPlan(null);
        setApiFeatures(null);
      }
      return result;
    } catch (e) {
      console.error("License verification failed", e);
      setIsVerified(false);
      setPlan(null);
      setApiFeatures(null);
      throw e;
    }
  };

  const revokeLicense = async () => {
    try {
      await invoke("revoke_license_from_keychain");
      setIsVerified(false);
      setPlan(null);
      setApiFeatures(null);
    } catch (e) {
      console.error("Failed to revoke license", e);
    }
  };

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    invoke<{
      show_connect_method: boolean;
      stream_certificate_logs: boolean;
      mcp_stdio_enabled: boolean;
      mcp_http_enabled: boolean;
      mcp_http_port: number;
      license_key: string;
    }>("get_proxy_settings")
      .then((settings) => {
        if (settings) {
          setShowConnectMethod(settings.show_connect_method);
          setStreamCertificateLogs(settings.stream_certificate_logs);
          setMcpStdioEnabled(settings.mcp_stdio_enabled);
          setMcpHttpEnabled(settings.mcp_http_enabled);
          setMcpHttpPort(settings.mcp_http_port);

          // Try silent verify (uses keychain on backend)
          verifyLicense(null).catch(() => { });

          setIsLoaded(true);
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
    localStorage.setItem("ns_smart_viewer_match", String(smartViewerMatch));
  }, [smartViewerMatch]);

  useEffect(() => {
    if (!isLoaded) return;

    invoke("update_proxy_settings", {
      newSettings: {
        show_connect_method: showConnectMethod,
        stream_certificate_logs: streamCertificateLogs,
        mcp_stdio_enabled: mcpStdioEnabled,
        mcp_http_enabled: mcpHttpEnabled,
        mcp_http_port: mcpHttpPort
      }
    }).catch(console.error);
  }, [showConnectMethod, streamCertificateLogs, mcpStdioEnabled, mcpHttpEnabled, mcpHttpPort, isLoaded]);

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
        setStreamCertificateLogs,
        mcpStdioEnabled,
        setMcpStdioEnabled,
        mcpHttpEnabled,
        setMcpHttpEnabled,
        mcpHttpPort,
        setMcpHttpPort,
        smartViewerMatch,
        setSmartViewerMatch,
        plan,
        isVerified,
        apiFeatures,
        verifyLicense,
        revokeLicense,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
