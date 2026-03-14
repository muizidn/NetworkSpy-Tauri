import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";

interface SettingsContextInterface {
  theme: string;
  setTheme: (theme: string) => void;
  sizesCenterPane: number[];
  setSizesCenterPane: (sizesCenterPane: number[]) => void;
}

export const SettingsContext = createContext<SettingsContextInterface>({
  theme: localStorage.getItem("theme") || "dark",
  setTheme: () => {},
  sizesCenterPane: [],
  setSizesCenterPane: () => {},
});

export const useSettingsContext = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [sizesCenterPane, setSizesCenterPane] = useState(() => {
    const saved = localStorage.getItem("ns_center_pane_sizes");
    return saved ? JSON.parse(saved) : [0, 0];
  });

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ns_center_pane_sizes", JSON.stringify(sizesCenterPane));
  }, [sizesCenterPane]);

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, sizesCenterPane, setSizesCenterPane }}>
      {children}
    </SettingsContext.Provider>
  );
};
