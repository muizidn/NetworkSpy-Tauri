import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from "react";
import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { 
  FilterNode, 
  FilterRule,
  FilterGroup,
  PredefinedFilter, 
  FilterType, 
  FilterOperator, 
  FilterTypes, 
  FilterOperators 
} from "@src/models/Filter";
import { useFilterPresetContext } from "./FilterPresetContext";

// Re-export for compatibility
export type { FilterNode, FilterRule, FilterGroup, PredefinedFilter, FilterType, FilterOperator };
export { FilterTypes, FilterOperators };

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

import { useAtom } from "jotai";
import { mainTrafficListFiltersAtom } from "@src/utils/trafficAtoms";

export const FilterProvider: React.FC<{ children: ReactNode; tabId?: string }> = ({ children, tabId = "global" }) => {
  const { trafficList } = useTrafficListContext();
  const [filters, setFilters] = useAtom(mainTrafficListFiltersAtom(tabId));
  
  const { 
    predefinedFilters, 
    addPreset, 
    removePreset 
  } = useFilterPresetContext();

  const [activePredefinedIds, setActivePredefinedIds] = useState<string[]>(["all"]);

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
    addPreset(name, [...filters]);
  };

  const removePredefinedFilter = (id: string) => {
    removePreset(id);
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

  const parseTimestampValue = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;

    // 1. Try standard date parsing
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.getTime();

    // 2. Try HH:mm:ss[.zzz] (Assume today)
    const match = val.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?/);
    if (match) {
      const date = new Date();
      date.setHours(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), parseInt(match[4] || "0"));
      return date.getTime();
    }

    return 0;
  };

  const evaluateRule = (traffic: TrafficItemMap, filter: FilterRule): boolean => {
    if (!filter.enabled || !filter.value) return true;

    // Backward compatibility normalization (Human Readable -> CONSTANT_UPPERCASE)
    const normalizedType = filter.type.toUpperCase().replace(/\s+/g, '_');
    const normalizedOp = filter.operator.toUpperCase().replace(/\s+/g, '_');

    let targetValue: any = "";
    switch (normalizedType) {
      case FilterTypes.URL: targetValue = traffic.url; break;
      case FilterTypes.METHOD: targetValue = traffic.method; break;
      case FilterTypes.STATUS: targetValue = traffic.status; break;
      case FilterTypes.CLIENT: targetValue = traffic.client; break;
      case FilterTypes.CODE: targetValue = traffic.code; break;
      case FilterTypes.TIME: targetValue = traffic.time; break;
      case FilterTypes.DURATION: targetValue = traffic.duration; break;
      case FilterTypes.REQUEST_SIZE: targetValue = traffic.request; break;
      case FilterTypes.RESPONSE_SIZE: targetValue = traffic.response; break;
      case FilterTypes.PERFORMANCE: targetValue = traffic.performance; break;
      case FilterTypes.SSL: targetValue = traffic.intercepted; break;
      case FilterTypes.TAGS: targetValue = traffic.tags; break;
      case FilterTypes.ID: targetValue = traffic.id; break;
      default: return true;
    }

    // Special handling for Tags (string array)
    if (normalizedType === FilterTypes.TAGS && Array.isArray(targetValue)) {
      const val = filter.value.toLowerCase();
      switch (normalizedOp) {
        case FilterOperators.CONTAINS:
          return targetValue.some(t => t.toLowerCase().includes(val));
        case FilterOperators.EQUALS:
          return targetValue.some(t => t.toLowerCase() === val);
        case FilterOperators.NOT_EQUALS:
          return !targetValue.some(t => t.toLowerCase() === val);
        case FilterOperators.STARTS_WITH:
          return targetValue.some(t => t.toLowerCase().startsWith(val));
        case FilterOperators.ENDS_WITH:
          return targetValue.some(t => t.toLowerCase().endsWith(val));
        default:
          return true;
      }
    }

    const valStr = filter.value.toLowerCase();
    const targetStr = String(targetValue || "").toLowerCase();

    // Standard string operators (Contains, Equals, etc.)
    const stringOperators: string[] = [
      FilterOperators.CONTAINS,
      FilterOperators.NOT_CONTAINS,
      FilterOperators.STARTS_WITH,
      FilterOperators.ENDS_WITH,
      FilterOperators.EQUALS,
      FilterOperators.NOT_EQUALS,
      FilterOperators.MATCHES_REGEX
    ];

    if (stringOperators.includes(normalizedOp)) {
      switch (normalizedOp) {
        case FilterOperators.CONTAINS: return targetStr.includes(valStr);
        case FilterOperators.NOT_CONTAINS: return !targetStr.includes(valStr);
        case FilterOperators.STARTS_WITH: return targetStr.startsWith(valStr);
        case FilterOperators.ENDS_WITH: return targetStr.endsWith(valStr);
        case FilterOperators.EQUALS: return targetStr === valStr;
        case FilterOperators.NOT_EQUALS: return targetStr !== valStr;
        case FilterOperators.MATCHES_REGEX:
          try { return new RegExp(filter.value, "i").test(targetStr); } catch { return true; }
        default: return true;
      }
    }

    // Numeric and unit-aware operators (GreaterThan, LessThan, After, Before)
    const isTimestampOp = normalizedOp === FilterOperators.AFTER || normalizedOp === FilterOperators.BEFORE;
    const isNumericOp = normalizedOp === FilterOperators.GREATER_THAN || normalizedOp === FilterOperators.LESS_THAN;

    if (isTimestampOp || isNumericOp) {
      let tNum = 0;
      let fNum = 0;

      if (normalizedType === FilterTypes.TIME) {
        tNum = traffic.timestamp as number;
        fNum = parseTimestampValue(filter.value);
      } else if (normalizedType === FilterTypes.DURATION) {
        tNum = parseTimeValue(targetValue);
        fNum = parseTimeValue(filter.value);
      } else if (normalizedType === FilterTypes.REQUEST_SIZE || normalizedType === FilterTypes.RESPONSE_SIZE) {
        tNum = parseSizeValue(targetValue);
        fNum = parseSizeValue(filter.value);
      } else {
        tNum = parseNumericValue(targetValue);
        fNum = parseNumericValue(filter.value);
      }

      if (normalizedOp === FilterOperators.AFTER || normalizedOp === FilterOperators.GREATER_THAN) return tNum > fNum;
      if (normalizedOp === FilterOperators.BEFORE || normalizedOp === FilterOperators.LESS_THAN) return tNum < fNum;
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
