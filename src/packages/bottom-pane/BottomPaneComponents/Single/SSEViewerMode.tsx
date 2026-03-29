import React, { useState, useEffect, useRef } from "react";
import { FiZap, FiSettings, FiActivity, FiTerminal, FiDatabase, FiLayers, FiInfo, FiAlertCircle, FiBell } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";

interface SSEEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  delayMs: number;
}

export const SSEViewerMode = () => {
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selected) return;

    setEvents([]);
    setIsLive(true);
    setSelectedEventId(null);

    const mockEventsList = [
      { type: "connection", data: { status: "connected", id: "conn_8219" } },
      { type: "stock_update", data: { symbol: "AAPL", price: 154.21, change: "+1.2%" } },
      { type: "notification", data: { title: "New Message", from: "Jane Doe" } },
      { type: "stock_update", data: { symbol: "TSLA", price: 682.11, change: "-0.8%" } },
      { type: "system_alert", data: { severity: "INFO", message: "Backup completed" } },
      { type: "stock_update", data: { symbol: "GOOGL", price: 2750.93, change: "+0.5%" } },
      { type: "heartbeat", data: { timestamp: Date.now() } },
      { type: "stock_update", data: { symbol: "MSFT", price: 310.45, change: "+1.8%" } },
      { type: "notification", data: { title: "Meeting Reminder", at: "14:00" } },
      { type: "error", data: { code: 5003, details: "Invalid session" } },
    ];

    let count = 0;
    const startTime = Date.now();

    const interval = setInterval(() => {
      if (count >= mockEventsList.length) {
        setIsLive(false);
        clearInterval(interval);
        return;
      }

      const eventData = mockEventsList[count];
      const newEvent: SSEEvent = {
        id: `ev_${Math.random().toString(36).substr(2, 5)}`,
        type: eventData.type,
        data: eventData.data,
        timestamp: new Date().toLocaleTimeString(),
        delayMs: Date.now() - startTime
      };

      setEvents(prev => [...prev, newEvent]);
      count++;

      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 800);

    return () => clearInterval(interval);
  }, [selected]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  if (!selected) return null;

  return (
    <div className="flex flex-col h-full bg-[#15181a] text-zinc-300 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FiZap className={isLive ? "text-amber-500 animate-pulse" : "text-blue-500"} size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">SSE Event Stream</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                <FiActivity size={10} />
                {isLive ? "LIVE STREAM ACTIVE" : "STREAM CLOSED"}
              </span>
              <span className="text-[10px] text-zinc-700">•</span>
              <span className="text-[10px] text-blue-400 font-bold uppercase">{selected.method}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="px-2 py-1 bg-black/20 rounded border border-zinc-800/50 flex flex-col items-center min-w-[50px]">
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Events</span>
              <span className="text-xs font-mono font-bold text-white">{events.length}</span>
            </div>
          </div>
          <button className="p-2 hover:bg-zinc-800 rounded transition-colors text-zinc-500 hover:text-white">
            <FiSettings size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Event List Table */}
        <div className="w-1/2 flex flex-col border-r border-zinc-900 bg-black/5">
          <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 sticky top-0 z-10">
            <FiTerminal size={12} className="text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Live Events</span>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#1e1e1e]/50 sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter w-24">Time</th>
                  <th className="px-1 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Event Type</th>
                  <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-right">Delay</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr 
                    key={event.id}
                    onClick={() => setSelectedEventId(event.id)}
                    className={twMerge(
                      "group border-b border-zinc-800/30 cursor-pointer transition-colors animate-in fade-in slide-in-from-top-1 duration-300",
                      selectedEventId === event.id ? "bg-blue-600/10" : "hover:bg-zinc-800/40"
                    )}
                  >
                    <td className="px-4 py-2.5 text-[10px] font-mono text-zinc-500">{event.timestamp.split(' ')[0]}</td>
                    <td className="px-1 py-2.5">
                      <div className="flex items-center gap-2">
                        {renderEventTypeIcon(event.type)}
                        <span className={twMerge(
                          "text-[10px] font-bold uppercase py-0.5 px-2 rounded",
                          getTypeColor(event.type)
                        )}>
                          {event.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] font-mono text-right text-zinc-600">+{event.delayMs}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale py-20">
                <FiZap size={48} className="mb-4" />
                <p className="text-sm italic">Waiting for SSE events...</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Event Inspector */}
        <div className="w-1/2 flex flex-col bg-[#111314]">
          <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 shrink-0">
            <FiDatabase size={12} className="text-zinc-500" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Event Inspector</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {selectedEvent ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Internal ID</span>
                    <span className="text-xs font-mono text-blue-400 font-bold">{selectedEvent.id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Exact Arrival</span>
                    <span className="text-xs font-mono text-zinc-400">{selectedEvent.timestamp}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-widest flex items-center gap-2">
                      <FiLayers size={12} /> Data Payload
                    </h3>
                    <div className="bg-black/40 rounded-xl border border-zinc-800 p-4 font-mono text-xs text-zinc-300 relative overflow-hidden">
                       <pre>{JSON.stringify(selectedEvent.data, null, 2)}</pre>
                       <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                          <FiDatabase size={40} />
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/50">
                        <span className="text-[9px] uppercase font-bold text-zinc-600 block mb-1">Raw Payload Size</span>
                        <span className="text-xs font-mono text-zinc-300">{JSON.stringify(selectedEvent.data).length} bytes</span>
                     </div>
                     <div className="p-3 bg-zinc-900/40 rounded-lg border border-zinc-800/50">
                        <span className="text-[9px] uppercase font-bold text-zinc-600 block mb-1">Protocol Header</span>
                        <span className="text-xs font-mono text-zinc-300">data: ...\n\n</span>
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-10">
                <FiInfo size={32} className="mb-4 opacity-30" />
                <p className="text-xs font-bold uppercase tracking-widest mb-1">Property Inspector</p>
                <p className="text-[11px] leading-relaxed italic">Select an event from the list on the left to see detailed data payload and metadata.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const renderEventTypeIcon = (type: string) => {
  switch (type) {
    case "error": return <FiAlertCircle size={14} className="text-rose-500" />;
    case "notification": return <FiBell size={14} className="text-amber-500" />;
    case "system_alert": return <FiInfo size={14} className="text-blue-500" />;
    default: return <FiDatabase size={14} className="text-zinc-500" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "error": return "bg-rose-500/20 text-rose-500 border border-rose-500/20";
    case "stock_update": return "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20";
    case "notification": return "bg-amber-500/20 text-amber-500 border border-amber-500/20";
    case "system_alert": return "bg-blue-500/20 text-blue-500 border border-blue-500/20";
    case "heartbeat": return "bg-purple-500/20 text-zinc-500 border border-purple-500/20";
    default: return "bg-zinc-800 text-zinc-400";
  }
};
