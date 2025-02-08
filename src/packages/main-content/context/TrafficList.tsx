import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
} from "react";
import { TrafficItemMap } from "../model/TrafficItemMap";
import { Traffic } from "../../../models/Traffic";

interface TrafficListContextState {
  trafficList: TrafficItemMap[];
  trafficListDisplay: TrafficItemMap[];
  setTrafficList: React.Dispatch<React.SetStateAction<TrafficItemMap[]>>;
  trafficSet: { [key: string]: Traffic };
  setTrafficSet: React.Dispatch<
    React.SetStateAction<{ [key: string]: Traffic }>
  >;
  selections: string[];
  setSelections: React.Dispatch<React.SetStateAction<string[]>>;
  filterByUrl: string;
  setFilterByUrl: React.Dispatch<React.SetStateAction<string>>;
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
  const [_filterByUrl, setFilterByUrl] = useState<string>("");

  const filterByUrlTrafficList = useMemo(() => {
    const filteredByUrl = trafficList.filter((t) => {
      if (_filterByUrl === "") {
        return true;
      }
      if (!t.url || t.url === "") {
        return false;
      }

      const trafficUrl = new URL(t.url as string);
      const trafficUrlJoined = `${trafficUrl.hostname}${trafficUrl.pathname}`
      return trafficUrlJoined.includes(_filterByUrl);
    });
    return filteredByUrl;
  }, [trafficList, _filterByUrl]);

  return (
    <TrafficListContext.Provider
      value={{
        trafficList,
        trafficListDisplay: filterByUrlTrafficList,
        setTrafficList,
        trafficSet,
        setTrafficSet,
        selections,
        setSelections,
        filterByUrl: _filterByUrl,
        setFilterByUrl,
      }}
    >
      {children}
    </TrafficListContext.Provider>
  );
};
