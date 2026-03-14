import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { TrafficItemMap } from "../model/TrafficItemMap";
import { Traffic } from "../../../models/Traffic";

export type TrafficListSelection = {
  firstSelected: TrafficItemMap | null;
  others: TrafficItemMap[] | null;
};

export interface TrafficListContextState {
  trafficList: TrafficItemMap[];
  setTrafficList: React.Dispatch<React.SetStateAction<TrafficItemMap[]>>;
  trafficSet: { [key: string]: Traffic };
  setTrafficSet: React.Dispatch<
    React.SetStateAction<{ [key: string]: Traffic }>
  >;
  selections: TrafficListSelection;
  setSelections: (selections: TrafficListSelection) => void;
}

export const TrafficListContext = createContext<
  TrafficListContextState | undefined
>(undefined);

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
  const [selections, _setSelections] = useState<TrafficListSelection>({
    firstSelected: null,
    others: null,
  });

  function setSelections(selections: TrafficListSelection) {
    _setSelections(selections);
  }

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
