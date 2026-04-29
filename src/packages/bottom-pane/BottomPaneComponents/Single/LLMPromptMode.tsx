import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { twMerge } from "tailwind-merge";
import { FiTerminal, FiBox, FiCpu, FiUser, FiInfo, FiCopy, FiCheck } from "react-icons/fi";
import { decodeBody, parseBodyAsJson } from "../../utils/bodyUtils";

interface Tool {
  type: string;
  function: {
    name: string;
    description?: string;
    parameters?: any;
  };
}

interface Message {
  role: string;
  content: string | any[] | null;
  tool_calls?: {
    id: string;
    type: string;
    function: { name: string; arguments: string }
  }[];
  tool_call_id?: string;
  name?: string;
}

interface LLMData {
  messages?: Message[];
  prompt?: string;
  model: string;
  temperature?: number;
  stream?: boolean;
  tools?: Tool[];
}

export const LLMPromptMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;
  const [data, setData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) {
      setData(null);
      return;
    }
    setLoading(true);
    provider.getRequestPairData(String(selected.id))
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selected, provider]);

  const llmData = useMemo<LLMData | null>(() => {
    const body = data?.body;
    const parsed = parseBodyAsJson(body);
    if (!parsed) {
      if (!body) return null;
      return {
        prompt: decodeBody(body),
        model: "raw-text"
      };
    }

    try {
      if (parsed.messages && Array.isArray(parsed.messages)) {
        return {
          messages: parsed.messages,
          model: parsed.model || "unknown",
          temperature: parsed.temperature,
          stream: parsed.stream,
          tools: parsed.tools,
        };
      }

      if (parsed.prompt) {
        return {
          prompt: parsed.prompt,
          model: parsed.model || "unknown"
        };
      }

      if (typeof parsed === 'string' || parsed.text) {
        return {
          prompt: parsed.text || parsed,
          model: "generic-input"
        };
      }
    } catch (e) {
      return {
        prompt: decodeBody(body),
        model: "raw-text"
      };
    }
    return null;
  }, [data]);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [collapsedMsgs, setCollapsedMsgs] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"messages" | "tools">("messages");

  // Reset selected tool when switching tabs or when tools change
  useEffect(() => {
    if (llmData?.tools && llmData.tools.length > 0 && !selectedTool) {
      setSelectedTool(llmData.tools[0]);
    }
  }, [llmData?.tools]);

  const toggleCollapse = (index: number) => {
    setCollapsedMsgs(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const filteredMessages = useMemo(() => {
    if (!llmData?.messages) return [];
    return llmData.messages.filter(msg => {
      const matchesRole = roleFilter === "all" || msg.role === roleFilter;
      const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || "");
      const toolCallsStr = msg.tool_calls ? JSON.stringify(msg.tool_calls) : "";
      const matchesSearch = searchQuery === "" ||
        contentStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        toolCallsStr.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [llmData, roleFilter, searchQuery]);

  const toolUsageMap = useMemo(() => {
    const usage: Record<string, number> = {};
    if (!llmData?.messages) return usage;
    
    llmData.messages.forEach(msg => {
      if (msg.tool_calls) {
        msg.tool_calls.forEach(tc => {
          const name = tc.function.name;
          usage[name] = (usage[name] || 0) + 1;
        });
      }
    });
    return usage;
  }, [llmData?.messages]);

  const renderContent = (content: any, isCollapsed = false) => {
    if (typeof content === 'string') {
      if (isCollapsed) return content.length > 120 ? content.substring(0, 120) + "..." : content;
      return content;
    }
    if (Array.isArray(content)) {
      if (isCollapsed) return "[Complex Content Block]";
      return (
        <div className="flex flex-col gap-3">
          {content.map((part, idx) => {
            if (part.type === 'text') {
              return <div key={idx} className="whitespace-pre-wrap">{part.text}</div>;
            }
            if (part.type === 'image_url') {
              return (
                <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/10 bg-black/40">
                  <img
                    src={part.image_url.url}
                    alt="Prompt context"
                    className="max-w-full h-auto max-h-64 object-contain transition-transform group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[8px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    IMAGE: {part.image_url.url.substring(0, 50)}...
                  </div>
                </div>
              );
            }
            return <div key={idx} className="text-zinc-500 italic text-xs">[{part.type} content block]</div>;
          })}
        </div>
      );
    }
    return String(content || "");
  };

  if (!selected) return <Placeholder text="Select a request to view LLM details" />;
  if (loading) return <Placeholder text="Analyzing prompt data..." />;
  if (!llmData) return <Placeholder text="No valid LLM prompt pattern detected" icon={<FiInfo size={32} />} />;

  return (
    <div className="h-full bg-[#0d0d0d] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/20">AI</div>
          <div>
            <div className="text-sm font-bold text-zinc-200">{llmData.model}</div>
            <div className="text-[10px] text-zinc-500 tracking-widest font-black">LLM PROMPT CONFIG</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {llmData.temperature !== undefined && (
            <div className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono tracking-tighter">TEMP: {llmData.temperature}</div>
          )}
          {llmData.stream && (
            <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50 font-bold tracking-widest">STREAMING</div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center px-4 bg-zinc-900/50 border-b border-zinc-800 shrink-0">
        <button 
          onClick={() => setActiveTab("messages")}
          className={twMerge(
            "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
            activeTab === "messages" ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          Conversation
          {activeTab === "messages" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
        </button>
        {llmData.tools && llmData.tools.length > 0 && (
          <button 
            onClick={() => setActiveTab("tools")}
            className={twMerge(
              "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative",
              activeTab === "tools" ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Tools ({llmData.tools.length})
            {activeTab === "tools" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
          </button>
        )}
      </div>

      {activeTab === "messages" ? (
        <>
          {/* Filter / Search Bar */}
          {llmData.messages && (
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800">
            {["all", "user", "assistant", "tool", "system"].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={twMerge(
                  "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                  roleFilter === role ? "bg-zinc-700 text-white shadow-md" : "text-zinc-500 hover:text-zinc-400"
                )}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[150px]">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Message List */}
      <div className="flex-grow overflow-auto p-4 @sm:p-6 space-y-6 custom-scrollbar bg-black/20">
        {llmData.prompt ? (
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-xl">
            <div className="text-[10px] font-bold text-zinc-500 mb-3 tracking-widest">Prompt</div>
            <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed font-serif">{llmData.prompt}</div>
          </div>
        ) : (
          filteredMessages.map((msg, i) => (
            <div key={i} className={twMerge(
              "flex flex-col gap-2 w-full max-w-[90%] transition-all",
              (msg.role === 'user' || msg.role === 'tool') ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'
            )}>
              <div className="flex items-center gap-2 px-1">
                <span className={twMerge(
                  "text-[9px] font-bold tracking-widest flex items-center gap-1.5",
                  msg.role === 'system' ? 'text-zinc-500'
                    : msg.role === 'user' ? 'text-blue-400'
                      : msg.role === 'tool' ? 'text-amber-500'
                        : 'text-emerald-400',
                  (msg.role === 'user' || msg.role === 'tool') && "flex-row-reverse"
                )}>
                  {msg.role === 'user' && <FiUser size={10} />}
                  {msg.role === 'assistant' && <FiCpu size={10} />}
                  {msg.role === 'tool' && <FiTerminal size={10} />}
                  {msg.role}
                </span>
                {msg.name && <span className="text-[8px] text-zinc-600 bg-white/5 px-1 rounded">NAME: {msg.name}</span>}
                <button 
                  onClick={() => toggleCollapse(i)}
                  className="text-[8px] text-zinc-700 hover:text-zinc-400 uppercase font-black tracking-widest transition-colors ml-2"
                >
                  {collapsedMsgs.has(i) ? "[Expand]" : "[Collapse]"}
                </button>
              </div>

              {msg.content && (
                <div 
                  onClick={() => toggleCollapse(i)}
                  className={twMerge(
                    "rounded-2xl px-5 py-3 text-[13px] leading-relaxed shadow-lg border w-fit cursor-pointer hover:border-zinc-700 transition-colors",
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                      : msg.role === 'system'
                        ? 'bg-zinc-900/80 text-zinc-500 border-zinc-800 italic text-xs'
                        : msg.role === 'tool'
                          ? 'bg-amber-950/20 text-amber-500 border-amber-900/30 font-mono text-[11px] rounded-tr-none'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-800 rounded-tl-none',
                    collapsedMsgs.has(i) && "max-h-16 overflow-hidden"
                  )}
                >
                  {renderContent(msg.content, collapsedMsgs.has(i))}
                  {collapsedMsgs.has(i) && (
                    <div className="mt-1 text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1 group-hover:text-white/60 transition-colors">
                      See More <FiInfo size={8} />
                    </div>
                  )}
                </div>
              )}

              {msg.tool_calls?.map((tc, j) => (
                <div key={j} className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-4 w-full animate-in slide-in-from-right-2 duration-300 shadow-lg text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBox className="text-purple-400" size={14} />
                    <span className="text-[10px] font-bold text-purple-400 tracking-widest">Tool Call Request</span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-black/40 rounded-lg p-3 border border-purple-900/20">
                    <span className="text-xs font-bold text-white font-mono">{tc.function.name}()</span>
                    <span className="text-[11px] text-purple-300 font-mono opacity-80 break-all whitespace-pre-wrap">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(tc.function.arguments), null, 2);
                        } catch (e) {
                          return tc.function.arguments;
                        }
                      })()}
                    </span>
                  </div>
                </div>
              ))}
              </div>
            ))
          )}
            {llmData.messages && filteredMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50 py-20">
                <FiInfo size={40} className="mb-4" />
                <p className="text-sm">No messages match your current filters</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-grow flex overflow-hidden">
          {/* Tool List Sidebar */}
          <div className="w-64 border-r border-zinc-800 overflow-y-auto custom-scrollbar shrink-0 bg-black/20">
            {llmData.tools?.map((tool, idx) => {
              const usageCount = toolUsageMap[tool.function.name] || 0;
              const isUsed = usageCount > 0;
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedTool(tool)}
                  className={twMerge(
                    "w-full px-4 py-3 text-left border-b border-zinc-800/50 transition-all group",
                    selectedTool?.function.name === tool.function.name ? "bg-purple-600/10 border-r-2 border-r-purple-500" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={twMerge(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        selectedTool?.function.name === tool.function.name ? "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" 
                          : isUsed ? "bg-emerald-500/80" : "bg-zinc-700"
                      )} />
                      <span className={twMerge(
                        "text-[11px] font-bold truncate",
                        selectedTool?.function.name === tool.function.name ? "text-purple-300" 
                          : isUsed ? "text-zinc-200" : "text-zinc-400 group-hover:text-zinc-200"
                      )}>
                        {tool.function.name}
                      </span>
                    </div>
                    {isUsed && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-900/30 text-purple-400 font-black border border-purple-900/50 shrink-0">
                        {usageCount}
                      </span>
                    )}
                  </div>
                  {tool.function.description && (
                    <p className="text-[9px] text-zinc-600 line-clamp-1 italic">{tool.function.description}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tool Detail Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/40">
            {selectedTool ? (
              <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase italic">{selectedTool.function.name}</h2>
                    <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">TYPE: {selectedTool.type}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-900/20">
                    <FiBox size={20} />
                  </div>
                </div>

                {selectedTool.function.description && (
                  <div className="mb-8 group relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Description</div>
                      <CopyButton text={selectedTool.function.description} />
                    </div>
                    <div className="bg-zinc-900/50 rounded-2xl p-5 text-sm text-zinc-300 leading-relaxed italic">
                      {selectedTool.function.description}
                    </div>
                  </div>
                )}

                <div className="group relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Parameter Schema</div>
                    <CopyButton text={JSON.stringify(selectedTool.function.parameters, null, 2)} />
                  </div>
                  <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <div className="flex items-center px-4 py-2 bg-zinc-900/50">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500/20" />
                        <div className="w-2 h-2 rounded-full bg-amber-500/20" />
                        <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono ml-4 uppercase tracking-widest">JSON SCHEMA</span>
                    </div>
                    <pre className="p-6 font-mono text-xs text-purple-300 leading-relaxed overflow-x-auto custom-scrollbar">
                      {JSON.stringify(selectedTool.function.parameters, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                <FiBox size={48} className="mb-4" />
                <p className="text-sm">Select a tool to view its full definition</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={twMerge(
        "flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-700 text-[9px] font-bold transition-all border border-zinc-700/50 opacity-0 group-hover:opacity-100",
        copied ? "text-emerald-400 border-emerald-900/50 bg-emerald-950/20" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {copied ? (
        <>
          <FiCheck size={10} />
          COPIED
        </>
      ) : (
        <>
          <FiCopy size={10} />
          COPY
        </>
      )}
    </button>
  );
};

const Placeholder = ({ text, icon = null }: { text: string, icon?: any }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0d0d0d] p-6 @sm:p-10 text-center">
    <div className="flex flex-col items-center gap-4">
      {icon || <div className="text-4xl text-green-900 font-bold opacity-30">LLM Prompt</div>}
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
