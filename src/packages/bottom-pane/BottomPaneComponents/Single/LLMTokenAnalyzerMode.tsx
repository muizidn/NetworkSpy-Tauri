import React, { useState, useMemo, useEffect } from "react";
import { getEncoding } from "js-tiktoken";
import { FiHash, FiPieChart, FiInfo, FiCopy, FiZap, FiDatabase } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";

// Colors for token visualization
const TOKEN_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "bg-violet-500/20 text-violet-300 border-violet-500/30",
  "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
];

export const LLMTokenAnalyzerMode = () => {
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;
  const [encodingName, setEncodingName] = useState<"cl100k_base" | "p50k_base" | "r50k_base">("cl100k_base");
  
  // Real or Mock content
  const contentToAnalyze = useMemo(() => {
    return "NetworkSpy-Tauri is a powerful tool for inspecting network traffic, specifically optimized for LLM developers using Server-Sent Events (SSE) and complex tool-calling agents. It allows you to visualize tokens, analyze latency, and debug prompts with a premium developer experience.";
  }, []);

  const enc = useMemo(() => getEncoding(encodingName), [encodingName]);
  
  const tokenAnalysis = useMemo(() => {
    const tokens = enc.encode(contentToAnalyze);
    const decodedTokens = tokens.map(t => enc.decode([t]));
    
    return {
      tokens,
      decodedTokens,
      count: tokens.length,
      charCount: contentToAnalyze.length,
    };
  }, [contentToAnalyze, enc]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-zinc-300 overflow-hidden select-none font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/10 rounded-lg border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <FiHash className="text-indigo-500" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Token Analyzer</h2>
            <div className="flex items-center gap-2 font-mono">
               <span className="text-[10px] text-zinc-500 uppercase">Encoding:</span>
               <select 
                 value={encodingName}
                 onChange={(e) => setEncodingName(e.target.value as any)}
                 className="bg-zinc-800 text-[10px] text-zinc-300 border-none rounded px-2 py-0.5 outline-none cursor-pointer hover:bg-zinc-700 transition-colors"
               >
                 <option value="cl100k_base">cl100k_base (GPT-4 / 3.5)</option>
                 <option value="p50k_base">p50k_base (Codex)</option>
                 <option value="r50k_base">r50k_base (GPT-2)</option>
               </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <StatBox label="Tokens" value={tokenAnalysis.count} icon={<FiZap size={10} />} color="text-indigo-400" />
           <StatBox label="Characters" value={tokenAnalysis.charCount} icon={<FiInfo size={10} />} color="text-zinc-500" />
           <StatBox label="T/C Ratio" value={(tokenAnalysis.count / tokenAnalysis.charCount).toFixed(2)} icon={<FiPieChart size={10} />} color="text-emerald-400" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Token Visualizer */}
        <div className="w-2/3 flex flex-col border-r border-zinc-900 bg-black/10">
           <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Visual Breakdown</span>
              <button className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 hover:text-white transition-colors">
                 <FiCopy size={12} /> Copy IDs
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
              <div className="flex flex-wrap gap-y-2 leading-relaxed">
                 {tokenAnalysis.decodedTokens.map((token, i) => (
                   <span 
                     key={i}
                     className={twMerge(
                       "px-1 py-0.5 rounded-sm border ring-1 ring-inset ring-transparent hover:ring-white/20 transition-all cursor-default text-sm",
                       TOKEN_COLORS[i % TOKEN_COLORS.length]
                     )}
                     title={`Token ID: ${tokenAnalysis.tokens[i]}`}
                   >
                     {token === " " ? " \u00B7 " : token}
                   </span>
                 ))}
              </div>
           </div>
        </div>

        {/* Right: Technical Details & Cost */}
        <div className="w-1/3 flex flex-col bg-[#111314]">
           <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Technical Specs</span>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Cost Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-indigo-500/20 rounded">
                       <FiDatabase className="text-indigo-400" size={14} />
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-tighter">Cost Projection</span>
                 </div>
                 <div className="space-y-3">
                    <CostItem label="GPT-4o (Input)" rate="$5.00 / 1M" tokens={tokenAnalysis.count} cost={0.000005 * tokenAnalysis.count} />
                    <CostItem label="GPT-4o (Output)" rate="$15.00 / 1M" tokens={tokenAnalysis.count} cost={0.000015 * tokenAnalysis.count} />
                    <CostItem label="GPT-3.5 Turbo" rate="$0.50 / 1M" tokens={tokenAnalysis.count} cost={0.0000005 * tokenAnalysis.count} />
                 </div>
              </div>

              {/* Character Details */}
              <div className="space-y-4">
                 <h3 className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Byte Distribution</h3>
                 <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-500 w-[60%]" title="Alpha" />
                    <div className="h-full bg-emerald-500 w-[20%]" title="Numbers" />
                    <div className="h-full bg-amber-500 w-[15%]" title="Symbols" />
                    <div className="h-full bg-rose-500 w-[5%]" title="Whitespace" />
                 </div>
                 <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Alpha</div>
                    <div className="flex items-center gap-2 text-right justify-end">Numbers <span className="w-2 h-2 rounded-full bg-emerald-500" /></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Symbols</div>
                    <div className="flex items-center gap-2 text-right justify-end">Space <span className="w-2 h-2 rounded-full bg-rose-500" /></div>
                 </div>
              </div>
           </div>

           <div className="p-4 border-t border-zinc-900 bg-black/20 text-[9px] text-zinc-600 uppercase font-black tracking-widest text-center">
              Powered by Tiktoken WASM-Free Bridge
           </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, icon, color }: { label: string, value: any, icon: any, color: string }) => (
  <div className="flex flex-col items-end">
    <span className="text-[8px] uppercase font-bold text-zinc-600 tracking-tighter flex items-center gap-1">
       {icon} {label}
    </span>
    <span className={twMerge("text-sm font-mono font-bold leading-none mt-1", color)}>{value}</span>
  </div>
);

const CostItem = ({ label, rate, tokens, cost }: { label: string, rate: string, tokens: number, cost: number }) => (
  <div className="flex justify-between items-center group">
     <div className="flex flex-col">
        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">{label}</span>
        <span className="text-[8px] text-zinc-600 uppercase">{rate}</span>
     </div>
     <span className="text-[10px] font-mono text-emerald-400 font-bold">${cost.toFixed(6)}</span>
  </div>
);
