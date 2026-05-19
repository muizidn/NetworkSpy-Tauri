import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../../main-content/context/TrafficList";
import { RequestPairData } from "../../../RequestTab";
import { twMerge } from "tailwind-merge";
import { FiActivity, FiBox, FiTerminal, FiLayers, FiCode, FiAlertTriangle, FiZap, FiGrid, FiInfo } from "react-icons/fi";
import { decodeBody, parseBodyAsJson } from "../../../utils/bodyUtils";
import { useMemo, useState, useEffect } from "react";
import { ParsedGraphQLItem } from "./types";
import { graphqlParsers } from "./parsers";
import { GraphQLRequest } from "./components/GraphQLRequest";
import { GraphQLVariables } from "./components/GraphQLVariables";
import { GraphQLExtensions } from "./components/GraphQLExtensions";
import { GraphQLResponse } from "./components/GraphQLResponse";
import { Sidebar } from "./components/Sidebar";

import { ViewerPlaceholder } from "../../../ViewerPlaceholder";

const GraphQLPlaceholder = ({ text, subtext }: { text: string; subtext?: string }) => (
  <ViewerPlaceholder
    title={text}
    subtext={subtext}
    type="GraphQL"
    hint="Build a specialized viewer to cater to unique GraphQL implementations like LinkedIn, Reddit, or X."
  />
);

export const GraphQLMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selectedTraffic = selections.firstSelected;
  const trafficId = useMemo(() => selectedTraffic?.id as string, [selectedTraffic]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [responseData, setResponseData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"query" | "variables" | "response" | "extensions">("query");
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
    const urlStr = (selectedTraffic?.url as string) || "";
    const rawParsed = parseBodyAsJson(data?.body);

    for (const parserKey in graphqlParsers) {
      const parser = graphqlParsers[parserKey];
      if (parser.match(urlStr, rawParsed)) {
        return parser.parse(urlStr, rawParsed);
      }
    }

    return [];
  }, [data, selectedTraffic]);

  const activeData = useMemo(() => {
    return gqlItems[selectedIndex] || gqlItems[0] || null;
  }, [gqlItems, selectedIndex]);

  const responseBody = useMemo(() => {
    return decodeBody(responseData?.body, "application/json");
  }, [responseData]);

  const hasErrors = useMemo(() => {
    try {
      if (!responseBody) return false;
      const parsed = JSON.parse(responseBody);
      return Array.isArray(parsed.errors) && parsed.errors.length > 0;
    } catch {
      return false;
    }
  }, [responseBody]);

  if (!trafficId || gqlItems.length === 0) return <GraphQLPlaceholder text="No GraphQL Detected" subtext="We couldn't find a standard GraphQL query in this request. If this is a custom GraphQL implementation, you can create a specialized viewer for it." />;
  if (loading) return <GraphQLPlaceholder text="Analyzing Traffic..." subtext="Inspecting request body and headers for GraphQL structures..." />;

  const isBatched = gqlItems.length > 1;

  if (!activeData) return <GraphQLPlaceholder text="Invalid Query" subtext="The detected GraphQL content could not be correctly parsed into operations." />;

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
              {hasErrors && (
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
            <div className="text-[10px] text-zinc-500 tracking-widest font-black">
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
                "flex-1 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === "query" ? "text-pink-500 bg-pink-500/5 border-b-2 border-pink-500" : "text-zinc-500"
              )}
            >
              <FiCode size={12} />
              Query
            </button>
            <button
              onClick={() => setActiveTab("response")}
              className={twMerge(
                "flex-1 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === "response" ? "text-emerald-500 bg-emerald-500/5 border-b-2 border-emerald-500" : "text-zinc-500"
              )}
            >
              <FiTerminal size={12} />
              Result
            </button>
            {activeData.extensions && (
              <button
                onClick={() => setActiveTab("extensions")}
                className={twMerge(
                  "flex-1 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 transition-all",
                  activeTab === "extensions" ? "text-amber-500 bg-amber-500/5 border-b-2 border-amber-500" : "text-zinc-500"
                )}
              >
                <FiActivity size={12} />
                Ext
              </button>
            )}
          </div>

          {/* Left Section: Query + Variables */}
          <div className={twMerge(
            "flex flex-col h-full overflow-hidden transition-all duration-300",
            layoutMode === 'grid' ? "@5xl:w-5/12 border-r border-zinc-900" : "flex-grow",
            layoutMode === 'grid' ? (activeTab !== "query" && "hidden @5xl:flex") : (activeTab !== "query" && "hidden")
          )}>
            <GraphQLRequest activeData={activeData} layoutMode={layoutMode} activeTab={activeTab} />
            <GraphQLVariables activeData={activeData} layoutMode={layoutMode} activeTab={activeTab} />
          </div>

          {/* Right Section: Extensions + Response */}
          <div className={twMerge(
            "flex flex-col overflow-hidden h-full",
            layoutMode === 'grid' ? "@5xl:w-7/12" : "flex-grow",
            layoutMode === 'grid' ? (activeTab === "query" && "hidden @5xl:flex") : (activeTab === "query" && "hidden")
          )}>
            <div className="flex-grow flex flex-col overflow-hidden">
              <GraphQLExtensions activeData={activeData} layoutMode={layoutMode} activeTab={activeTab} />
              <GraphQLResponse responseBody={responseBody} layoutMode={layoutMode} activeTab={activeTab} />
            </div>
          </div>
        </div>

        <Sidebar showSidebar={showSidebar} activeData={activeData} responseBody={responseBody} hasErrors={hasErrors} />
      </div>
    </div>
  );
};

