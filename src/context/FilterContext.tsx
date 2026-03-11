import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";

export type FilterType = "URL" | "Method" | "Status" | "Header" | "Content-Type";
export type FilterOperator = "Contains" | "Starts with" | "Ends with" | "Equals" | "Matches Regex";

export interface Filter {
  id: string;
  enabled: boolean;
  type: FilterType;
  operator: FilterOperator;
  value: string;
}

export interface PredefinedFilter {
  id: string;
  name: string;
  filters: Filter[];
  isBuiltIn?: boolean;
}

interface FilterContextState {
  filters: Filter[];
  setFilters: React.Dispatch<React.SetStateAction<Filter[]>>;
  predefinedFilters: PredefinedFilter[];
  activePredefinedIds: string[];
  togglePredefinedFilter: (id: string) => void;
  saveCurrentFilters: (name: string) => void;
  removePredefinedFilter: (id: string) => void;
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

const BUILT_IN_FILTERS: PredefinedFilter[] = [
  { id: "all", name: "All", filters: [], isBuiltIn: true },
  { id: "http", name: "HTTP", filters: [{ id: "built-in-http", enabled: true, type: "URL", operator: "Starts with", value: "http:" }], isBuiltIn: true },
  { id: "https", name: "HTTPS", filters: [{ id: "built-in-https", enabled: true, type: "URL", operator: "Starts with", value: "https:" }], isBuiltIn: true },
  { id: "json", name: "JSON", filters: [{ id: "built-in-json", enabled: true, type: "Content-Type", operator: "Contains", value: "json" }], isBuiltIn: true },
  { id: "images", name: "Images", filters: [{ id: "built-in-images", enabled: true, type: "Content-Type", operator: "Matches Regex", value: "(image|png|jpg|jpeg|gif)" }], isBuiltIn: true },
];

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { trafficList } = useTrafficListContext();
  const [filters, setFilters] = useState<Filter[]>([]);
  const [activePredefinedIds, setActivePredefinedIds] = useState<string[]>(["all"]);
  const [userFilters, setUserFilters] = useState<PredefinedFilter[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("user-predefined-filters") || "[]");
    } catch {
      return [];
    }
  });

  const predefinedFilters = useMemo(() => [...BUILT_IN_FILTERS, ...userFilters], [userFilters]);

  const togglePredefinedFilter = (id: string) => {
    if (id === "all") {
      setActivePredefinedIds(["all"]);
      return;
    }

    setActivePredefinedIds(prev => {
      const next = prev.filter(p => p !== "all");
      if (next.includes(id)) {
        const filtered = next.filter(p => p !== id);
        return filtered.length === 0 ? ["all"] : filtered;
      }
      return [...next, id];
    });
  };

  const saveCurrentFilters = (name: string) => {
    if (filters.length === 0) return;
    const newPredefined: PredefinedFilter = {
      id: `user-${Date.now()}`,
      name,
      filters: [...filters],
    };
    const nextUserFilters = [...userFilters, newPredefined];
    setUserFilters(nextUserFilters);
    localStorage.setItem("user-predefined-filters", JSON.stringify(nextUserFilters));
  };

  const removePredefinedFilter = (id: string) => {
    const nextUserFilters = userFilters.filter(f => f.id !== id);
    setUserFilters(nextUserFilters);
    localStorage.setItem("user-predefined-filters", JSON.stringify(nextUserFilters));
    setActivePredefinedIds(prev => prev.filter(p => p !== id));
  };

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
      case "Content-Type":
        targetValue = String(traffic["content_type"] || "");
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
    // Collect all unique filter rules from active predefined sets
    const activePredefinedFilters = predefinedFilters
      .filter(p => activePredefinedIds.includes(p.id))
      .flatMap(p => p.filters);

    return trafficList.filter((t) => {
      // Must pass ALL manual filters
      const passesManual = filters.every((f) => applyFilter(t, f));
      if (!passesManual) return false;

      // Must pass ALL active predefined filters (predefined filters are additive constraints)
      return activePredefinedFilters.every((f) => applyFilter(t, f));
    });
  }, [trafficList, filters, predefinedFilters, activePredefinedIds]);

  return (
    <FilterContext.Provider value={{ 
      filters, 
      setFilters, 
      predefinedFilters, 
      activePredefinedIds, 
      togglePredefinedFilter, 
      saveCurrentFilters,
      removePredefinedFilter,
      filteredTraffic 
    }}>
      {children}
    </FilterContext.Provider>
  );
};
