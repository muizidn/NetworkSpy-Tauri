import React, { useMemo, useState, useEffect } from "react";
import { FiMessageSquare, FiCpu, FiBarChart2, FiDollarSign, FiCode, FiLayers, FiCheckCircle, FiInfo } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { RequestPairData } from "../../RequestTab";
import { decodeBody, parseBodyAsJson, parseSSE } from "../../utils/bodyUtils";

export const LLMResponseMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;
  const [data, setData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);
  const [choiceIndex, setChoiceIndex] = useState(0);

  useEffect(() => {
    if (!selected) {
      setData(null); 
      return;
    }
    setLoading(true);
    setChoiceIndex(0); // Reset for new traffic
    provider.getResponsePairData(String(selected.id))
      .then(res => setData(res))
      .catch(error => {
        console.error("Failed to fetch response pair data:", error);
        setData(null); 
      })
      .finally(() => setLoading(false));
  }, [selected, provider]);

  const responseInfo = useMemo(() => {
    const body = data?.body;
    const contentType = data?.content_type || "";
    const headers = data?.headers || [];
    const transferEncoding = headers.find(h => h.key.toLowerCase() === 'transfer-encoding')?.value || "";
    
    // SSE detection: usually text/event-stream, often chunked
    const isSSE = contentType.toLowerCase().includes("event-stream") || 
                  (contentType.toLowerCase().includes("text/") && transferEncoding.toLowerCase().includes("chunked") && decodeBody(body).includes("data: "));

    if (isSSE) {
        return {
            content: parseSSE(body),
            model: "sse-stream",
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            finishReason: "stop",
            raw: null,
            choiceCount: 1
        };
    }

    const parsed = parseBodyAsJson(body);
    if (!parsed) {
        if (!body) return null;
        return { 
          content: decodeBody(body), 
          model: "raw-data", 
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          finishReason: "n/a",
          raw: null,
          choiceCount: 0
        };
    }

    try {
      const choices = parsed.choices || [];
      const choice = choices[choiceIndex] || choices[0] || {};
      
      const content = choice.message?.content || choice.text || parsed.content || "";
      const model = parsed.model || "unknown-model";
      const usage = parsed.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const finishReason = choice.finish_reason || "unknown";

      return { content, model, usage, finishReason, raw: parsed, choiceCount: choices.length };
    } catch (e) {
      return { 
        content: decodeBody(data?.body), 
        model: "raw-data", 
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        finishReason: "n/a",
        raw: null,
        choiceCount: 0
      };
    }
  }, [data, choiceIndex]);

  const renderContent = (content: any) => {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return (
        <div className="flex flex-col gap-4">
          {content.map((part, idx) => {
            if (part.type === 'text') {
              return <div key={idx} className="whitespace-pre-wrap">{part.text}</div>;
            }
            if (part.type === 'image_url') {
                return (
                  <div key={idx} className="relative group overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2">
                    <img 
                      src={part.image_url.url} 
                      alt="Response context" 
                      className="max-w-full h-auto max-h-96 object-contain rounded-lg"
                    />
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

  if (!selected) return <Placeholder text="Select a response to view LLM details" />;
  if (loading) return <Placeholder text="Fetching AI response data..." />;
  if (!responseInfo) return <Placeholder text="No valid LLM response body found" icon={<FiInfo size={32} />} />;

  const { content, model, usage, finishReason, choiceCount } = responseInfo;

  return (
    <div className="flex flex-col h-full bg-[#15181a] text-zinc-300 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-xl border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <FiMessageSquare className="text-blue-500" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">LLM Response Viewer</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                <FiCpu size={10} />
                {model}
              </span>
              <span className="text-[10px] text-zinc-700">•</span>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                 <FiCheckCircle size={10} />
                 {finishReason.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:p-6">
          {choiceCount > 1 && (
            <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800">
                {Array.from({ length: choiceCount }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setChoiceIndex(idx)}
                        className={twMerge(
                            "px-4 py-2 rounded text-[11px] font-bold transition-all",
                            choiceIndex === idx ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Choice {idx + 1}
                    </button>
                ))}
            </div>
          )}
          <div className="flex flex-col items-end border-l border-zinc-800 pl-6">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-tighter">Total Usage</span>
              <span className="text-sm font-mono text-blue-400 font-bold">{usage.total_tokens} tokens</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Metadata & Controls */}
        <div className="w-[30%] border-r border-zinc-900 bg-black/5 flex flex-col">
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Usage Stats Card */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2 mb-2">
                <FiBarChart2 size={12} /> Usage Analytics
              </h3>
              
              <div className="space-y-2">
                <UsageRow label="Prompt" value={usage.prompt_tokens} max={Math.max(usage.total_tokens, 100)} color="bg-blue-500" />
                <UsageRow label="Completion" value={usage.completion_tokens} max={Math.max(usage.total_tokens, 100)} color="bg-indigo-500" />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-emerald-500/80 uppercase font-bold text-[10px]">
                    <FiDollarSign size={12} /> Estimated Cost
                 </div>
                 <span className="text-xs font-mono text-emerald-400 font-bold">
                    ${((usage.prompt_tokens * 0.01 + usage.completion_tokens * 0.03) / 1000).toFixed(6)}
                 </span>
              </div>
            </div>

            {/* Model Details Card */}
            <div className="space-y-3">
              <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2 mb-2">
                <FiLayers size={12} /> Model Metadata
              </h3>
              <div className="space-y-1">
                 <MetaItem label="Model ID" value={model} />
                 <MetaItem label="Finish Reason" value={finishReason} />
                 <MetaItem label="Choices" value={choiceCount.toString()} />
                 <MetaItem label="Active Choice" value={`Choice ${choiceIndex + 1}`} />
              </div>
            </div>

            {/* Raw JSON Toggle placeholder */}
            <div className="pt-4 border-t border-zinc-800/50">
               <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold transition-all border border-zinc-600/20 active:scale-95">
                  <FiCode size={14} />
                  Deep Raw Inspection
               </button>
            </div>
          </div>
        </div>

        {/* Right: Message Content */}
        <div className="w-[70%] bg-[#111314] flex flex-col">
          <div className="px-6 py-3 bg-zinc-900/30 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-[0.2em] flex items-center justify-between">
            <span>Result Content</span>
            <span className="font-normal normal-case text-zinc-700 italic">assistant message • choice: {choiceIndex + 1} • {finishReason}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-4">
               {/* Content Rendering */}
               <div className="text-lg leading-relaxed text-zinc-200 font-serif">
                  {renderContent(content)}
               </div>
            </div>
          </div>

          {/* Footer bar */}
          <div className="px-6 py-3 border-t border-zinc-900 bg-black/20 flex gap-4 sm:p-6">
              <div className="flex items-center gap-2 text-[10px] text-zinc-600 italic">
                 <span className="block w-2 h-2 rounded-full bg-blue-500/40" />
                 Rendered in Markdown Pro
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const UsageRow = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-end">
      <span className="text-[10px] text-zinc-600 font-bold uppercase">{label}</span>
      <span className="text-[11px] font-mono text-zinc-400">{value} tokens</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div 
        className={twMerge("h-full rounded-full transition-all duration-1000", color)} 
        style={{ width: `${(value / max) * 100}%` }} 
      />
    </div>
  </div>
);

const MetaItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/30">
    <span className="text-[10px] text-zinc-600">{label}</span>
    <span className="text-[10px] font-mono text-zinc-300 truncate ml-4" title={value}>{value}</span>
  </div>
);

const Placeholder = ({ text, icon }: { text: string, icon?: React.ReactNode }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#15181a] p-6 sm:p-10 text-center">
      <div className="flex flex-col items-center gap-4">
        {icon || <div className="text-4xl text-blue-900 font-bold opacity-30">LLM Response</div>}
        <div className="text-sm max-w-md mx-auto">{text}</div>
      </div>
    </div>
);
