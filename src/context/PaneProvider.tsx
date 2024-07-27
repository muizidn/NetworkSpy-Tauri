import React, { createContext, useContext, useState } from "react";

export interface PaneState {
  left: boolean;
  bottom: boolean;
  right: boolean;
}

interface PaneContextType {
  isDisplayPane: PaneState;
  setIsDisplayPane: React.Dispatch<React.SetStateAction<PaneState>>;
}

const PaneContext = createContext<PaneContextType | undefined>(undefined);

export const usePaneContext = () => {
  const context = useContext(PaneContext);
  if (!context) {
    throw new Error("usePaneContext must be used within a PaneProvider");
  }
  return context;
};

export const PaneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDisplayPane, setIsDisplayPane] = useState<PaneState>({
    left: true,
    bottom: true,
    right: true,
  });

  return (
    <PaneContext.Provider value={{ isDisplayPane, setIsDisplayPane }}>
      {children}
    </PaneContext.Provider>
  );
};
