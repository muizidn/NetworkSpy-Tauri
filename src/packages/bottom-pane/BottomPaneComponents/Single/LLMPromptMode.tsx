import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { twMerge } from "tailwind-merge";

import { FiTerminal, FiBox, FiCpu, FiUser } from "react-icons/fi";

interface LLMData {
  messages?: {
    role: string;
    content: string | null;
    tool_calls?: {
      id: string;
      type: string;
      function: { name: string; arguments: string }
    }[];
    tool_call_id?: string;
    name?: string;
  }[];
  prompt?: string;
  model: string;
  temperature?: number;
  stream?: boolean;
}

export const LLMPromptMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    provider.getRequestPairData(trafficId)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [trafficId, provider]);

  const llmData = useMemo<LLMData | null>(() => {
    if (!data?.body) return null;
    try {
      const parsed = JSON.parse(data.body);
      if (parsed.messages && Array.isArray(parsed.messages)) {
        return {
          messages: parsed.messages,
          model: parsed.model || "unknown",
          temperature: parsed.temperature,
          stream: parsed.stream,
        };
      }
      // Anthropic style
      if (parsed.prompt) {
        return {
          prompt: parsed.prompt,
          model: parsed.model || "unknown"
        };
      }
    } catch (e) { }
    return null;
  }, [data]);

  const mockLLMData: LLMData = {
    messages: [
      { role: "system", content: "You are a helpful assistant with access to local tools." },
      { role: "user", content: "What is the weather in Jakarta right now?" },
      {
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "call_9kL1",
          type: "function",
          function: { name: "get_weather", arguments: '{"location": "Jakarta"}' }
        }]
      },
      {
        role: "tool",
        tool_call_id: "call_9kL1",
        name: "get_weather",
        content: '{"temperature": 32, "condition": "Sunny", "humidity": 70}'
      },
      { role: "assistant", content: "The current weather in Jakarta is sunny with a temperature of 32°C and 70% humidity." }
    ],
    model: "gpt-4-turbo",
    temperature: 0.7,
    stream: true
  };

  const activeData = (llmData || mockLLMData) as LLMData;

  if (!trafficId && !activeData) return <Placeholder text="Select a request to view LLM details" />;
  if (loading) return <Placeholder text="Loading data..." />;

  return (
    <div className="h-full bg-[#0d0d0d] flex flex-col font-sans overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-900/20">AI</div>
          <div>
            <div className="text-sm font-bold text-zinc-200">{activeData.model}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">LLM PROMPT CONFIG</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {activeData.temperature !== undefined && (
            <div className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 font-mono tracking-tighter">TEMP: {activeData.temperature}</div>
          )}
          {activeData.stream && (
            <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50 font-bold tracking-widest">STREAMING</div>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-auto p-6 space-y-6 custom-scrollbar bg-black/20">
        {activeData.prompt ? (
          <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800 shadow-xl">
            <div className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest">Prompt</div>
            <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed font-serif">{activeData.prompt}</div>
          </div>
        ) : (
          activeData.messages?.map((msg, i) => (
            <div key={i} className={twMerge(
              "flex flex-col gap-2 w-full max-w-[90%]",
              msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
            )}>
              <div className="flex items-center gap-2 px-1">
                <span className={twMerge(
                  "text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5",
                  msg.role === 'system' ? 'text-zinc-500'
                    : msg.role === 'user' ? 'text-blue-400'
                      : msg.role === 'tool' ? 'text-amber-500'
                        : 'text-emerald-400'
                )}>
                  {msg.role === 'user' && <FiUser size={10} />}
                  {msg.role === 'assistant' && <FiCpu size={10} />}
                  {msg.role === 'tool' && <FiTerminal size={10} />}
                  {msg.role}
                </span>
              </div>

              {msg.content && (
                <div className={twMerge(
                  "rounded-2xl px-5 py-3 text-[13px] leading-relaxed shadow-lg border w-fit",
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                    : msg.role === 'system'
                      ? 'bg-zinc-900/80 text-zinc-500 border-zinc-800 italic text-xs'
                      : msg.role === 'tool'
                        ? 'bg-amber-950/20 text-amber-500 border-amber-900/30 font-mono text-[11px]'
                        : 'bg-zinc-900 text-zinc-200 border-zinc-800 rounded-tl-none'
                )}>
                  {msg.content}
                </div>
              )}

              {msg.tool_calls?.map((tc, j) => (
                <div key={j} className="bg-purple-950/20 border border-purple-900/30 rounded-xl p-4 w-full animate-in slide-in-from-left-2 duration-300 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FiBox className="text-purple-400" size={14} />
                    <span className="text-[10px] font-bold uppercase text-purple-400 tracking-widest">Tool Call</span>
                  </div>
                  <div className="flex flex-col gap-1.5 bg-black/40 rounded-lg p-3 border border-purple-900/20">
                    <span className="text-xs font-bold text-white font-mono">{tc.function.name}()</span>
                    <span className="text-[11px] text-purple-300 font-mono opacity-80 break-all">{tc.function.arguments}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0d0d0d] p-10 text-center">
    <div>
      <div className="text-4xl mb-4 text-green-900 font-bold opacity-30">LLM Prompt</div>
      <div className="text-sm max-w-md mx-auto">{text}</div>
    </div>
  </div>
);
