import React from "react";
import { useFilterContext, FilterNode, FilterRule, FilterGroup, FilterType, FilterOperator, FilterTypes, FilterOperators } from "@src/context/FilterContext";
import { useFilterPresetContext } from "@src/context/FilterPresetContext";
import { v4 as uuidv4 } from "uuid";
import { twMerge } from "tailwind-merge";
import { FiSearch, FiX } from "react-icons/fi";

const FilterNodeRenderer = ({
  node,
  depth = 0,
  updateNode,
  removeNode,
  addRule,
  addGroup
}: {
  node: FilterNode,
  depth?: number,
  updateNode: (id: string, updates: Partial<FilterNode>) => void,
  removeNode: (id: string) => void,
  addRule: (pid: string | null) => void,
  addGroup: (pid: string | null) => void
}) => {
  const filterTypes: FilterType[] = Object.values(FilterTypes);
  const filterOperators: FilterOperator[] = Object.values(FilterOperators);

  if (!node.isGroup) {
    return (
      <div className={twMerge("flex w-full border-b border-black items-center group/filter-row hover:bg-white/5 transition-colors")} style={{ paddingLeft: `${depth * 16}px` }}>
        <div className="flex items-center space-x-3 w-full p-1 pl-4">
          <div className='flex items-center justify-center shrink-0'>
            <input
              type='checkbox'
              className="checkbox checkbox-xs border-zinc-600 rounded"
              checked={node.enabled}
              onChange={(e) => updateNode(node.id, { enabled: e.target.checked })}
            />
          </div>

          <select
            className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500 h-6 min-h-0 shrink-0'
            value={node.type}
            onChange={(e) => updateNode(node.id, { type: e.target.value as FilterType })}
          >
            {filterTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500 h-6 min-h-0 w-[120px] shrink-0'
            value={node.operator}
            onChange={(e) => updateNode(node.id, { operator: e.target.value as FilterOperator })}
          >
            {filterOperators.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          <input
            type='text'
            className='input input-xs flex-grow rounded bg-[#2a2d2c] border border-zinc-800 text-[11px] focus:outline-none focus:border-blue-500 py-0 h-6'
            placeholder={`Search ${node.type}...`}
            value={node.value}
            onChange={(e) => updateNode(node.id, { value: e.target.value })}
          />

          <div className="flex items-center gap-1 opacity-0 group-hover/filter-row:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => removeNode(node.id)}
              className='btn btn-xs btn-ghost text-zinc-500 hover:text-red-400 p-0 h-6 w-6 min-h-0'
              title="Remove Rule"
            >
              <FiX size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full border-b border-black">
      <div className="flex items-center space-x-2 w-full p-1.5 bg-[#17191a] group/filter-group border-l-[3px] border-blue-500/50 hover:bg-[#1c1e20] transition-colors" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
        <input
          type='checkbox'
          className="checkbox checkbox-xs border-zinc-600 rounded"
          checked={node.enabled}
          onChange={(e) => updateNode(node.id, { enabled: e.target.checked })}
        />
        <select
          className='select select-xs bg-zinc-900 border border-zinc-800 rounded text-[11px] focus:outline-none focus:border-blue-500 h-6 min-h-0 text-blue-400 font-bold tracking-wider uppercase'
          value={node.logic}
          onChange={(e) => updateNode(node.id, { logic: e.target.value as "AND" | "OR" })}
        >
          <option value="AND">AND (All)</option>
          <option value="OR">OR (Any)</option>
        </select>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest ml-2 flex-grow">Condition Group</div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => addRule(node.id)}
            className='btn btn-xs bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-blue-600 hover:text-white hover:border-blue-500 p-0 h-6 px-2 min-h-0 text-[10px] font-medium transition-colors'
          >
            + Rule
          </button>
          <button
            onClick={() => addGroup(node.id)}
            className='btn btn-xs bg-zinc-800/50 border-zinc-700/50 text-amber-500 hover:bg-amber-600 hover:text-black hover:border-amber-500 p-0 h-6 px-2 min-h-0 text-[10px] font-medium transition-colors'
          >
            + Group
          </button>
          <button
            onClick={() => removeNode(node.id)}
            className='btn btn-xs btn-ghost text-zinc-500 hover:text-red-400 p-0 h-6 w-6 min-h-0 ml-1'
            title="Remove Group"
          >
            <FiX size={12} />
          </button>
        </div>
      </div>
      <div className="flex flex-col w-full border-l-[3px] border-zinc-800/20">
        {node.children.map(child => (
          <FilterNodeRenderer
            key={child.id}
            node={child}
            depth={depth + 1}
            updateNode={updateNode}
            removeNode={removeNode}
            addRule={addRule}
            addGroup={addGroup}
          />
        ))}
      </div>
    </div>
  );
};

export const FilterBar = () => {
  const {
    filters,
    setFilters,
    saveCurrentFilters,
  } = useFilterContext();

  const {
    predefinedFilters,
    activePredefinedIds,
    togglePreset,
    removePreset,
    visibleBuiltInIds
  } = useFilterPresetContext();

  const [searchTerm, setSearchTerm] = React.useState("");

  const { appPredefined, userPredefined } = React.useMemo(() => {
    const filtered = predefinedFilters.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
      appPredefined: filtered.filter(f => f.isBuiltIn && visibleBuiltInIds.includes(f.id)),
      userPredefined: filtered.filter(f => !f.isBuiltIn)
    };
  }, [predefinedFilters, searchTerm, visibleBuiltInIds]);

  const addRule = (parentId: string | null = null) => {
    const newRule: FilterRule = {
      isGroup: false,
      id: uuidv4(),
      enabled: true,
      type: FilterTypes.URL,
      operator: FilterOperators.Contains,
      value: "",
    };

    if (!parentId) {
      setFilters([...filters, newRule]);
      return;
    }

    const addRecursive = (nodes: FilterNode[]): FilterNode[] => {
      return nodes.map(n => {
        if (n.id === parentId && n.isGroup) {
          return { ...n, children: [...n.children, newRule] };
        }
        if (n.isGroup) {
          return { ...n, children: addRecursive(n.children) };
        }
        return n;
      });
    };
    setFilters(addRecursive(filters));
  };

  const addGroup = (parentId: string | null = null) => {
    const newGroup: FilterGroup = {
      isGroup: true,
      id: uuidv4(),
      enabled: true,
      logic: "AND",
      children: [
        {
          isGroup: false,
          id: uuidv4(),
          enabled: true,
          type: FilterTypes.URL,
          operator: FilterOperators.Contains,
          value: ""
        }
      ]
    };

    if (!parentId) {
      setFilters([...filters, newGroup]);
      return;
    }

    const addRecursive = (nodes: FilterNode[]): FilterNode[] => {
      return nodes.map(n => {
        if (n.id === parentId && n.isGroup) {
          return { ...n, children: [...n.children, newGroup] };
        }
        if (n.isGroup) {
          return { ...n, children: addRecursive(n.children) };
        }
        return n;
      });
    };
    setFilters(addRecursive(filters));
  };

  const updateNode = (id: string, updates: Partial<FilterNode>) => {
    const updateRecursive = (nodes: FilterNode[]): FilterNode[] => {
      return nodes.map(n => {
        if (n.id === id) {
          return { ...n, ...updates } as FilterNode;
        }
        if (n.isGroup) {
          return { ...n, children: updateRecursive(n.children) };
        }
        return n;
      });
    };
    setFilters(updateRecursive(filters));
  };

  const removeNode = (id: string) => {
    const removeRecursive = (nodes: FilterNode[]): FilterNode[] => {
      // Filter out the node if it matches, otherwise recurse
      return nodes.filter(n => n.id !== id).map(n => {
        if (n.isGroup) {
          return { ...n, children: removeRecursive(n.children) };
        }
        return n;
      });
    };
    setFilters(removeRecursive(filters));
  };

  const [showSaveInput, setShowSaveInput] = React.useState(false);
  const [saveName, setSaveName] = React.useState("");

  const handleSaveCurrent = () => {
    if (saveName.trim()) {
      saveCurrentFilters(saveName.trim());
      setFilters([]); // Clear the filters once saved
      setSaveName("");
      setShowSaveInput(false);
    }
  };

  return (
    <div className='bg-[#202020] text-white flex flex-col w-full'>
      <div className='flex items-center border-y border-black h-9 relative'>
        {/* Search Input for Presets */}
        <div className="flex items-center px-3 border-r border-zinc-800 h-full group shrink-0">
          <FiSearch className="text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search filters..."
            className="bg-transparent border-none outline-none text-[11px] text-zinc-300 ml-2 w-20 focus:w-32 transition-all duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center px-2 space-x-1 border-r border-zinc-800 h-full shrink-0">
          <button
            onClick={() => addRule(null)}
            className='btn btn-xs bg-zinc-800/50 border-zinc-800/50 rounded text-zinc-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all duration-200 h-6 min-h-0 text-[10px] whitespace-nowrap'
          >
            + Rule
          </button>

          <button
            onClick={() => addGroup(null)}
            className='btn btn-xs bg-zinc-800/50 border-zinc-800/50 rounded text-amber-500 hover:bg-amber-600 hover:text-black hover:border-amber-500 transition-all duration-200 h-6 min-h-0 text-[10px] whitespace-nowrap'
          >
            + Group
          </button>

          {filters.length > 0 && !showSaveInput && (
            <button
              onClick={() => setShowSaveInput(true)}
              className='btn btn-xs bg-blue-600/10 border border-blue-500/20 rounded text-blue-400 hover:bg-blue-600 hover:text-white hover:border-blue-500 px-2 h-6 min-h-0 text-[10px] transition-all duration-200 whitespace-nowrap'
              title="Save current manual filters as a preset"
            >
              Save
            </button>
          )}

          {showSaveInput && (
            <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-left-2 duration-300 shrink-0">
              <input
                autoFocus
                className="input input-xs bg-[#2a2d2c] border border-blue-500/50 rounded text-[10px] w-32 h-6 focus:outline-none shrink-0"
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
                className="btn btn-xs bg-blue-600 border-blue-500 text-white hover:bg-blue-500 h-6 min-h-0 px-2 text-[10px] shrink-0"
              >
                ✓
              </button>
              <button
                onClick={() => setShowSaveInput(false)}
                className="btn btn-xs bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white h-6 min-h-0 text-[10px] shrink-0"
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
                  onClick={() => togglePreset(tab.id)}
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
                  onClick={() => togglePreset(tab.id)}
                  className={twMerge(
                    'group/predefined relative flex items-center justify-between h-6 px-3 rounded-md transition-all duration-200 border text-[10px] font-medium whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                      : 'bg-zinc-900/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-600 hover:text-white hover:border-zinc-500'
                  )}>
                  <span>{tab.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePreset(tab.id); }}
                    className="ml-2 hover:bg-black/20 rounded-full p-0.5 hidden group-hover/predefined:block transition-opacity"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              );
            })}
          </div>

          {appPredefined.length === 0 && userPredefined.length === 0 && searchTerm && (
            <span className="text-[10px] text-zinc-600 italic px-2 shrink-0">No presets match...</span>
          )}
        </div>

        {/* Right Gradient Fade */}
        <div className="w-8 h-full bg-gradient-to-l from-[#202020] to-transparent pointer-events-none absolute right-0" />
      </div>

      {filters.length === 0 ? null : (
        <div className="flex flex-col w-full bg-black/20 max-h-[300px] overflow-y-auto no-scrollbar">
          <div className="flex items-center text-[10px] font-bold tracking-widest text-zinc-500 p-1 uppercase border-b border-black shrink-0">
            <span className="ml-2">Manual Matches All Root Conditions (AND)</span>
          </div>
          {filters.map((filter) => (
            <FilterNodeRenderer
              key={filter.id}
              node={filter}
              updateNode={updateNode}
              removeNode={removeNode}
              addRule={addRule}
              addGroup={addGroup}
            />
          ))}
        </div>
      )}
    </div>
  );
};
