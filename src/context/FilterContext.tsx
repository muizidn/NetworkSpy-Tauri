import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";

export const FilterTypes = {
  URL: "URL",
  Method: "Method",
  Status: "Status",
  Client: "Client",
  Code: "Code",
  Time: "Time",
  Duration: "Duration",
  RequestSize: "Request Size",
  ResponseSize: "Response Size",
  Performance: "Performance",
  Intercepted: "Intercepted",
  Tags: "Tags",
  ID: "ID",
} as const;

export const FilterOperators = {
  Contains: "Contains",
  NotContains: "Not Contains",
  StartsWith: "Starts with",
  EndsWith: "Ends with",
  Equals: "Equals",
  NotEquals: "Not Equals",
  GreaterThan: "Greater Than",
  LessThan: "Less Than",
  MatchesRegex: "Matches Regex"
} as const;

export type FilterType = typeof FilterTypes[keyof typeof FilterTypes];
export type FilterOperator = typeof FilterOperators[keyof typeof FilterOperators];

export interface FilterRule {
  isGroup: false;
  id: string;
  enabled: boolean;
  type: FilterType;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  isGroup: true;
  id: string;
  enabled: boolean;
  logic: "AND" | "OR";
  children: FilterNode[];
}

export type FilterNode = FilterRule | FilterGroup;

export interface PredefinedFilter {
  id: string;
  name: string;
  filters: FilterNode[];
  isBuiltIn?: boolean;
}

interface FilterContextState {
  filters: FilterNode[];
  setFilters: React.Dispatch<React.SetStateAction<FilterNode[]>>;
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
  { id: "http", name: "HTTP", filters: [{ isGroup: false, id: "built-in-http", enabled: true, type: FilterTypes.URL, operator: FilterOperators.StartsWith, value: "http:" }], isBuiltIn: true },
  { id: "https", name: "HTTPS", filters: [{ isGroup: false, id: "built-in-https", enabled: true, type: FilterTypes.URL, operator: FilterOperators.StartsWith, value: "https:" }], isBuiltIn: true },
];

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { trafficList } = useTrafficListContext();
  const [filters, setFilters] = useState<FilterNode[]>([]);
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

  const parseNumericValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (typeof val !== 'string') return 0;
    const match = val.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const parseTimeValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const str = val.toLowerCase().trim();
    const match = str.match(/([\d.]+)\s*(ms|s|m|h)?/);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2];
    switch (unit) {
      case 's': return num * 1000;
      case 'm': return num * 60000;
      case 'h': return num * 3600000;
      case 'ms':
      default: return num;
    }
  };

  const parseSizeValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const str = val.toLowerCase().trim();
    const match = str.match(/([\d.]+)\s*(gb|mb|kb|k|m|g|b)?/);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    let unit = match[2];
    if (unit === 'k') unit = 'kb';
    if (unit === 'm') unit = 'mb';
    if (unit === 'g') unit = 'gb';
    switch (unit) {
      case 'kb': return num * 1024;
      case 'mb': return num * 1024 * 1024;
      case 'gb': return num * 1024 * 1024 * 1024;
      case 'b':
      default: return num;
    }
  };

  const evaluateRule = (traffic: TrafficItemMap, filter: FilterRule): boolean => {
    if (!filter.enabled || !filter.value) return true;

    let targetValue: any = "";
    switch (filter.type) {
      case "URL": targetValue = traffic.url; break;
      case "Method": targetValue = traffic.method; break;
      case "Status": targetValue = traffic.status; break;
      case "Client": targetValue = traffic.client; break;
      case "Code": targetValue = traffic.code; break;
      case "Time": targetValue = traffic.time; break;
      case "Duration": targetValue = traffic.duration; break;
      case "Request Size": targetValue = traffic.request; break;
      case "Response Size": targetValue = traffic.response; break;
      case "Performance": targetValue = traffic.performance; break;
      case "Intercepted": targetValue = traffic.intercepted; break;
      case "Tags": targetValue = traffic.tags; break;
      case "ID": targetValue = traffic.id; break;
      default: return true;
    }

    // Special handling for Tags (string array)
    if (filter.type === "Tags" && Array.isArray(targetValue)) {
      const val = filter.value.toLowerCase();
      switch (filter.operator) {
        case FilterOperators.Contains:
          return targetValue.some(t => t.toLowerCase().includes(val));
        case FilterOperators.Equals:
          return targetValue.some(t => t.toLowerCase() === val);
        case FilterOperators.NotEquals:
          return !targetValue.some(t => t.toLowerCase() === val);
        case FilterOperators.StartsWith:
          return targetValue.some(t => t.toLowerCase().startsWith(val));
        case FilterOperators.EndsWith:
          return targetValue.some(t => t.toLowerCase().endsWith(val));
        default:
          return true;
      }
    }

    const valStr = filter.value.toLowerCase();
    const targetStr = String(targetValue || "").toLowerCase();

    // Standard string operators (Contains, Equals, etc.)
    const stringOperators: string[] = [
      FilterOperators.Contains,
      FilterOperators.NotContains,
      FilterOperators.StartsWith,
      FilterOperators.EndsWith,
      FilterOperators.Equals,
      FilterOperators.NotEquals,
      FilterOperators.MatchesRegex
    ];

    if (stringOperators.includes(filter.operator)) {
      switch (filter.operator) {
        case FilterOperators.Contains: return targetStr.includes(valStr);
        case FilterOperators.NotContains: return !targetStr.includes(valStr);
        case FilterOperators.StartsWith: return targetStr.startsWith(valStr);
        case FilterOperators.EndsWith: return targetStr.endsWith(valStr);
        case FilterOperators.Equals: return targetStr === valStr;
        case FilterOperators.NotEquals: return targetStr !== valStr;
        case FilterOperators.MatchesRegex:
          try { return new RegExp(filter.value, "i").test(targetStr); } catch { return true; }
        default: return true;
      }
    }

    // Numeric and unit-aware operators (GreaterThan, LessThan)
    if (filter.operator === FilterOperators.GreaterThan || filter.operator === FilterOperators.LessThan) {
      let tNum = 0;
      let fNum = 0;

      if (filter.type === "Duration" || filter.type === "Time") {
        tNum = parseTimeValue(targetValue);
        fNum = parseTimeValue(filter.value);
      } else if (filter.type === "Request Size" || filter.type === "Response Size") {
        tNum = parseSizeValue(targetValue);
        fNum = parseSizeValue(filter.value);
      } else {
        tNum = parseNumericValue(targetValue);
        fNum = parseNumericValue(filter.value);
      }

      return filter.operator === FilterOperators.GreaterThan ? tNum > fNum : tNum < fNum;
    }

    return true;
  };

  const evaluateNode = (traffic: TrafficItemMap, node: FilterNode): boolean => {
    if (!node.enabled) return true;
    if (!node.isGroup) {
      return evaluateRule(traffic, node);
    }
    
    // Group evaluation
    const children = node.children;
    if (children.length === 0) return true;
    
    // Filter active children to evaluate
    const activeChildren = children.filter(c => c.enabled);
    if (activeChildren.length === 0) return true;

    if (node.logic === "AND") {
      return activeChildren.every(c => evaluateNode(traffic, c));
    } else {
      return activeChildren.some(c => evaluateNode(traffic, c));
    }
  };

  const filteredTraffic = useMemo(() => {
    // Collect all active predefined filtered arrays
    const activePredefinedFilters = predefinedFilters
      .filter(p => activePredefinedIds.includes(p.id))
      .flatMap(p => p.filters);

    return trafficList.filter((t) => {
      // Must pass ALL root manual filters (implicit AND)
      const passesManual = filters.every((f) => evaluateNode(t, f));
      if (!passesManual) return false;

      // Must pass ALL active predefined filters
      return activePredefinedFilters.every((f) => evaluateNode(t, f));
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
