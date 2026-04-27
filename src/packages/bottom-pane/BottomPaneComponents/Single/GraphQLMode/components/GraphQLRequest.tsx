import { twMerge } from "tailwind-merge";
import { FiCode } from "react-icons/fi";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ParsedGraphQLItem } from "../types";

interface GraphQLRequestProps {
  activeData: ParsedGraphQLItem;
  layoutMode: "grid" | "tabbed";
  activeTab: string;
}

export const GraphQLRequest = ({ activeData, layoutMode, activeTab }: GraphQLRequestProps) => {
  return (
    <div className={twMerge(
      "@5xl:w-5/12 flex flex-col border-r border-zinc-900 h-full overflow-hidden transition-all duration-300",
      layoutMode === 'grid' ? (activeTab !== "query" && "hidden @5xl:flex") : (activeTab !== "query" && "hidden")
    )}>
      <div className={twMerge(
        "hidden items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30 justify-between",
        layoutMode === 'grid' && "@5xl:flex"
      )}>
        <div className="flex items-center gap-2">
          <FiCode className="text-pink-500" size={14} />
          <span className="text-[10px] font-bold text-zinc-500 tracking-wider">
            {activeData.isPersisted ? "Persisted Query ID" : "Query Definition"}
          </span>
        </div>
        {activeData.isPersisted && (
          <div className="text-[8px] font-black text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded border border-pink-400/20">
            Minimized
          </div>
        )}
      </div>
      <div className="flex-grow bg-black/30">
        <MonacoEditor
          height="100%"
          defaultLanguage="graphql"
          theme="vs-dark"
          value={activeData.query}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: "JetBrains Mono, Menlo, monospace",
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "all",
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  );
};
