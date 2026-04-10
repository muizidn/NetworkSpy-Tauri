import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { twMerge } from "tailwind-merge";
import { FiTerminal, FiBox, FiCpu, FiUser, FiInfo } from "react-icons/fi";
import { decodeBody, parseBodyAsJson } from "../../utils/bodyUtils";

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

  const renderContent = (content: any) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
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
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">LLM PROMPT CONFIG</div>
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

      {/* Filter / Search Bar */}
      {llmData.messages && (
        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/50 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800">
            {["all", "user", "assistant", "tool", "system"].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={twMerge(
                  "px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all",
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
            <div className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest">Prompt</div>
            <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed font-serif">{llmData.prompt}</div>
          </div>
        ) : (
          filteredMessages.map((msg, i) => (
            <div key={i} className={twMerge(
              "flex flex-col gap-2 w-full max-w-[90%]",
              (msg.role === 'user' || msg.role === 'tool') ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'
            )}>
              <div className="flex items-center gap-2 px-1">
                <span className={twMerge(
                  "text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5",
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
              </div>

              {msg.content && (
                <div className={twMerge(
                  "rounded-2xl px-5 py-3 text-[13px] leading-relaxed shadow-lg border w-fit",
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                    : msg.role === 'system'
                      ? 'bg-zinc-900/80 text-zinc-500 border-zinc-800 italic text-xs'
                      : msg.role === 'tool'
                        ? 'bg-amber-950/20 text-amber-500 border-amber-900/30 font-mono text-[11px] rounded-tr-none'
                        : 'bg-zinc-900 text-zinc-200 border-zinc-800 rounded-tl-none'
                )}>
                  {renderContent(msg.content)}
                </div>
              )}

              {msg.tool_calls?.map((tc, j) => (
                <div key={j} className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-4 w-full animate-in slide-in-from-right-2 duration-300 shadow-lg text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBox className="text-purple-400" size={14} />
                    <span className="text-[10px] font-bold uppercase text-purple-400 tracking-widest">Tool Call Request</span>
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
    </div>
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
