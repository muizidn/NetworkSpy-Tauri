import React, { useMemo } from "react";
import { FiMessageSquare, FiCpu, FiBarChart2, FiDollarSign, FiCode, FiLayers, FiCheckCircle } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";

export const LLMResponseMode = () => {
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;

  if (!selected) return null;

  // Mock OpenAI-style response extraction
  const mockResponse = {
    id: "chatcmpl-8Sj92k1Lx91O",
    model: "gpt-4-turbo-preview",
    created: Date.now(),
    choices: [
      {
        message: {
          role: "assistant",
          content: "To implement better LLM observability, you should focus on tracking not just token counts but also latency distributions (P50, P99) and semantic cache hit rates. This allows you to differentiate between genuine network lag and inference-time variability.\n\n### Key Metrics:\n- Prompt Tokens: 452\n- Completion Tokens: 128\n- Latency: 1.2s"
        },
        finish_reason: "stop"
      }
    ],
    usage: {
      prompt_tokens: 452,
      completion_tokens: 128,
      total_tokens: 580
    }
  };

  const content = mockResponse.choices[0].message.content;
  const model = mockResponse.model;
  const usage = mockResponse.usage;

  return (
    <div className="flex flex-col h-full bg-[#15181a] text-zinc-300 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#1e1e1e] shrink-0">
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
                 COMPLETED
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
           <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-tighter">Total Usage</span>
              <span className="text-sm font-mono text-blue-400 font-bold">{usage.total_tokens} tokens</span>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Metadata & Controls */}
        <div className="w-[30%] border-r border-zinc-900 bg-black/5 flex flex-col">
          <div className="p-6 space-y-6">
            
            {/* Usage Stats Card */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2 mb-2">
                <FiBarChart2 size={12} /> Usage Analytics
              </h3>
              
              <div className="space-y-2">
                <UsageRow label="Prompt" value={usage.prompt_tokens} max={600} color="bg-blue-500" />
                <UsageRow label="Completion" value={usage.completion_tokens} max={600} color="bg-indigo-500" />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                 <div className="flex items-center gap-2 text-emerald-500/80 uppercase font-bold text-[10px]">
                    <FiDollarSign size={12} /> Estimated Cost
                 </div>
                 <span className="text-xs font-mono text-emerald-400 font-bold">$0.0054</span>
              </div>
            </div>

            {/* Model Details Card */}
            <div className="space-y-3">
              <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2 mb-2">
                <FiLayers size={12} /> Model Metadata
              </h3>
              <div className="space-y-1">
                 <MetaItem label="Model ID" value={model} />
                 <MetaItem label="Object Type" value="chat.completion" />
                 <MetaItem label="Fingerprint" value="fp_447062904" />
                 <MetaItem label="System Prob" value="0.992" />
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
            <span className="font-normal normal-case text-zinc-700 italic">assistant message • stop reason: normal</span>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-4">
               {/* Content Rendering */}
               <div className="text-lg leading-relaxed text-zinc-200 font-serif whitespace-pre-wrap">
                  {content}
               </div>
            </div>
          </div>

          {/* Footer bar */}
          <div className="px-6 py-3 border-t border-zinc-900 bg-black/20 flex gap-6">
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
    <span className="text-[10px] font-mono text-zinc-300">{value}</span>
  </div>
);
