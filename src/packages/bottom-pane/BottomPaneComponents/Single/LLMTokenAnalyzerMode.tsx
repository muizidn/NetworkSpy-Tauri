import React, { useState, useMemo, useEffect } from "react";
import { getEncoding } from "js-tiktoken";
import { FiHash, FiPieChart, FiInfo, FiCopy, FiZap, FiDatabase, FiLayers, FiArrowRight, FiArrowLeft, FiActivity } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { RequestPairData } from "../../RequestTab";
import { decodeBody, parseBodyAsJson, parseSSE } from "../../utils/bodyUtils";

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
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;

  const [inputData, setInputData] = useState<RequestPairData | null>(null);
  const [outputData, setOutputData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"input" | "output">("output");
  const [encodingName, setEncodingName] = useState<"cl100k_base" | "p50k_base" | "r50k_base">("cl100k_base");
  const [inputChoiceIndex, setInputChoiceIndex] = useState(0);
  const [outputChoiceIndex, setOutputChoiceIndex] = useState(0);

  useEffect(() => {
    if (!selected) {
      setInputData(null);
      setOutputData(null);
      return;
    }
    setLoading(true);
    setInputChoiceIndex(0);
    setOutputChoiceIndex(0);

    Promise.all([
      provider.getRequestPairData(String(selected.id)).catch(() => null),
      provider.getResponsePairData(String(selected.id)).catch(() => null)
    ]).then(([req, res]) => {
      setInputData(req);
      setOutputData(res);
      // Default to whichever has content, prefer output if available
      if (res?.body) setViewMode("output");
      else if (req?.body) setViewMode("input");
    }).finally(() => setLoading(false));
  }, [selected, provider]);

  const extractText = (data: RequestPairData | null, type: 'input' | 'output') => {
    if (!data?.body) return "";
    
    const contentType = data.content_type || "";
    const headers = data.headers || [];
    const transferEncoding = headers.find(h => h.key.toLowerCase() === 'transfer-encoding')?.value || "";
    
    // SSE detection: usually text/event-stream, often chunked
    const isSSE = contentType.toLowerCase().includes("event-stream") || 
                  (contentType.toLowerCase().includes("text/") && transferEncoding.toLowerCase().includes("chunked") && decodeBody(data.body).includes("data: "));

    if (isSSE && type === 'output') {
        return parseSSE(data.body);
    }

    const parsed = parseBodyAsJson(data.body);
    if (!parsed) {
      return decodeBody(data.body);
    }

    try {
      const index = type === 'input' ? inputChoiceIndex : outputChoiceIndex;

      // Response patterns
      if (type === 'output') {
        const choices = parsed.choices || [];
        const choice = choices[index] || choices[0];
        const content = choice?.message?.content || choice?.text || parsed.content || "";

        if (Array.isArray(content)) {
          return content.map((p: any) => p.text || "").join("\n");
        }
        return String(content || "");
      }

      // Request patterns (Prompt)
      if (type === 'input') {
        if (parsed.messages && Array.isArray(parsed.messages)) {
          return parsed.messages.map((m: any) => {
            let contentStr = "";
            if (typeof m.content === 'string') {
              contentStr = m.content;
            } else if (Array.isArray(m.content)) {
              contentStr = m.content.map((p: any) => p.text || "").join("\n");
            }
            return `${m.role.toUpperCase()}:\n${contentStr}`;
          }).join("\n\n");
        }
        if (parsed.prompt) return parsed.prompt;
      }
    } catch (e) { }
    return decodeBody(data.body);
  };

  const inputText = useMemo(() => extractText(inputData, 'input'), [inputData, inputChoiceIndex]);
  const outputText = useMemo(() => extractText(outputData, 'output'), [outputData, outputChoiceIndex]);

  const enc = useMemo(() => getEncoding(encodingName), [encodingName]);

  const analyze = (text: string) => {
    if (!text) return { tokens: [], decodedTokens: [], count: 0, charCount: 0 };
    const tokens = enc.encode(text);
    const decodedTokens = tokens.map(t => enc.decode([t]));
    return {
      tokens,
      decodedTokens,
      count: tokens.length,
      charCount: text.length,
    };
  };

  const inputAnalysis = useMemo(() => analyze(inputText), [inputText, enc]);
  const outputAnalysis = useMemo(() => analyze(outputText), [outputText, enc]);

  const activeAnalysis = viewMode === "input" ? inputAnalysis : outputAnalysis;

  if (!selected) return <Placeholder text="Select a traffic item to analyze tokens" />;
  if (loading) return <Placeholder text="Analyzing full transaction..." icon={<FiLayers className="animate-spin" size={32} />} />;
  if (!inputText && !outputText) return <Placeholder text="No inspectable text found in either request or response" icon={<FiInfo size={32} />} />;

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-zinc-300 overflow-hidden select-none font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/10 rounded-lg border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <FiHash className="text-indigo-500" size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Token Intelligence</h2>
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

          {/* Input/Output Selector */}
          <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800">
            <button
              onClick={() => setViewMode("input")}
              className={twMerge(
                "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-2",
                viewMode === "input" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FiArrowRight size={12} className={viewMode === "input" ? "text-white" : "text-zinc-700"} />
              Input ({inputAnalysis.count})
            </button>
            <button
              onClick={() => setViewMode("output")}
              className={twMerge(
                "px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-2",
                viewMode === "output" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FiArrowLeft size={12} className={viewMode === "output" ? "text-white" : "text-zinc-700"} />
              Output ({outputAnalysis.count})
            </button>
          </div>

          {viewMode === "output" && (
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              {(() => {
                const choiceCount = (() => {
                  if (!outputData?.body) return 1;
                  try {
                    const parsed = parseBodyAsJson(outputData.body);
                    return parsed.choices?.length || 1;
                  } catch (e) { return 1; }
                })();

                if (choiceCount <= 1) return null;

                return Array.from({ length: choiceCount }).map((_, n) => (
                  <button
                    key={n}
                    onClick={() => setOutputChoiceIndex(n)}
                    className={twMerge(
                      "px-4 py-2 rounded text-[11px] font-bold transition-all",
                      outputChoiceIndex === n ? "bg-zinc-700 text-white shadow-md" : "text-zinc-600 hover:text-zinc-500"
                    )}
                  >
                    Choice {n + 1}
                  </button>
                ));
              })()}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <StatBox label="Total Transaction" value={inputAnalysis.count + outputAnalysis.count} icon={<FiActivity size={10} />} color="text-amber-400" />
          <StatBox label="Active Tokens" value={activeAnalysis.count} icon={<FiZap size={10} />} color="text-indigo-400" />
          <StatBox label="Active T/C" value={activeAnalysis.charCount > 0 ? (activeAnalysis.count / activeAnalysis.charCount).toFixed(2) : "0.00"} icon={<FiPieChart size={10} />} color="text-emerald-400" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Token Visualizer */}
        <div className="w-2/3 flex flex-col border-r border-zinc-900 bg-black/10">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Visual Breakdown - {viewMode.toUpperCase()}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(activeAnalysis.tokens.join(", "))}
              className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-600 hover:text-white transition-colors"
            >
              <FiCopy size={12} /> Copy IDs
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
            {activeAnalysis.count > 0 ? (
              <div className="flex flex-wrap gap-y-2 leading-relaxed">
                {activeAnalysis.decodedTokens.map((token, i) => (
                  <span
                    key={i}
                    className={twMerge(
                      "px-1 py-0.5 rounded-sm border ring-1 ring-inset ring-transparent hover:ring-white/20 transition-all cursor-default text-sm",
                      TOKEN_COLORS[i % TOKEN_COLORS.length]
                    )}
                    title={`Token ID: ${activeAnalysis.tokens[i]}`}
                  >
                    {token === " " ? " \u00B7 " : token === "\n" ? " \u21B5 " : token}
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-700 italic text-sm">
                No content to visualize for this {viewMode}
              </div>
            )}
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
                <span className="text-xs font-bold text-white uppercase tracking-tighter">Full Transaction Cost</span>
              </div>
              <div className="space-y-3">
                <CostItem
                  label="GPT-4o (Combined)"
                  rate="In: $5 / Out: $15"
                  input={inputAnalysis.count}
                  output={outputAnalysis.count}
                  cost={(0.000005 * inputAnalysis.count) + (0.000015 * outputAnalysis.count)}
                />
                <CostItem
                  label="GPT-3.5 Turbo"
                  rate="In: $0.5 / Out: $1.5"
                  input={inputAnalysis.count}
                  output={outputAnalysis.count}
                  cost={(0.0000005 * inputAnalysis.count) + (0.0000015 * outputAnalysis.count)}
                />
              </div>
            </div>

            {/* Character Details */}
            <div className="space-y-4">
              <h3 className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{viewMode} Byte Distribution</h3>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-500 w-[60%]" />
                <div className="h-full bg-emerald-500 w-[20%]" />
                <div className="h-full bg-amber-500 w-[15%]" />
                <div className="h-full bg-rose-500 w-[5%]" />
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

const CostItem = ({ label, rate, input, output, cost }: { label: string, rate: string, input: number, output: number, cost: number }) => (
  <div className="flex justify-between items-start group border-b border-white/5 pb-2">
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white transition-colors">{label}</span>
      <span className="text-[8px] text-zinc-600 uppercase mb-1">{rate}</span>
      <div className="flex gap-2 text-[8px] font-mono text-zinc-500">
        <span>IN: {input}</span>
        <span>OUT: {output}</span>
      </div>
    </div>
    <span className="text-[10px] font-mono text-emerald-400 font-bold">${cost.toFixed(6)}</span>
  </div>
);

const Placeholder = ({ text, icon = null }: { text: string, icon?: React.ReactNode }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0d0d0d] p-10 text-center">
    <div className="flex flex-col items-center gap-4">
      {icon || <div className="text-4xl text-indigo-900 font-bold opacity-30">Token Intelligence</div>}
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
