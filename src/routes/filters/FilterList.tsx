import React, { useMemo, useState } from "react";
import { FiSearch, FiTrash2, FiEdit3, FiFilter, FiPlus, FiChevronRight, FiChevronDown, FiFolder, FiEye, FiEyeOff } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { PredefinedFilter } from "@src/models/Filter";
import { useFilterPresetContext } from "@src/context/FilterPresetContext";

interface FilterListProps {
  selectedFilterId?: string;
  onSelectFilter: (filter: PredefinedFilter | null) => void;
  isCompact?: boolean;
}

const FilterList: React.FC<FilterListProps> = ({ selectedFilterId, onSelectFilter, isCompact }) => {
  const {
    predefinedFilters,
    removePreset,
    showBuiltIn,
    setShowBuiltIn,
    visibleBuiltInIds,
    setBuiltInVisibility
  } = useFilterPresetContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPresets = useMemo(() => {
    return predefinedFilters.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [predefinedFilters, searchTerm]);

  const userFilters = useMemo(() => filteredPresets.filter(f => !f.isBuiltIn), [filteredPresets]);
  const builtInFilters = useMemo(() => filteredPresets.filter(f => f.isBuiltIn), [filteredPresets]);

  return (
    <div className="flex flex-col h-full select-none">
      <div className="px-5 py-6 border-b border-zinc-900 flex flex-col gap-4 bg-zinc-900/10">
        {!isCompact && (
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Saved Filters</h2>
          </div>
        )}

        {!isCompact && (
          <div className="relative">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
            <input
              type="text"
              placeholder="Search filters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-4">
        {/* Built-in Filters Section */}
        <div className="space-y-1">
          {!isCompact && (
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                Standard Library
              </h3>
              <button
                onClick={() => setShowBuiltIn(!showBuiltIn)}
                className={twMerge(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all border",
                  showBuiltIn
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white"
                    : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400"
                )}
              >
                {showBuiltIn ? "Hide List" : "Show List"}
              </button>
            </div>
          )}
          {showBuiltIn && builtInFilters.map(filter => (
            <FilterItem
              key={filter.id}
              filter={filter}
              isActive={selectedFilterId === filter.id}
              onClick={() => onSelectFilter(filter)}
              isCompact={isCompact}
              isVisibleInBar={visibleBuiltInIds.includes(filter.id)}
              onToggleVisibility={() => setBuiltInVisibility(filter.id, !visibleBuiltInIds.includes(filter.id))}
            />
          ))}
        </div>

        {/* User Filters Section */}
        <div className="space-y-1">
          {!isCompact && <h3 className="px-3 text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            My Collection
          </h3>}
          {userFilters.map(filter => (
            <FilterItem
              key={filter.id}
              filter={filter}
              isActive={selectedFilterId === filter.id}
              onClick={() => onSelectFilter(filter)}
              onDelete={() => removePreset(filter.id)}
              isCompact={isCompact}
            />
          ))}
          {userFilters.length === 0 && !isCompact && (
            <div className="px-3 py-8 text-center border-2 border-dashed border-zinc-800 rounded-xl m-2">
              <p className="text-[10px] text-zinc-600 italic">No custom filters yet. Save one from the traffic view!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterItem = ({
  filter,
  isActive,
  onClick,
  onDelete,
  isCompact,
  isVisibleInBar,
  onToggleVisibility
}: {
  filter: PredefinedFilter,
  isActive: boolean,
  onClick: () => void,
  onDelete?: () => void,
  isCompact?: boolean,
  isVisibleInBar?: boolean,
  onToggleVisibility?: () => void
}) => (
  <div
    onClick={onClick}
    className={twMerge(
      "group flex items-center rounded-lg cursor-pointer transition-all",
      isCompact ? "px-0 py-2 justify-center" : "px-3 py-2 justify-between",
      isActive ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30" : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
    )}
  >
    <div className={twMerge("flex items-center gap-2 truncate", isCompact && "justify-center overflow-visible")}>
      <div className={twMerge(
        "w-6 h-6 rounded flex items-center justify-center border",
        filter.isBuiltIn ? "bg-zinc-800/50 border-zinc-700/50 text-zinc-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500",
        isActive && "border-blue-400 text-blue-400"
      )}>
        <FiFilter size={12} />
      </div>
      {!isCompact && (
        <div className="flex flex-col truncate">
          <span className="text-[11px] font-bold truncate leading-none mb-1">{filter.name}</span>
          <span className="text-[9px] text-zinc-600 truncate">{filter.filters.length} rules</span>
        </div>
      )}
    </div>

    <div className="flex items-center gap-1 transition-opacity">
      {!isCompact && onToggleVisibility && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
          className={twMerge(
            "p-1.5 rounded-md transition-all",
            isVisibleInBar ? "text-blue-500 hover:bg-blue-500/10" : "text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
          )}
          title={isVisibleInBar ? "Visible in Filter Bar" : "Hidden in Filter Bar"}
        >
          {isVisibleInBar ? <FiEye size={12} /> : <FiEyeOff size={12} />}
        </button>
      )}
      {!isCompact && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm(`Delete filter "${filter.name}"?`)) onDelete(); }}
          className="p-1.5 hover:bg-rose-500/10 text-zinc-700 hover:text-rose-500 rounded-md transition-all"
        >
          <FiTrash2 size={12} />
        </button>
      )}
    </div>
  </div>
);

export default FilterList;
