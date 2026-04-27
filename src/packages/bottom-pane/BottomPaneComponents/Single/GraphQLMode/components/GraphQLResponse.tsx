import { twMerge } from "tailwind-merge";
import { FiTerminal } from "react-icons/fi";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";

interface GraphQLResponseProps {
  responseBody: string | null;
  layoutMode: "grid" | "tabbed";
  activeTab: string;
}

export const GraphQLResponse = ({ responseBody, layoutMode, activeTab }: GraphQLResponseProps) => {
  return (
    <div className={twMerge(
      "flex flex-col bg-[#050505] transition-all",
      activeTab === "variables" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
      activeTab === "extensions" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
      activeTab === "response" ? "flex-grow" : (layoutMode === 'grid' ? "h-1/3" : "hidden")
    )}>
      <div className={twMerge(
        "hidden items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50",
        layoutMode === 'grid' && "@5xl:flex"
      )}>
        <FiTerminal className="text-emerald-500" size={14} />
        <span className="text-[10px] font-bold text-zinc-500 tracking-wider">Response Payload</span>
      </div>
      <div className="flex-grow">
        <MonacoEditor
          height="100%"
          defaultLanguage="json"
          theme="vs-dark"
          value={responseBody || "// No response captured"}
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
