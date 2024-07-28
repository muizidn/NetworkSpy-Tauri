import React, { createContext, useContext, useState, ReactNode } from "react";
import { TrafficItemMap } from "../model/TrafficItemMap";
import { Traffic } from "../../../models/Traffic";

interface TrafficListContextState {
  trafficList: TrafficItemMap[];
  setTrafficList: React.Dispatch<React.SetStateAction<TrafficItemMap[]>>;
  trafficSet: { [key: string]: Traffic };
  setTrafficSet: React.Dispatch<
    React.SetStateAction<{ [key: string]: Traffic }>
  >;
  selections: string[];
  setSelections: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [trafficList, setTrafficList] = useState<TrafficItemMap[]>([]);
  const [trafficSet, setTrafficSet] = useState<{ [key: string]: Traffic }>({});
  const [selections, setSelections] = useState<string[]>([]);

  return (
    <TrafficListContext.Provider
      value={{
        trafficList,
        setTrafficList,
        trafficSet,
        setTrafficSet,
        selections,
        setSelections,
      }}
    >
      {children}
    </TrafficListContext.Provider>
  );
};
