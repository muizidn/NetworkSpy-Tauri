import React from "react";
import { useFilterContext, Filter, FilterType, FilterOperator } from "@src/context/FilterContext";
import { v4 as uuidv4 } from "uuid";
import { twMerge } from "tailwind-merge";
import { FiSearch, FiX } from "react-icons/fi";

export const FilterBar = () => {
  const {
    filters,
    setFilters,
    predefinedFilters,
    activePredefinedIds,
    togglePredefinedFilter,
    saveCurrentFilters,
    removePredefinedFilter
  } = useFilterContext();

  const [searchTerm, setSearchTerm] = React.useState("");

  const { appPredefined, userPredefined } = React.useMemo(() => {
    const filtered = predefinedFilters.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      appPredefined: filtered.filter(f => f.isBuiltIn),
      userPredefined: filtered.filter(f => !f.isBuiltIn)
    };
  }, [predefinedFilters, searchTerm]);

  const addFilter = () => {
    const newFilter: Filter = {
      id: uuidv4(),
      enabled: true,
      type: "URL",
      operator: "Contains",
      value: "",
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const [showSaveInput, setShowSaveInput] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");

  const handleSaveCurrent = () => {
    if (saveName.trim()) {
      saveCurrentFilters(saveName.trim());
      setSaveName("");
      setShowSaveInput(false);
    }
  };

  const filterTypes: FilterType[] = ["URL", "Method", "Status", "Header", "Content-Type"];
  const filterOperators: FilterOperator[] = [
    "Contains",
    "Starts with",
    "Ends with",
    "Equals",
    "Matches Regex",
  ];

  return (
    <div className='bg-[#202020] text-white flex flex-col w-full'>
      <div className='flex items-center border-y border-black h-9 relative'>
        {/* Search Input for Presets */}
        <div className="flex items-center px-3 border-r border-zinc-800 h-full group">
          <FiSearch className="text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search filters..."
            className="bg-transparent border-none outline-none text-[11px] text-zinc-300 ml-2 w-20 focus:w-32 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center px-2 space-x-1 border-r border-zinc-800 h-full">
          <button
            onClick={addFilter}
            className='btn btn-xs bg-zinc-800/50 border-zinc-800/50 rounded text-zinc-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-200 h-6 min-h-0 text-[10px]'>
            + New
          </button>

          {filters.length > 0 && !showSaveInput && (
            <button
              onClick={() => setShowSaveInput(true)}
              className='btn btn-xs bg-blue-600/10 border border-blue-500/20 rounded text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 px-2 h-6 min-h-0 text-[10px] transition-all duration-200'
              title="Save current manual filters as a preset"
            >
              Save
            </button>
          )}

          {showSaveInput && (
            <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-left-2 duration-300">
              <input
                autoFocus
                className="input input-xs bg-[#2a2d2c] border border-blue-500/50 rounded text-[10px] w-32 h-6 focus:outline-none"
                placeholder="Name preset..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrent();
                  if (e.key === 'Escape') setShowSaveInput(false);
                }}
              />
              <button
                onClick={handleSaveCurrent}
                className="btn btn-xs bg-blue-600 border-blue-500 text-white hover:bg-blue-500 h-6 min-h-0 px-2 text-[10px]"
              >
                ✓
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="btn btn-xs bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white h-6 min-h-0 text-[10px]"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        {/* Predefined Filters (Scrollable) */}
        <div className="flex-1 flex items-center px-1 gap-1 overflow-x-auto no-scrollbar scroll-smooth h-full">
          {/* App Predefined Filters */}
          <div className="flex items-center gap-1 shrink-0">
            {appPredefined.map((tab) => {
              const isActive = activePredefinedIds.includes(tab.id);
              return (
                <div
                  key={tab.id}
                  onClick={() => togglePredefinedFilter(tab.id)}
                  className={twMerge(
                    'group/predefined relative flex items-center justify-between h-6 px-3 rounded-md transition-all duration-200 border text-[10px] font-medium whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-blue-600 hover:text-white hover:border-blue-500'
                  )}>
                  <span>{tab.name}</span>
                </div>
              );
            })}
          </div>

          {/* Vertical Separator */}
          {userPredefined.length > 0 && (
            <div className="h-4 w-[1px] bg-zinc-800 mx-2 shrink-0" />
          )}

          {/* User Created Filters */}
          <div className="flex items-center gap-1 shrink-0">
            {userPredefined.map((tab) => {
              const isActive = activePredefinedIds.includes(tab.id);
              return (
                <div
                  key={tab.id}
                  onClick={() => togglePredefinedFilter(tab.id)}
                  className={twMerge(
                    'group/predefined relative flex items-center justify-between h-6 px-3 rounded-md transition-all duration-200 border text-[10px] font-medium whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-600 hover:text-white hover:border-zinc-500'
                  )}>
                  <span>{tab.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePredefinedFilter(tab.id); }}
                    className="ml-2 hover:bg-black/20 rounded-full p-0.5 hidden group-hover/predefined:block transition-opacity"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              );
            })}
          </div>

          {appPredefined.length === 0 && userPredefined.length === 0 && searchTerm && (
            <span className="text-[10px] text-zinc-600 italic px-2">No presets match...</span>
          )}
        </div>

        {/* Right Gradient Fade */}
        <div className="w-8 h-full bg-gradient-to-l from-[#202020] to-transparent pointer-events-none absolute right-0" />
      </div>

      {filters.length === 0 ? null : (
        <div className="flex flex-col w-full bg-black/20">
          {filters.map((filter) => (
            <div key={filter.id} className='flex space-x-3 w-full p-2 border-b border-black items-center group/filter-row hover:bg-white/5 transition-colors'>
              <div className='flex items-center justify-center'>
                <input
                  type='checkbox'
                  className="checkbox checkbox-xs border-zinc-600"
                  checked={filter.enabled}
                  onChange={(e) => updateFilter(filter.id, { enabled: e.target.checked })}
                />
              </div>

              <select
                className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500 h-6 min-h-0'
                value={filter.type}
                onChange={(e) => updateFilter(filter.id, { type: e.target.value as FilterType })}
              >
                {filterTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select
                className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500 h-6 min-h-0'
                value={filter.operator}
                onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
              >
                {filterOperators.map(o => <option key={o} value={o}>{o}</option>)}
              </select>

              <input
                type='text'
                className='input input-xs flex-grow rounded bg-[#2a2d2c] border border-zinc-800 text-[11px] focus:outline-none focus:border-blue-500 py-0 h-6'
                placeholder={`Search ${filter.type}...`}
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
              />

              <div className="flex items-center gap-1 opacity-0 group-hover/filter-row:opacity-100 transition-opacity">
                <button
                  onClick={() => removeFilter(filter.id)}
                  className='btn btn-xs btn-ghost text-zinc-500 hover:text-red-400 p-0 h-6 w-6 min-h-0'
                  title="Remove Filter"
                >
                  <FiX size={12} />
                </button>
                <button
                  onClick={addFilter}
                  className='btn btn-xs btn-ghost text-zinc-500 hover:text-blue-400 p-0 h-6 w-6 min-h-0'
                  title="Add Another Filter"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
