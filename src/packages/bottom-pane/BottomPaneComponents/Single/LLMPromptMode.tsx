import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";

export const LLMPromptMode = () => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    invoke<RequestPairData>("get_request_pair_data", { trafficId })
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [trafficId]);

  const llmData = useMemo(() => {
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
    } catch (e) {}
    return null;
  }, [data]);

  if (!trafficId) return <Placeholder text="Select a request to view LLM details" />;
  if (loading) return <Placeholder text="Loading data..." />;
  if (!llmData) return <Placeholder text="No LLM prompt detected. Currently supporting OpenAI-style 'messages' or Anthropic-style 'prompt'." />;

  return (
    <div className="h-full bg-[#0d0d0d] flex flex-col font-sans overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-zinc-900 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">AI</div>
          <div>
            <div className="text-sm font-bold text-zinc-200">{llmData.model}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">LLM PROMPT CONFIG</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
            {llmData.temperature !== undefined && (
                <div className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400">TEMP: {llmData.temperature}</div>
            )}
            {llmData.stream && (
                <div className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50">STREAMING</div>
            )}
        </div>
      </div>
      
      <div className="flex-grow overflow-auto p-4 space-y-4">
        {llmData.prompt ? (
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-500 mb-2 uppercase">Prompt</div>
                <div className="text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed">{llmData.prompt}</div>
            </div>
        ) : (
            llmData.messages.map((msg: any, i: number) => (
                <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 px-1">
                        <span className="text-[10px] uppercase font-black text-zinc-600 tracking-tighter">{msg.role}</span>
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : msg.role === 'system'
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700 italic'
                        : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800'
                    }`}>
                        {msg.content}
                    </div>
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
