import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { useBottomPaneContext } from "@src/context/BottomPaneContext";
import { FiSearch } from "react-icons/fi";
import { BsPinAngleFill } from "react-icons/bs";
import { twMerge } from "tailwind-merge";

export const BottomPaneOptions = () => {
  const { setMode, selectionType, setSelectionType, mode: currentMode } = useBottomPaneContext();
  const { selections } = useTrafficListContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedModes, setPinnedModes] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("pinned-bottom-pane-modes") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("pinned-bottom-pane-modes", JSON.stringify(pinnedModes));
  }, [pinnedModes]);

  useEffect(() => {
    if (!selections.firstSelected) {
      setSelectionType("none");
    } else if (selections.others && selections.others.length > 1) {
      setSelectionType("multiple");
    } else {
      setSelectionType("single");
    }
  }, [selections, setSelectionType]);

  const togglePin = (mode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedModes(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const optionsBySelection = {
    none: [
      { id: "summary", title: "Summary", onClick: () => setMode("summary") },
      { id: "health_timeline", title: "Health History", onClick: () => setMode("health_timeline") },
      { id: "status_distribution", title: "Status Map", onClick: () => setMode("status_distribution") },
      { id: "method_distribution", title: "Method Usage", onClick: () => setMode("method_distribution") },
    ],

    single: [
      { id: "request_response", title: "Request Response", onClick: () => setMode("request_response") },
      { id: "query_params", title: "Query Params", onClick: () => setMode("query_params") },
      { id: "cookies", title: "Cookies", onClick: () => setMode("cookies") },
      { id: "header_explainer", title: "Header Explainer", onClick: () => setMode("header_explainer") },
      { id: "json_tree", title: "JSON Tree", onClick: () => setMode("json_tree") },
      { id: "curl", title: "cURL", onClick: () => setMode("curl") },
      { id: "code_snippet", title: "Code Snippet", onClick: () => setMode("code_snippet") },
      { id: "sensitive_data", title: "Sensitive Data", onClick: () => setMode("sensitive_data") },
      { id: "auth_analysis", title: "Auth Analysis", onClick: () => setMode("auth_analysis") },
      { id: "jwt_decoder", title: "JWT Decoder", onClick: () => setMode("jwt_decoder") },
      { id: "ai_debug", title: "AI Debug", onClick: () => setMode("ai_debug") },
      { id: "ai_test", title: "AI Test", onClick: () => setMode("ai_test") },
      { id: "graphql", title: "GraphQL", onClick: () => setMode("graphql") },
      { id: "llm_prompt", title: "LLM Prompt", onClick: () => setMode("llm_prompt") },
      { id: "llm_response", title: "LLM Response", onClick: () => setMode("llm_response") },
      { id: "llm_streaming", title: "LLM Streaming", onClick: () => setMode("llm_streaming") },
      { id: "llm_token_analyzer", title: "LLM Token Analyzer", onClick: () => setMode("llm_token_analyzer") },
      { divider: true },
      { id: "security_owasp", title: "OWASP Top 10", onClick: () => setMode("security_owasp") },
      { id: "security_mobsf", title: "MobSF Mobile", onClick: () => setMode("security_mobsf") },
      { id: "security_static", title: "Fast Static Check", onClick: () => setMode("security_static") },
      { divider: true },
      { id: "hex_viewer", title: "HEX Viewer", onClick: () => setMode("hex_viewer") },
      { id: "image_viewer", title: "Image Viewer", onClick: () => setMode("image_viewer") },
      { id: "html_viewer", title: "Browser Preview", onClick: () => setMode("html_viewer") },
      { id: "xml_viewer", title: "XML Viewer", onClick: () => setMode("xml_viewer") },
      { id: "audio_viewer", title: "Audio Stream", onClick: () => setMode("audio_viewer") },
      { id: "video_viewer", title: "Video Viewer", onClick: () => setMode("video_viewer") },
      { id: "js_viewer", title: "JavaScript Viewer", onClick: () => setMode("js_viewer") },
      { id: "css_viewer", title: "CSS Viewer", onClick: () => setMode("css_viewer") },
      { id: "ts_viewer", title: "TypeScript Viewer", onClick: () => setMode("ts_viewer") },
      { divider: true },
      { id: "json_transformer", title: "JSON Transformer", onClick: () => setMode("json_transformer") },
      { id: "json_schema", title: "JSON Schema", onClick: () => setMode("json_schema") },
      { id: "soap_viewer", title: "SOAP Inspector", onClick: () => setMode("soap_viewer") },
      { id: "protobuf_viewer", title: "Protobuf Decoder", onClick: () => setMode("protobuf_viewer") },
      { id: "grpc_viewer", title: "gRPC Observer", onClick: () => setMode("grpc_viewer") },
      {id: "rabbitmq_viewer", title: "RabbitMQ/AMQP", onClick: () => setMode("rabbitmq_viewer") },
      { id: "kafka_viewer", title: "Kafka/Message", onClick: () => setMode("kafka_viewer") },
      { divider: true },
      { id: "firebase_viewer", title: "Firebase Context", onClick: () => setMode("firebase_viewer") },
      { id: "supabase_viewer", title: "Supabase context", onClick: () => setMode("supabase_viewer") },
      { id: "appwrite_viewer", title: "Appwrite Context", onClick: () => setMode("appwrite_viewer") },
      { id: "ads_viewer", title: "Ads Inspector", onClick: () => setMode("ads_viewer") },
    ],

    multiple: [
      { id: "timeline", title: "Timeline", onClick: () => setMode("timeline") },
      { id: "waterfall", title: "Waterfall", onClick: () => setMode("waterfall") },
      { id: "diff", title: "Diff (Compare)", onClick: () => setMode("diff") },
      { id: "compare", title: "Compare Table", onClick: () => setMode("compare") },
      { id: "performance", title: "Performance", onClick: () => setMode("performance") },
      { id: "endpoint_summary", title: "Endpoint Summary", onClick: () => setMode("endpoint_summary") },
      { id: "batch_analyze", title: "Batch Analyze", onClick: () => setMode("batch_analyze") },
      { id: "security_scan", title: "Security Scan", onClick: () => setMode("security_scan") },
      { id: "ai_security", title: "AI Security", onClick: () => setMode("ai_security") },
      { id: "ai_summary", title: "AI Summary", onClick: () => setMode("ai_summary") },
      { id: "ai_investigate", title: "AI Investigate", onClick: () => setMode("ai_investigate") },
    ],
  };

  interface ViewerOption {
    id?: string;
    title?: string;
    onClick?: () => void;
    divider?: boolean;
  }

  const allOptions: ViewerOption[] = optionsBySelection[selectionType] || [];

  const filteredAndSortedOptions = useMemo(() => {
    return allOptions
      .filter(opt => {
        if (opt.divider) return !searchTerm; // Hide dividers when searching
        return opt.title?.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        if (a.divider || b.divider) return 0;
        const aPinned = pinnedModes.includes(a.id!);
        const bPinned = pinnedModes.includes(b.id!);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
  }, [allOptions, searchTerm, pinnedModes]);

  return (
    <div className="flex items-center border-y border-black bg-[#0c0c0c] h-9 relative">
      {/* Search Input */}
      <div className="flex items-center px-3 border-r border-zinc-800 h-full group">
        <FiSearch className="text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={14} />
        <input
          type="text"
          placeholder="Search viewer..."
          className="bg-transparent border-none outline-none text-[11px] text-zinc-300 ml-2 w-24 focus:w-40 transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Options List */}
      <div className="flex-1 flex items-center px-1 gap-1 overflow-x-auto no-scrollbar scroll-smooth h-full">
        {filteredAndSortedOptions.map((opt, idx) => {
          if (opt.divider) {
            return <div key={`divider-${idx}`} className="h-4 w-px bg-white/10 mx-1 shrink-0" />;
          }

          const isPinned = pinnedModes.includes(opt.id!);
          const isActive = currentMode === opt.id;

          return (
            <button
              key={opt.id}
              onClick={opt.onClick}
              className={twMerge(
                "group relative flex items-center h-6 px-3 rounded-md transition-all duration-200 whitespace-nowrap text-[11px] font-medium shrink-0",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800/50"
              )}
            >
              {opt.title}
              <BsPinAngleFill
                onClick={(e: React.MouseEvent) => togglePin(opt.id!, e)}
                className={twMerge(
                  "ml-2 cursor-pointer hidden group-hover:block transition-all duration-200",
                  isPinned ? "text-blue-300 scale-110" : "text-zinc-600 hover:text-zinc-100"
                )}
                size={10}
              />
            </button>
          );
        })}

        {filteredAndSortedOptions.length === 0 && (
          <span className="text-[10px] text-zinc-600 italic px-4">No viewer match your search...</span>
        )}
      </div>

      {/* Scroll Indicator Shadow */}
      <div className="w-8 h-full bg-gradient-to-l from-[#0c0c0c] to-transparent pointer-events-none absolute right-0" />
    </div>
  );
};