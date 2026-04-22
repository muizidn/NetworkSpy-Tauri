import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { DiffEditor } from "@monaco-editor/react";
import { FiChevronRight, FiWind } from "react-icons/fi";
import { decodeBody } from "../../utils/bodyUtils";

export const DiffMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selectedOthers = useMemo(() => selections.others || [], [selections]);

  const [leftData, setLeftData] = useState<string>("");
  const [rightData, setRightData] = useState<string>("");
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(1);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<"body" | "headers">("body");
  const [isFormatted, setIsFormatted] = useState(true);

  // Sync indices if selection changes and they become invalid
  useEffect(() => {
    if (leftIdx >= selectedOthers.length) setLeftIdx(0);
    if (rightIdx >= selectedOthers.length) setRightIdx(selectedOthers.length > 1 ? 1 : 0);
  }, [selectedOthers.length]);

  useEffect(() => {
    if (selectedOthers.length < 2) return;

    const id1 = String(selectedOthers[leftIdx]?.id);
    const id2 = String(selectedOthers[rightIdx]?.id);

    if (!id1 || !id2) return;

    setLoading(true);
    Promise.all([
      provider.getResponsePairData(id1),
      provider.getResponsePairData(id2)
    ]).then(([res1, res2]) => {
      if (target === "body") {
        setLeftData(decodeBody(res1.body, isFormatted ? "json" : ""));
        setRightData(decodeBody(res2.body, isFormatted ? "json" : ""));
      } else {
        setLeftData(JSON.stringify(res1.headers, null, isFormatted ? 2 : 0));
        setRightData(JSON.stringify(res2.headers, null, isFormatted ? 2 : 0));
      }
    }).finally(() => setLoading(false));
  }, [selectedOthers, provider, target, leftIdx, rightIdx, isFormatted]);

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

  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col overflow-hidden">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-[#111] justify-between z-10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded tracking-tighter shadow-lg shadow-blue-900/20">Diff Engine v2</span>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setTarget("body")}
              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${target === "body" ? "bg-zinc-800 text-blue-400 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Body
            </button>
            <button
              onClick={() => setTarget("headers")}
              className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${target === "headers" ? "bg-zinc-800 text-blue-400 shadow-inner" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Headers
            </button>
          </div>

          <button
            onClick={() => setIsFormatted(!isFormatted)}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-black transition-all border ${isFormatted
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
          >
            <FiWind size={12} />
            {isFormatted ? 'BEAUTIFY' : 'RAW'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-600">Left:</span>
            <select
              value={leftIdx}
              onChange={(e) => setLeftIdx(parseInt(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 px-2 py-1 rounded outline-none font-mono"
            >
              {selectedOthers.map((item, idx) => (
                <option key={String(item.id)} value={idx}>#{item.id} - {item.method}</option>
              ))}
            </select>
          </div>

          <FiChevronRight size={14} className="text-zinc-800" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-600">Right:</span>
            <select
              value={rightIdx}
              onChange={(e) => setRightIdx(parseInt(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 text-[10px] text-blue-400 px-2 py-1 rounded outline-none font-mono"
            >
              {selectedOthers.map((item, idx) => (
                <option key={String(item.id)} value={idx}>#{item.id} - {item.method}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-grow relative">
        {loading && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="w-8 h-8 @sm:w-10 @sm:h-10 border-2 border-blue-600/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <div className="text-[10px] font-black tracking-[0.2em] text-zinc-600">Calculating Delta...</div>
          </div>
        )}
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
            }
          }}
        />
      </div>
    </div>
  );
};

export default DiffMode;
