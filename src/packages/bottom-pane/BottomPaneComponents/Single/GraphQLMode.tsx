import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { twMerge } from "tailwind-merge";
import { FiActivity, FiCpu, FiBox, FiTerminal, FiInfo, FiLayers, FiCode, FiCheckCircle, FiAlertTriangle, FiZap, FiGrid } from "react-icons/fi";
import { decodeBody, parseBodyAsJson } from "../../utils/bodyUtils";
import { useMemo, useState, useEffect } from "react";
import { MonacoEditor } from "@src/packages/ui/MonacoEditor";

type GqlMechanism = "Standard POST" | "Batched POST" | "GET Query Params" | "Persisted Query (queryId)" | "LinkedIn Specialized";

export const GraphQLMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selectedTraffic = selections.firstSelected;
  const trafficId = useMemo(() => selectedTraffic?.id as string, [selectedTraffic]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [responseData, setResponseData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"query" | "variables" | "response">("query");
  const [showSidebar, setShowSidebar] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"grid" | "tabbed">("grid");

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    setSelectedIndex(0); // Reset on new selection
    setActiveTab("query"); // Reset tab
    Promise.all([
      provider.getRequestPairData(trafficId),
      provider.getResponsePairData(trafficId)
    ]).then(([req, res]) => {
      setData(req);
      setResponseData(res);
    }).finally(() => setLoading(false));
  }, [trafficId, provider]);

  const gqlItems = useMemo(() => {
    let items: any[] = [];
    let mechanism: GqlMechanism = "Standard POST";

    const urlStr = (selectedTraffic?.url as string) || "";

    // 1. Try URL Query Parameters (GET requests)
    if (urlStr.includes("graphql")) {
      try {
        const url = new URL(urlStr, "https://local.capture");
        const qId = url.searchParams.get("queryId") || url.searchParams.get("id");
        const query = url.searchParams.get("query");
        const variables = url.searchParams.get("variables");

        if (qId || query || url.searchParams.get("extensions")) {
          mechanism = qId ? "Persisted Query (queryId)" : "GET Query Params";
          if (urlStr.includes("linkedin.com")) mechanism = "LinkedIn Specialized";

          items.push({
            query: query || (qId ? `Persisted Query: ${qId}` : "// No Query Body"),
            variables: variables || "{}",
            extensions: url.searchParams.get("extensions") || null,
            operationName: url.searchParams.get("operationName") || qId || "GET Operation",
            isPersisted: !!qId
          });
        }
      } catch (e) {
        console.error("Failed to parse URL for GQL", e);
      }
    }

    // 2. Try Request Body (POST/PUT)
    if (items.length === 0) {
      const rawParsed = parseBodyAsJson(data?.body);
      if (rawParsed) {
        const bodyItems = Array.isArray(rawParsed) ? (rawParsed as any[]) : [rawParsed];
        if (Array.isArray(rawParsed)) mechanism = "Batched POST";

        bodyItems.forEach((parsed, idx) => {
          if (parsed.query || parsed.queryId || parsed.operationName || parsed.extensions) {
            items.push({
              query: parsed.query || (parsed.queryId ? `Persisted Query: ${parsed.queryId}` : "// No Query Body"),
              variables: parsed.variables ? JSON.stringify(parsed.variables, null, 2) : "{}",
              extensions: parsed.extensions ? JSON.stringify(parsed.extensions, null, 2) : null,
              operationName: parsed.operationName || `Operation ${idx + 1}`,
              queryId: parsed.queryId,
              isPersisted: !!parsed.queryId
            });
          }
        });
      }
    }

    return items.map((item) => {
      try {
        const queryStr = item.query.trim();
        let type = "QUERY";
        if (queryStr.toLowerCase().startsWith("mutation")) type = "MUTATION";
        if (queryStr.toLowerCase().startsWith("subscription")) type = "SUBSCRIPTION";

        const fragmentsCount = (queryStr.match(/fragment\s+/g) || []).length;
        const directivesCount = (queryStr.match(/@\w+/g) || []).length;
        const depth = Math.max(0, ...queryStr.split('\n').map((line: string) => (line.match(/\{/g) || []).length)) + 1;

        return {
          ...item,
          type,
          fragmentsCount,
          directivesCount,
          depth,
          mechanism
        };
      } catch (e) { }
      return null;
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data, selectedTraffic]);

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
          <div className="hidden @sm:block">
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
              {activeData.isPersisted && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">
                  <FiBox size={10} />
                  PERSISTED
                </div>
              )}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
              {isBatched ? `BATCHED (${gqlItems.length} OPERATIONS)` : `GRAPHQL ${activeData.type}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 @sm:gap-4">
          {/* Layout Mode Toggle (Desktop only) */}
          <div className="hidden @5xl:flex items-center bg-black/40 rounded-lg p-0.5 border border-zinc-800 mr-2 shrink-0">
            <button
              onClick={() => setLayoutMode("grid")}
              className={twMerge(
                "p-1.5 rounded-md transition-all",
                layoutMode === "grid" ? "bg-zinc-800 text-pink-400 shadow-xl" : "text-zinc-600 hover:text-zinc-400"
              )}
              title="Multi-Pane Layout"
            >
              <FiGrid size={14} />
            </button>
            <button
              onClick={() => setLayoutMode("tabbed")}
              className={twMerge(
                "p-1.5 rounded-md transition-all",
                layoutMode === "tabbed" ? "bg-zinc-800 text-pink-400 shadow-xl" : "text-zinc-600 hover:text-zinc-400"
              )}
              title="Focused Tab Layout"
            >
              <FiLayers size={14} />
            </button>
          </div>

          {isBatched && (
            <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800 shrink-0">
              {gqlItems.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={twMerge(
                    "px-2 @sm:px-3 py-1 @sm:py-1.5 rounded text-[9px] @sm:text-[10px] font-bold transition-all",
                    selectedIndex === idx ? "bg-pink-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                  )}
                >
                  Op {idx + 1}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={twMerge(
              "p-2 rounded-lg border border-zinc-800 transition-all",
              showSidebar ? "bg-zinc-800 text-pink-400" : "bg-black/40 text-zinc-600 hover:text-zinc-400"
            )}
            title="Toggle Inspection Sidebar"
          >
            <FiInfo size={16} />
          </button>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden relative">
        {/* Main Content Areas */}
        <div className={twMerge(
          "flex-grow flex flex-col overflow-hidden bg-black/20",
          layoutMode === "grid" && "@5xl:flex-row"
        )}>

          {/* Tab Navigation for Mobile/Cramped Views */}
          <div className={twMerge(
            "flex bg-zinc-900 border-b border-zinc-800 h-10 shrink-0",
            layoutMode === "grid" && "@5xl:hidden"
          )}>
            <button
              onClick={() => setActiveTab("query")}
              className={twMerge(
                "flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === "query" ? "text-pink-500 bg-pink-500/5 border-b-2 border-pink-500" : "text-zinc-500"
              )}
            >
              <FiCode size={12} />
              Query
            </button>
            <button
              onClick={() => setActiveTab("variables")}
              className={twMerge(
                "flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === "variables" ? "text-blue-500 bg-blue-500/5 border-b-2 border-blue-500" : "text-zinc-500"
              )}
            >
              <FiLayers size={12} />
              Vars
            </button>
            <button
              onClick={() => setActiveTab("response")}
              className={twMerge(
                "flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === "response" ? "text-emerald-500 bg-emerald-500/5 border-b-2 border-emerald-500" : "text-zinc-500"
              )}
            >
              <FiTerminal size={12} />
              Result
            </button>
            {activeData.extensions && (
              <button
                onClick={() => setActiveTab("extensions" as any)}
                className={twMerge(
                  "flex-1 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                  (activeTab as any) === "extensions" ? "text-amber-500 bg-amber-500/5 border-b-2 border-amber-500" : "text-zinc-500"
                )}
              >
                <FiActivity size={12} />
                Ext
              </button>
            )}
          </div>

          {/* Editor Pane: Query */}
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
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  {activeData.isPersisted ? "Persisted Query ID" : "Query Definition"}
                </span>
              </div>
              {activeData.isPersisted && (
                <div className="text-[8px] font-black text-pink-400 uppercase bg-pink-400/10 px-2 py-0.5 rounded border border-pink-400/20">
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

          {/* Right Section: Variables + Extensions + Response */}
          <div className={twMerge(
            "flex flex-col overflow-hidden h-full",
            layoutMode === 'grid' ? "@5xl:w-7/12" : "flex-grow",
            layoutMode === 'grid' ? (activeTab === "query" && "hidden @5xl:flex") : (activeTab === "query" && "hidden")
          )}>
            <div className="flex-grow flex flex-col overflow-hidden">
              {/* Variables */}
              <div className={twMerge(
                "flex flex-col border-b border-zinc-900 transition-all",
                activeTab === "response" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
                (activeTab as any) === "extensions" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
                activeTab === "variables" ? "flex-grow" : (layoutMode === 'grid' ? "h-1/3" : "hidden")
              )}>
                <div className={twMerge(
                  "hidden items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30",
                  layoutMode === 'grid' && "@5xl:flex"
                )}>
                  <FiLayers className="text-blue-500" size={14} />
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Variables</span>
                </div>
                <div className="flex-grow bg-black/30">
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
              </div>

              {/* Extensions */}
              {activeData.extensions && (
                <div className={twMerge(
                  "flex flex-col border-b border-zinc-900 transition-all",
                  activeTab === "response" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
                  activeTab === "variables" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
                  (activeTab as any) === "extensions" ? "flex-grow" : (layoutMode === 'grid' ? "h-1/3" : "hidden")
                )}>
                  <div className={twMerge(
                    "hidden items-center gap-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30",
                    layoutMode === 'grid' && "@5xl:flex"
                  )}>
                    <FiActivity className="text-amber-500" size={14} />
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Extensions</span>
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
              )}

              {/* Response */}
              <div className={twMerge(
                "flex flex-col bg-[#050505] transition-all",
                activeTab === "variables" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
                (activeTab as any) === "extensions" && (layoutMode === 'grid' ? "hidden @5xl:flex" : "hidden"),
                activeTab === "response" ? "flex-grow" : (layoutMode === 'grid' ? "h-1/3" : "hidden")
              )}>
                <div className={twMerge(
                  "hidden items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-900/50",
                  layoutMode === 'grid' && "@5xl:flex"
                )}>
                  <FiTerminal className="text-emerald-500" size={14} />
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Response Payload</span>
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
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className={twMerge(
          "absolute inset-y-0 right-0 z-20 w-64 bg-[#111] border-l border-zinc-800 flex flex-col transition-all duration-500 ease-in-out shadow-2xl",
          "@5xl:relative @5xl:translate-x-0 @5xl:shadow-none",
          showSidebar ? "translate-x-0" : "translate-x-full @5xl:hidden @5xl:w-0"
        )}>
          <div className="p-4 border-b border-zinc-800 bg-black/20 shrink-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block mb-4">Inspection</span>

            <div className="space-y-4">
              <SidebarItem
                icon={<FiCheckCircle size={14} />}
                label="Status"
                value={responseBody?.includes('"errors"') ? "Failed" : "Success"}
                color={responseBody?.includes('"errors"') ? "text-rose-500" : "text-emerald-500"}
              />
              <SidebarItem icon={<FiCpu size={14} />} label="Mechanism" value={activeData.mechanism} color="text-pink-400" />
              <SidebarItem icon={<FiBox size={14} />} label="Nested Depth" value={`${activeData.depth} Levels`} />
              <SidebarItem icon={<FiInfo size={14} />} label="Type" value={activeData.type} />
            </div>
          </div>

          <div className="p-5 flex-grow overflow-y-auto no-scrollbar pb-20">
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

          <div className="mt-auto p-4 border-t border-zinc-800 bg-black/40 shrink-0">
            <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
              Capture v2.0 <br />
              <span className="text-zinc-700">GraphQL Engine</span>
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
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e] p-6 @sm:p-10 text-center">
    <div>
      <div className="text-4xl mb-4 text-zinc-700 font-bold opacity-20">GraphQL</div>
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
