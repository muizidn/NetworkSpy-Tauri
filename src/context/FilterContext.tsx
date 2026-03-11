import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";

export type FilterType = "URL" | "Method" | "Status" | "Header";
export type FilterOperator = "Contains" | "Starts with" | "Ends with" | "Equals" | "Matches Regex";

export interface Filter {
  id: string;
  enabled: boolean;
  type: FilterType;
  operator: FilterOperator;
  value: string;
}

interface FilterContextState {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  filteredTraffic: TrafficItemMap[];
}

const FilterContext = createContext<FilterContextState | undefined>(undefined);

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { trafficList } = useTrafficListContext();
  const [filters, setFilters] = useState<Filter[]>([]);

  const applyFilter = (traffic: TrafficItemMap, filter: Filter): boolean => {
    if (!filter.enabled || !filter.value) return true;

    let targetValue = "";
    switch (filter.type) {
      case "URL":
        targetValue = String(traffic["url"] || "");
        break;
      case "Method":
        targetValue = String(traffic["method"] || "");
        break;
      case "Status":
        targetValue = String(traffic["status"] || "");
        break;
      default:
        return true;
    }

    const val = filter.value.toLowerCase();
    const target = targetValue.toLowerCase();

    switch (filter.operator) {
      case "Contains":
        return target.includes(val);
      case "Starts with":
        return target.startsWith(val);
      case "Ends with":
        return target.endsWith(val);
      case "Equals":
        return target === val;
      case "Matches Regex":
        try {
          return new RegExp(filter.value, "i").test(targetValue);
        } catch {
          return true;
        }
      default:
        return true;
    }
  };

  const filteredTraffic = useMemo(() => {
    return trafficList.filter((t) => {
      return filters.every((f) => applyFilter(t, f));
    });
  }, [trafficList, filters]);

  return (
    <FilterContext.Provider value={{ filters, setFilters, filteredTraffic }}>
      {children}
    </FilterContext.Provider>
  );
};
