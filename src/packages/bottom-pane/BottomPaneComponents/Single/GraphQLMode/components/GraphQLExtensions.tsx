import { twMerge } from "tailwind-merge";
import { FiActivity } from "react-icons/fi";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";
import { ParsedGraphQLItem } from "../types";

interface GraphQLExtensionsProps {
  activeData: ParsedGraphQLItem;
  layoutMode: "grid" | "tabbed";
  activeTab: string;
}

export const GraphQLExtensions = ({ activeData, layoutMode, activeTab }: GraphQLExtensionsProps) => {
  if (!activeData.extensions) return null;

  return (
    <div className={twMerge(
      "flex flex-col border-b border-zinc-900 transition-all",
      activeTab === "response" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
      activeTab === "variables" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
      activeTab === "extensions" ? "flex-grow" : (layoutMode === 'grid' ? "h-1/3" : "hidden")
    )}>
      <div className={twMerge(
        "hidden items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30",
        layoutMode === 'grid' && "@5xl:flex"
      )}>
        <FiActivity className="text-amber-500" size={14} />
        <span className="text-[10px] font-bold text-zinc-500 tracking-wider">Extensions</span>
      </div>
      <div className="flex-grow bg-black/30">
        <MonacoEditor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={activeData.extensions}
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
    </div>
  );
};
