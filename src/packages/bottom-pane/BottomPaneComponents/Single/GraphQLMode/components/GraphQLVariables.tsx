import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { FiLayers, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ParsedGraphQLItem } from "../types";

interface GraphQLVariablesProps {
  activeData: ParsedGraphQLItem;
  layoutMode: "grid" | "tabbed";
  activeTab: string;
}

export const GraphQLVariables = ({ activeData, layoutMode, activeTab }: GraphQLVariablesProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={twMerge(
      "flex flex-col transition-all border-t border-zinc-900",
      activeTab === "query" ? (isCollapsed ? "h-[32px] shrink-0" : "h-1/3 shrink-0") : "hidden"
    )}>
      <div 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30 cursor-pointer hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FiLayers className="text-blue-500" size={14} />
          <span className="text-[10px] font-bold text-zinc-500 tracking-wider">Variables</span>
        </div>
        <button className="text-zinc-500 hover:text-zinc-300">
          {isCollapsed ? <FiChevronRight size={14} /> : <FiChevronDown size={14} />}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="flex-grow bg-black/30 overflow-hidden">
        <MonacoEditor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={activeData.variables}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 11,
            fontFamily: "JetBrains Mono, Menlo, monospace",
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            padding: { top: 12 },
          }}
        />
      </div>
      )}
    </div>
  );
};
