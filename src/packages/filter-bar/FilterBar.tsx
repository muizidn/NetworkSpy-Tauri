import React from "react";
import { useFilterContext, Filter, FilterType, FilterOperator } from "@src/context/FilterContext";
import { v4 as uuidv4 } from "uuid";

export const FilterBar = () => {
  const { filters, setFilters } = useFilterContext();

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

  const filterTypes: FilterType[] = ["URL", "Method", "Status", "Header"];
  const filterOperators: FilterOperator[] = [
    "Contains",
    "Starts with",
    "Ends with",
    "Equals",
    "Matches Regex",
  ];

  return (
    <div className='bg-[#202020] text-white flex flex-col w-full'>
      <div className='flex items-center space-x-1 border-y border-black py-1 px-2 overflow-auto no-scrollbar'>
        <button
          onClick={addFilter}
          className='btn btn-xs bg-[#353737] rounded text-white hover:bg-[#454747]'>
          + Create New
        </button>
        <div className='flex space-x-1 border-l border-zinc-800 ml-2 pl-2'>
          {[
            "All",
            "HTTP",
            "HTTPS",
            "JSON",
            "Images",
          ].map((tab, index) => (
            <button
              key={index}
              className='btn btn-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-400 hover:text-white capitalize px-3'>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filters.length === 0 ? (
        null
      ) : (
        <div className="flex flex-col w-full">
          {filters.map((filter) => (
            <div key={filter.id} className='flex space-x-2 w-full p-2 border-b border-black items-center group/filter-row hover:bg-white/5 transition-colors'>
              <div className='flex items-center justify-center'>
                <input
                  type='checkbox'
                  className="checkbox checkbox-xs"
                  checked={filter.enabled}
                  onChange={(e) => updateFilter(filter.id, { enabled: e.target.checked })}
                />
              </div>

              <select
                className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500'
                value={filter.type}
                onChange={(e) => updateFilter(filter.id, { type: e.target.value as FilterType })}
              >
                {filterTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <select
                className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500'
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

              <div className="flex items-center gap-1">
                <button
                  onClick={() => removeFilter(filter.id)}
                  className='btn btn-xs btn-ghost text-zinc-500 hover:text-red-400 p-0 h-6 w-6 min-h-0'
                  title="Remove Filter"
                >
                  ✕
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
