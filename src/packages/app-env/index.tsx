import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { IAppProvider, TauriAppProvider, MockAppProvider } from "./AppProvider";

export interface IAppProviderContext {
  provider: IAppProvider;
}

export const TauriEnvContext = createContext<IAppProviderContext | undefined>(
  undefined
);

export const getAppProvider = (): IAppProvider => {
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    return new TauriAppProvider();
  }
  return new MockAppProvider();
};

export const useAppProvider = (): IAppProviderContext => {
  const context = useContext(TauriEnvContext);
  if (!context) {
    const defaultProvider = getAppProvider();
    return { provider: defaultProvider };
  }
  return context;
};

interface TauriEnvProviderProps {
  children: ReactNode;
  provider?: IAppProvider;
}

export const TauriEnvProvider: React.FC<TauriEnvProviderProps> = ({
  children,
  provider,
}) => {
  const activeProvider = useMemo(() => provider || getAppProvider(), [provider]);
  
  return (
    <TauriEnvContext.Provider value={{ provider: activeProvider }}>
      {children}
    </TauriEnvContext.Provider>
  );
};
