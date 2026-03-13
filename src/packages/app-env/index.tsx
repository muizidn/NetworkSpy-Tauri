import { listen } from "@tauri-apps/api/event";
import React, { createContext, useContext, ReactNode, useMemo, useState, useCallback, useEffect } from "react";
import { IAppProvider, TauriAppProvider, MockAppProvider } from "./AppProvider";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { RUNNING_IN_TAURI } from "@src/context/TauriProvider";

export interface IAppProviderContext {
  provider: IAppProvider;
  isRun: boolean;
  setIsRun: (isRun: boolean) => void;
  clearData: () => void;
}

export const TauriEnvContext = createContext<IAppProviderContext | undefined>(
  undefined
);

export const getAppProvider = (): IAppProvider => {
  if (RUNNING_IN_TAURI) {
    return new TauriAppProvider();
  }
  return new MockAppProvider();
};

export const useAppProvider = (): IAppProviderContext => {
  const context = useContext(TauriEnvContext);
  if (!context) {
    const defaultProvider = getAppProvider();
    return {
      provider: defaultProvider,
      isRun: false,
      setIsRun: () => { },
      clearData: () => { }
    };
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
  const [isRun, setIsRun] = useState(false);
  const { setTrafficList, setTrafficSet, setSelections } = useTrafficListContext();

  useEffect(() => {
    activeProvider.setListenStatus(isRun);
  }, [activeProvider, isRun]);

  const clearData = useCallback(() => {
    setTrafficList([]);
    setTrafficSet({});
    setSelections({ firstSelected: null, others: null });
  }, [setTrafficList, setTrafficSet, setSelections]);

  useEffect(() => {
    const unlisten = listen("traffic_cleared", async () => {
      await activeProvider.clearData();
      clearData();
    });
    return () => {
      unlisten.then(u => u());
    };
  }, [clearData]);

  return (
    <TauriEnvContext.Provider value={{
      provider: activeProvider,
      isRun,
      setIsRun,
      clearData
    }}>
      {children}
    </TauriEnvContext.Provider>
  );
};
