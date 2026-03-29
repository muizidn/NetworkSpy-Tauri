import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { Editor } from "@monaco-editor/react";
import { twMerge } from "tailwind-merge";
import { FiActivity, FiCpu, FiBox, FiTerminal, FiInfo, FiLayers, FiCode, FiCheckCircle, FiAlertTriangle, FiZap } from "react-icons/fi";
import { decodeBody, parseBodyAsJson } from "../../utils/bodyUtils";

export const GraphQLMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [responseData, setResponseData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    setSelectedIndex(0); // Reset on new selection
    Promise.all([
      provider.getRequestPairData(trafficId),
      provider.getResponsePairData(trafficId)
    ]).then(([req, res]) => {
      setData(req);
      setResponseData(res);
    }).finally(() => setLoading(false));
  }, [trafficId, provider]);

  const gqlItems = useMemo(() => {
    const rawParsed = parseBodyAsJson(data?.body);
    if (!rawParsed) return [];
    
    const items = Array.isArray(rawParsed) ? (rawParsed as any[]) : [rawParsed];
    
    return items.map((parsed, idx) => {
      try {
        if (parsed.query) {
          const queryTrimmed = parsed.query.trim();
          let type = "QUERY";
          if (queryTrimmed.toLowerCase().startsWith("mutation")) type = "MUTATION";
          if (queryTrimmed.toLowerCase().startsWith("subscription")) type = "SUBSCRIPTION";

          const fragmentsCount = (parsed.query.match(/fragment\s+/g) || []).length;
          const directivesCount = (parsed.query.match(/@\w+/g) || []).length;
          const depth = Math.max(0, ...parsed.query.split('\n').map((line: string) => (line.match(/\{/g) || []).length)) + 1;

          return {
            query: parsed.query,
            variables: parsed.variables ? JSON.stringify(parsed.variables, null, 2) : "{}",
            operationName: parsed.operationName || `Operation ${idx + 1}`,
            type,
            fragmentsCount,
            directivesCount,
            depth
          };
        }
      } catch (e) { }
      return null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data]);

  const activeData = useMemo(() => {
    return gqlItems[selectedIndex] || gqlItems[0] || null;
  }, [gqlItems, selectedIndex]);

  const responseBody = useMemo(() => {
    return decodeBody(responseData?.body, "application/json");
  }, [responseData]);

  if (!trafficId || gqlItems.length === 0) return <Placeholder text="Select a GraphQL request to begin inspection" />;
  if (loading) return <Placeholder text="Analyzing GraphQL traffic..." />;

  const isBatched = gqlItems.length > 1;

  if (!activeData) return <Placeholder text="No valid GraphQL query detected" />;

  return (
    <div className="h-full bg-[#0d0d0d] flex flex-col font-sans overflow-hidden">
      {/* Dynamic Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={twMerge(
            "w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-lg",
            activeData.type === 'MUTATION' ? "bg-amber-600 shadow-amber-900/20" : "bg-pink-600 shadow-pink-900/20"
          )}>
            <FiZap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-bold text-zinc-200">
                {activeData.operationName}
              </div>
              {responseBody && responseBody.includes('"errors"') && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  <FiAlertTriangle size={10} />
                  ERRORS
                </div>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
              {isBatched ? `BATCHED (${gqlItems.length} OPERATIONS)` : `GRAPHQL ${activeData.type}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isBatched && (
            <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800 mr-2 shrink-0">
              {gqlItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={twMerge(
                    "px-3 py-1.5 rounded text-[10px] font-bold transition-all",
                    selectedIndex === idx ? "bg-pink-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  Op {idx + 1}
                </button>
              ))}
            </div>
          )}
          <div className={twMerge(
              "flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm",
              activeData.type === 'MUTATION' ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20"
          )}>
              <div className={twMerge("w-1.5 h-1.5 rounded-full", activeData.type === 'MUTATION' ? "bg-amber-500" : "bg-emerald-500")} />
              <span className={twMerge("text-[10px] font-bold", activeData.type === 'MUTATION' ? "text-amber-500" : "text-emerald-500")}>
              {activeData.type}
              </span>
          </div>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Main Content Areas */}
        <div className="flex-grow grid grid-cols-12 overflow-hidden bg-black/20">
          
          {/* Editor Pane: Query (5/12) */}
          <div className="col-span-5 flex flex-col border-r border-zinc-900">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
              <FiCode className="text-pink-500" size={14} />
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Query Definition</span>
            </div>
            <div className="flex-grow bg-black/30">
              <Editor
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
                  padding: { top: 16 }
                }}
              />
            </div>
          </div>

          {/* Right Section: Variables + Response (7/12) */}
          <div className="col-span-7 flex flex-col overflow-hidden">
            {/* Variables (Top Half) */}
            <div className="h-2/5 flex flex-col border-b border-zinc-900">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
                <FiLayers className="text-blue-500" size={14} />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Variables</span>
              </div>
              <div className="flex-grow bg-black/30">
                <Editor
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
                    padding: { top: 12 }
                  }}
                />
              </div>
            </div>

            {/* Response (Bottom Half) */}
            <div className="h-3/5 flex flex-col bg-[#050505]">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50">
                <FiTerminal className="text-emerald-500" size={14} />
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Response Payload</span>
              </div>
              <div className="flex-grow">
                <Editor
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
                    padding: { top: 12 }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="w-64 border-l border-zinc-800 bg-[#111] flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800 bg-black/20">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-4">Inspection</span>

            <div className="space-y-4">
              <SidebarItem 
                icon={<FiCheckCircle size={14} />} 
                label="Status" 
                value={responseBody?.includes('"errors"') ? "Failed" : "Success"} 
                color={responseBody?.includes('"errors"') ? "text-rose-500" : "text-emerald-500"} 
              />
              <SidebarItem icon={<FiBox size={14} />} label="Nested Depth" value={`${activeData.depth} Levels`} />
              <SidebarItem icon={<FiInfo size={14} />} label="Type" value={activeData.type} />
            </div>
          </div>

          <div className="p-5 flex-grow">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-4">Complexity</span>
            <div className="space-y-4">
              <ProgressField label="Fragments" percentage={Math.min(100, activeData.fragmentsCount * 25)} color="bg-pink-500" />
              <ProgressField label="Variables" percentage={activeData.variables !== "{}" ? 100 : 0} color="bg-blue-500" />
              <ProgressField label="Directives" percentage={Math.min(100, activeData.directivesCount * 50)} color="bg-zinc-600" />
            </div>
            
            <div className="mt-8 p-3 rounded bg-zinc-900/50 border border-zinc-800/50">
               <div className="text-[9px] font-bold text-zinc-500 uppercase mb-2">Structure Details</div>
               <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] text-zinc-400">Fragments: <span className="text-white">{activeData.fragmentsCount}</span></div>
                  <div className="text-[10px] text-zinc-400">Directives: <span className="text-white">{activeData.directivesCount}</span></div>
               </div>
            </div>
          </div>

          <div className="mt-auto p-4 border-t border-zinc-800 bg-black/40">
            <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
              Traffic Capture v2.0 <br />
              <span className="text-zinc-700">GraphQL Inspector Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, label, value, color }: { icon: any, label: string, value: string, color?: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-zinc-400">
      {icon}
      <span className="text-[10px] font-bold tracking-tight">{label}</span>
    </div>
    <span className={twMerge("text-[10px] font-mono font-bold", color || "text-zinc-200")}>{value}</span>
  </div>
);

const ProgressField = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[9px] font-bold uppercase tracking-tighter">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-300">{percentage}%</span>
    </div>
    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
      <div className={twMerge("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${percentage}%` }} />
    </div>
  </div>
);

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e] p-6 sm:p-10 text-center">
    <div>
      <div className="text-4xl mb-4 text-zinc-700 font-bold opacity-20">GraphQL</div>
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
