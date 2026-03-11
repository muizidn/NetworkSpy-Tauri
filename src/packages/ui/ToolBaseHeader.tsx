import React from "react";
import { FiPlus, FiTrash2, FiSearch, FiInfo } from "react-icons/fi";
import { twMerge } from "tailwind-merge";

interface ToolBaseHeaderProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  onAdd?: () => void;
  onClear?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  actions?: React.ReactNode;
}

export const ToolBaseHeader: React.FC<ToolBaseHeaderProps> = ({
  title,
  description,
  icon,
  onAdd,
  onClear,
  searchTerm = "",
  onSearchChange,
  actions,
}) => {
  return (
    <div className="flex flex-col gap-4 px-6 py-6 bg-[#0a0a0a] border-b border-zinc-800 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-xl">
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
            {description && (
              <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-[0.1em] mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800 focus-within:border-blue-500/50 transition-all group w-64">
              <FiSearch className="text-zinc-500 group-focus-within:text-blue-500" size={14} />
              <input
                type="text"
                placeholder="Search rules..."
                className="bg-transparent border-none outline-none text-[12px] text-zinc-300 w-full placeholder:text-zinc-600"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}

          <div className="h-8 w-px bg-zinc-800 mx-2" />

          {actions}

          {onClear && (
            <button
              onClick={onClear}
              className="p-2.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-95"
              title="Clear All"
            >
              <FiTrash2 size={18} />
            </button>
          )}

          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 translate-y-[1px]"
            >
              <FiPlus size={14} />
              <span>Add Rule</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
