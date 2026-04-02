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
  currentPort: number | null;
  pausedIds: string[];
  resumeBreakpoint: (id: string) => Promise<void>;
  openNewWindow: (context: string, title: string) => Promise<void>;
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
      clearData: () => { },
      currentPort: null,
      pausedIds: [],
      resumeBreakpoint: async () => { },
      openNewWindow: async () => { },
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
  const [isRun, setIsRun] = useState(true);
  const [currentPort, setCurrentPort] = useState<number | null>(null);
  const [pausedIds, setPausedIds] = useState<string[]>([]);
  const { setTrafficList, setTrafficSet, setSelections } = useTrafficListContext();

  useEffect(() => {
    const handleProxy = async () => {
      const port = await activeProvider.setListenStatus(isRun);
      if (isRun && typeof port === 'number') {
        setCurrentPort(port);
      } else if (!isRun) {
        setCurrentPort(null);
      }
    };
    handleProxy();
  }, [activeProvider, isRun]);

  const fetchPausedBreakpoints = useCallback(async () => {
    try {
      const ids = await activeProvider.getPausedBreakpoints();
      setPausedIds(ids);
    } catch (e) {
      console.error("Failed to fetch paused breakpoints:", e);
    }
  }, [activeProvider]);

  useEffect(() => {
    fetchPausedBreakpoints();
  }, [fetchPausedBreakpoints]);

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

  useEffect(() => {
    const unlistenHit = listen<string>("breakpoint_hit", (event) => {
      setPausedIds(prev => [...prev, event.payload]);
    });

    return () => {
      unlistenHit.then(f => f());
    };
  }, []);

  useEffect(() => {
    const unlistenResumed = listen<string>("breakpoint_resumed", (event) => {
      setPausedIds(prev => prev.filter(p => p !== event.payload));
    });

    return () => {
      unlistenResumed.then(f => f());
    };
  }, []);

  const resumeBreakpoint = useCallback(async (id: string) => {
    try {
      await activeProvider.resumeBreakpoint(id);
      // We don't need to manually filter here because breakpoint_resumed will trigger it
      // but doing it here makes UI snappier
      setPausedIds(prev => prev.filter(p => p !== id));
    } catch (e) {
      console.error("Failed to resume breakpoint:", e);
    }
  }, [activeProvider]);

  const openNewWindow = useCallback(async (context: string, title: string) => {
    await activeProvider.openNewWindow(context, title);
  }, [activeProvider]);

  return (
    <TauriEnvContext.Provider value={{
      provider: activeProvider,
      isRun,
      setIsRun,
      clearData,
      currentPort,
      pausedIds,
      resumeBreakpoint,
      openNewWindow,
    }}>
      {children}
    </TauriEnvContext.Provider>
  );
};
