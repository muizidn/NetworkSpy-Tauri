import React, { createContext, useContext, useState, ReactNode } from "react";
import { TrafficItemMap } from "../model/TrafficItemMap";

interface TrafficListContextState {
  data: TrafficItemMap[];
  setData: React.Dispatch<React.SetStateAction<TrafficItemMap[]>>;
}

const TrafficListContext = createContext<TrafficListContextState | undefined>(
  undefined
);

export const useTrafficListContext = (): TrafficListContextState => {
  const context = useContext(TrafficListContext);
  if (context === undefined) {
    throw new Error(
      "useTrafficListContext must be used within a TrafficListProvider"
    );
  }
  return context;
};

interface TrafficListProviderProps {
  children: ReactNode;
}

export const TrafficListProvider: React.FC<TrafficListProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<TrafficItemMap[]>([]);

  return (
    <TrafficListContext.Provider value={{ data, setData }}>
      {children}
    </TrafficListContext.Provider>
  );
};
