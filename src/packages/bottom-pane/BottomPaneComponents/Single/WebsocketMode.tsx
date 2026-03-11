import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo } from "react";

export const WebsocketMode = () => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);

  // Mock messages
  const messages = useMemo(() => [
    { id: 1, type: 'sent', data: '{"type":"subscribe","channel":"ticker"}', time: '10:42:01.123' },
    { id: 2, type: 'received', data: '{"type":"welcome","client_id":"abc-123"}', time: '10:42:01.456' },
    { id: 3, type: 'received', data: '{"type":"ticker","symbol":"BTC-USD","price":"64231.50"}', time: '10:42:02.001' },
    { id: 4, type: 'received', data: '{"type":"ticker","symbol":"BTC-USD","price":"64232.10"}', time: '10:42:03.111' },
    { id: 5, type: 'sent', data: '{"type":"ping"}', time: '10:42:05.000' },
    { id: 6, type: 'received', data: '{"type":"pong"}', time: '10:42:05.100' },
  ], []);

  if (!trafficId) return <div className="h-full flex items-center justify-center text-zinc-500">Select a websocket connection</div>;

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="flex items-center px-4 py-2 border-b border-zinc-800 bg-zinc-900 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black bg-cyan-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter">WebSocket</span>
          <span className="text-[10px] text-zinc-500 font-mono uppercase">Connection ID: {trafficId}</span>
        </div>
        <div className="text-[10px] text-green-500 font-bold uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            Connected
        </div>
      </div>
      
      <div className="flex-grow overflow-auto p-2 space-y-1 font-mono text-[11px]">
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-4 p-1.5 rounded hover:bg-zinc-800 transition-colors group border border-transparent hover:border-zinc-700">
            <span className="text-zinc-600 w-16 shrink-0">{msg.time}</span>
            <span className={`w-4 shrink-0 flex justify-center font-bold ${msg.type === 'sent' ? 'text-blue-400' : 'text-purple-400'}`}>
                {msg.type === 'sent' ? '↑' : '↓'}
            </span>
            <span className="text-zinc-300 break-all">{msg.data}</span>
          </div>
        ))}
        <div className="pt-4 text-center text-zinc-700 text-[10px] uppercase font-bold tracking-[0.2em]">End of logged messages</div>
      </div>

      <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Send message to WebSocket..." 
                className="flex-grow bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-cyan-600 transition-colors"
                disabled
              />
              <button className="bg-zinc-800 text-zinc-400 px-4 py-1.5 rounded text-xs font-bold opacity-50 cursor-not-allowed">Send</button>
          </div>
      </div>
    </div>
  );
};
