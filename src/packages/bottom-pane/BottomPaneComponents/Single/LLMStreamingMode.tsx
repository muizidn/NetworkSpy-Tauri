import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiZap, FiSettings, FiActivity, FiTerminal, FiDatabase, FiLayers } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { parseSSEChunks } from "../../utils/bodyUtils";

interface SSEChunk {
  id: string;
  event: string;
  data: string;
  content: string;
  timestamp: string;
  elapsedMs: number;
}

export const LLMStreamingMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;
  const [chunks, setChunks] = useState<SSEChunk[]>([]);
  const [accumulatedText, setAccumulatedText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hoveredChunkId, setHoveredChunkId] = useState<string | null>(null);
  const [targetChoiceIndex, setTargetChoiceIndex] = useState(0);
  const [isBeautified, setIsBeautified] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!selected) return;

    // Reset state for new selection
    setChunks([]);
    setAccumulatedText("");
    setIsStreaming(true);
    startTimeRef.current = Date.now();

    // 1. Pre-populate from existing response body if any
    provider.getResponsePairData(String(selected.id)).then(res => {
      if (res?.body) {
          const storedChunks = parseSSEChunks(res.body).map(c => ({
              ...c,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: "Captured",
              elapsedMs: 0
          }));
          
          if (storedChunks.length > 0) {
            setChunks(storedChunks);
            setAccumulatedText(storedChunks.map(c => c.content).join(""));
            
            // If the last stored chunk is [DONE], we can stop streaming status
            const hasDone = storedChunks.some(c => c.event === 'control' && c.data.includes('[DONE]'));
            if (hasDone) setIsStreaming(false);
          }
      }
    }).catch(() => {});

    // 2. Listen for live updates
    const cleanup = provider.listenSSE(String(selected.id), (rawData) => {
      let content = "";
      let eventType = "message";
      
      const cleanData = rawData.replace(/^data:\s*/, '').trim();

      if (cleanData === '[DONE]') {
        eventType = "control";
        setIsStreaming(false);
      } else {
        try {
          const parsed = JSON.parse(cleanData);
          const choices = parsed.choices || [];
          const choice = choices[targetChoiceIndex] || choices[0];
          const delta = choice?.delta;
          
          if (delta) {
             if (typeof delta.content === 'string') {
                 content = delta.content;
             } else if (Array.isArray(delta.content)) {
                 content = delta.content.map((p: any) => p.text || "").join("");
             }
          } else if (choice?.text) {
             content = choice.text;
          }
        } catch (e) {}
      }

      const newChunk: SSEChunk = {
        id: Math.random().toString(36).substr(2, 9),
        event: eventType,
        data: rawData,
        content: content,
        timestamp: new Date().toLocaleTimeString(),
        elapsedMs: Date.now() - startTimeRef.current
      };

      setChunks(prev => {
        // Prevent obvious duplicates if the listener replays chunks that were just loaded from the static body
        if (prev.some(p => p.data === rawData && p.timestamp === "Captured")) {
            return prev;
        }
        return [...prev, newChunk];
      });

      if (content) {
        setAccumulatedText(prev => {
            // Deduplicate logic for content if needed (optional, safer to rely on chunks for rendering)
            return prev + content;
        });
      }

      // Auto-scroll
      setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
      }, 50);
    });

    return () => {
        cleanup();
        setIsStreaming(false);
    };
  }, [selected, provider, targetChoiceIndex]);

  const choiceCount = useMemo(() => {
    let max = 1;
    chunks.forEach(c => {
        try {
            const clean = c.data.replace(/^data:\s*/, '').trim();
            if (clean !== '[DONE]') {
                const parsed = JSON.parse(clean);
                if (parsed.choices) {
                    parsed.choices.forEach((ch: any) => {
                        if (ch.index + 1 > max) max = ch.index + 1;
                    });
                }
            }
        } catch(e) {}
    });
    return max;
  }, [chunks]);

  if (!selected) return <div className="h-full flex items-center justify-center text-zinc-500 italic">Select a stream to inspect</div>;

  return (
    <div className="flex flex-col h-full bg-[#15181a] text-zinc-300 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 @sm:px-6 py-4 border-b border-zinc-800 bg-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <div className={twMerge(
            "p-2 rounded-lg",
            isStreaming ? "bg-amber-500/10" : "bg-emerald-500/10"
          )}>
            <FiZap className={isStreaming ? "text-amber-500 animate-pulse" : "text-emerald-500"} size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">LLM Stream Viewer</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <FiActivity size={10} />
                {isStreaming ? "STREAMING..." : "COMPLETED"}
              </span>
              <span className="text-[10px] text-zinc-700">•</span>
              <span className="text-[10px] text-zinc-500 font-mono">ID: {selected.id}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
            {choiceCount > 1 && (
                <div className="flex bg-black/40 rounded-lg p-1 border border-zinc-800 mr-2">
                    {Array.from({ length: choiceCount }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => {
                                setTargetChoiceIndex(idx);
                            }}
                            className={twMerge(
                                "px-4 py-2 rounded text-[11px] font-bold transition-all",
                                targetChoiceIndex === idx ? "bg-amber-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Choice {idx + 1}
                        </button>
                    ))}
                </div>
            )}
           <div className="flex flex-col items-end px-3 py-1 bg-black/20 rounded-md border border-zinc-800/50">
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-tighter">Event Count</span>
              <span className="text-xs font-mono text-blue-400 font-bold">{chunks.length}</span>
           </div>
           <button className="p-2 hover:bg-zinc-800 rounded-md text-zinc-500 hover:text-white transition-colors">
              <FiSettings size={16} />
           </button>
        </div>
      </div>

      {/* Main Container: Split View */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Stream List */}
        <div className="w-1/2 border-r border-zinc-900 flex flex-col bg-black/10">
          <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiTerminal size={12} className="text-zinc-500" />
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Raw Chunks</span>
            </div>
            <button
                onClick={() => setIsBeautified(!isBeautified)}
                className={twMerge(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest transition-all",
                    isBeautified ? "bg-amber-600 text-white shadow-lg" : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                )}
            >
                {isBeautified ? "Raw" : "Beautify"}
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar scroll-smooth">
            {chunks.map((chunk, i) => (
              <div 
                id={`chunk-${chunk.id}`}
                key={chunk.id} 
                onMouseEnter={() => {
                  setHoveredChunkId(chunk.id);
                  document.getElementById(`text-${chunk.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                onMouseLeave={() => setHoveredChunkId(null)}
                className={twMerge(
                  "group p-3 rounded-lg border flex flex-col gap-1 transition-all animate-in slide-in-from-left-2 duration-200",
                  chunk.event === 'control' 
                    ? "bg-amber-950/20 border-amber-900/30" 
                    : hoveredChunkId === chunk.id 
                      ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]"
                      : "bg-[#1e1e1e] border-zinc-800/50 hover:border-zinc-700"
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={twMerge(
                      "text-[9px] px-1.5 py-0.5 rounded uppercase font-bold",
                      chunk.event === 'control' ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {chunk.event}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-600">+{chunk.elapsedMs}ms</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 opacity-0 group-hover:opacity-100 italic transition-opacity">
                    {chunk.timestamp}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-zinc-300 break-all bg-black/20 p-2 rounded border border-white/5 overflow-x-auto">
                    {(() => {
                        if (!isBeautified) return chunk.data;
                        try {
                            const raw = chunk.data.replace(/^data:\s*/, '').trim();
                            if (raw === '[DONE]') return chunk.data;
                            return (
                                <pre className="whitespace-pre">
                                    {JSON.stringify(JSON.parse(raw), null, 2)}
                                </pre>
                            );
                        } catch (e) {
                            return chunk.data;
                        }
                    })()}
                </div>
              </div>
            ))}
            {chunks.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                 <FiLayers size={48} />
                 <p className="text-xs italic">Waiting for events...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Consolidated Output */}
        <div className="w-1/2 flex flex-col bg-[#111314]">
          <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiDatabase size={12} className="text-zinc-500" />
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Accumulated Output</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-600">{accumulatedText.length} bytes</span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            <div className="max-w-prose mx-auto">
              <div className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap font-sans transition-all">
                {chunks.map(chunk => (
                   <span 
                    id={`text-${chunk.id}`}
                    key={chunk.id} 
                    onMouseEnter={() => {
                      setHoveredChunkId(chunk.id);
                      document.getElementById(`chunk-${chunk.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }}
                    onMouseLeave={() => setHoveredChunkId(null)}
                    className={twMerge(
                      "transition-all duration-150 rounded-sm px-0.5 -mx-0.5",
                      hoveredChunkId === chunk.id ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400" : "hover:bg-zinc-800"
                    )}
                   >
                     {chunk.content}
                   </span>
                ))}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            </div>
            {!accumulatedText && !isStreaming && (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                <p className="text-xs uppercase tracking-widest font-bold">No output generated</p>
              </div>
            )}
          </div>

          {/* Prompt / Details Footer */}
          <div className="p-4 bg-black/20 border-t border-zinc-800">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <div className="flex gap-4">
                      <span>TOKENS: {accumulatedText.split(/\s+/).filter(x => x.length > 0).length}</span>
                      <span>CHAR: {accumulatedText.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className={twMerge(
                          "w-2 h-2 rounded-full",
                          isStreaming ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                      )} />
                      <span>{isStreaming ? "LIVE STREAM" : "COMPLETED"}</span>
                  </div>
              </div>
          </div>
        </div>

      </div>
    </div>
  );
};
