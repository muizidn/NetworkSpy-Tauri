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
  const [sizesCenterPane, setSizesCenterPane] = useState([300, 580]);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <SettingsContext.Provider
      value={{ theme, setTheme, sizesCenterPane, setSizesCenterPane }}>
      {children}
    </SettingsContext.Provider>
  );
};
