import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { DiffEditor } from "@monaco-editor/react";
import { FiChevronRight } from "react-icons/fi";

export const DiffMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selectedOthers = useMemo(() => selections.others || [], [selections]);
  
  const [leftData, setLeftData] = useState<string>("");
  const [rightData, setRightData] = useState<string>("");
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<"body" | "headers">("body");

  useEffect(() => {
    if (selectedOthers.length < 2) return;
    
    const id1 = String(selectedOthers[0].id);
    const id2 = String(selectedOthers[1].id);
    setLeftId(id1);
    setRightId(id2);
    
    setLoading(true);
    Promise.all([
      provider.getResponsePairData(id1),
      provider.getResponsePairData(id2)
    ]).then(([res1, res2]) => {
      if (target === "body") {
        setLeftData(res1.body || "");
        setRightData(res2.body || "");
      } else {
        setLeftData(JSON.stringify(res1.headers, null, 2));
        setRightData(JSON.stringify(res2.headers, null, 2));
      }
    }).finally(() => setLoading(false));
  }, [selectedOthers, provider, target]);

  if (selectedOthers.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-6xl font-black opacity-5 mb-4 tracking-tighter">DIFF ENGINE</div>
        <div className="max-w-xs text-center">
            <p className="text-sm font-medium text-zinc-400 mb-1">Comparative Analysis Required</p>
            <p className="text-[11px] text-zinc-600 italic">Select two or more requests from the traffic list to begin deep content comparison.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
          <div className="w-10 h-10 border-2 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Calculating Delta...</div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-[#111] justify-between z-10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter shadow-lg shadow-blue-900/20">Diff Engine v2</span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Comparative View</span>
          </div>
          
          <div className="h-4 w-px bg-zinc-800" />
          
          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button 
                onClick={() => setTarget("body")}
                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${target === "body" ? "bg-zinc-800 text-blue-400 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
            >
                Body
            </button>
            <button 
                onClick={() => setTarget("headers")}
                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${target === "headers" ? "bg-zinc-800 text-blue-400 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
            >
                Headers
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                <span className="text-[10px] font-mono text-zinc-500">#{leftId}</span>
                <FiChevronRight size={10} className="text-zinc-700" />
                <span className="text-[10px] font-mono text-blue-400">#{rightId}</span>
            </div>
        </div>
      </div>

      <div className="flex-grow relative">
        <DiffEditor
          height="100%"
          language={target === "body" ? "json" : "json"}
          theme="vs-dark"
          original={leftData}
          modified={rightData}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineHeight: 20,
            renderSideBySide: true,
            scrollBeyondLastLine: false,
            folding: true,
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
            },
            hideUnchangedRegions: {
                enabled: true,
                revealLineCount: 3
            }
          }}
        />
      </div>
    </div>
  );
};

export default DiffMode;
