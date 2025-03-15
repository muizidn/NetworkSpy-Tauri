import React, { createContext, useContext, ReactNode } from "react";
import { InvokeArgs } from "@tauri-apps/api/tauri";

export type TauriInvokeFn = <T>(cmd: string, args?: InvokeArgs) => Promise<T>;

export const TauriEnvContext = createContext<UseTauriValue | undefined>(
  undefined
);

interface UseTauriValue {
  invoke: TauriInvokeFn;
}

export const useTauri = (): UseTauriValue => {
  const context = useContext(TauriEnvContext);
  if (!context) {
    throw new Error("useTauri must be used within a TauriEnvProvider");
  }
  return context;
};

interface TauriEnvProviderProps {
  children: ReactNode;
  invokeFn: TauriInvokeFn;
}

export const TauriEnvProvider: React.FC<TauriEnvProviderProps> = ({
  children,
  invokeFn,
}) => {
  return (
    <TauriEnvContext.Provider value={{ invoke: invokeFn }}>
      {children}
    </TauriEnvContext.Provider>
  );
};
