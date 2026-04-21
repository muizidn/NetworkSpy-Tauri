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
  licenseKey: string;
  setLicenseKey: (key: string) => void;
  plan: string | null;
  isVerified: boolean;
  apiFeatures: any | null;
  verifyLicense: (key: string) => Promise<any>;
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
  mcpStdioEnabled: false,
  setMcpStdioEnabled: () => {},
  mcpHttpEnabled: false,
  setMcpHttpEnabled: () => {},
  mcpHttpPort: 3001,
  setMcpHttpPort: () => {},
  smartViewerMatch: false,
  setSmartViewerMatch: () => {},
  licenseKey: "",
  setLicenseKey: () => {},
  plan: null,
  isVerified: false,
  apiFeatures: null,
  verifyLicense: async () => {},
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
  const [licenseKey, setLicenseKey] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [apiFeatures, setApiFeatures] = useState<any | null>(null);

  const verifyLicense = async (key: string) => {
    console.log("DEBUG: verifyLicense starting for key:", key);
    try {
      const result: any = await invoke("verify_license", { licenseKey: key });
      console.log("DEBUG: verifyLicense result:", result);
      if (result.success) {
        setIsVerified(true);
        setPlan(result.plan);
        setLicenseKey(key);
        setApiFeatures(result.features || null);
      } else {
        setIsVerified(false);
        setPlan(null);
        setApiFeatures(null);
      }
      return result;
    } catch (e) {
      console.error("DEBUG: verifyLicense error:", e);
      setIsVerified(false);
      setPlan(null);
      setApiFeatures(null);
      throw e;
    }
  };

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
          setLicenseKey(settings.license_key);
          
          if (settings.license_key) {
            verifyLicense(settings.license_key).catch(() => {});
          }
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
    invoke("update_proxy_settings", { 
      newSettings: { 
        show_connect_method: showConnectMethod,
        stream_certificate_logs: streamCertificateLogs,
        mcp_stdio_enabled: mcpStdioEnabled,
        mcp_http_enabled: mcpHttpEnabled,
        mcp_http_port: mcpHttpPort,
        license_key: licenseKey
      } 
    }).catch(console.error);
  }, [showConnectMethod, streamCertificateLogs, mcpStdioEnabled, mcpHttpEnabled, mcpHttpPort, licenseKey]);

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
        licenseKey,
        setLicenseKey,
        plan,
        isVerified,
        apiFeatures,
        verifyLicense,
      }}>
      {children}
    </SettingsContext.Provider>
  );
};
