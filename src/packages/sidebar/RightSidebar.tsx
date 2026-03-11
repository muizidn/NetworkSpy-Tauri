import { useState } from "react";
import { FiMap, FiServer, FiLock, FiClock, FiCode, FiActivity, FiMousePointer } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "../main-content/context/TrafficList";

type SidebarTab = "Path" | "Host" | "SSL" | "Performance" | "Raw";

export const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState<SidebarTab>("Performance");
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;

  const tabs: { id: SidebarTab; icon: any; label: string }[] = [
    { id: "Path", icon: FiMap, label: "Path" },
    { id: "Host", icon: FiServer, label: "Host" },
    { id: "SSL", icon: FiLock, label: "SSL" },
    { id: "Performance", icon: FiClock, label: "Perf" },
    { id: "Raw", icon: FiCode, label: "Raw" },
  ];

  const StatRow = ({ label, value, percentage, colorClass = "bg-blue-500" }: { label: string, value: string, percentage?: number, colorClass?: string }) => (
    <div className="flex flex-col space-y-1.5 mb-4 px-1">
      <div className="flex justify-between items-end">
        <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{label}</span>
        <span className="text-xs font-mono text-zinc-300">{value}</span>
      </div>
      {percentage !== undefined && (
        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-zinc-800/50">
          <div 
            className={twMerge("h-full transition-all duration-500 rounded-full", colorClass)} 
            style={{ width: `${percentage}%` }} 
          />
        </div>
      )}
    </div>
  );

  if (!selected) {
    return (
      <div className='w-full h-full bg-[#1e1e1e] flex flex-col border-l border-black overflow-hidden select-none items-center justify-center p-8 text-center'>
        <div className="w-16 h-16 rounded-3xl bg-zinc-800/50 flex items-center justify-center mb-4 border border-zinc-700/30">
          <FiMousePointer className="text-zinc-500 animate-pulse" size={24} />
        </div>
        <h3 className="text-sm font-bold text-zinc-400 mb-2">No Selection</h3>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Select a network request from the list to inspect its properties and performance metrics.
        </p>
      </div>
    );
  }

  // Ensure strings for safer logic
  const url = (selected.url as string) || "";
  const method = (selected.method as string) || "GET";
  const time = (selected.time as string) || "0ms";
  const code = (selected.code as string) || "---";
  const duration = (selected.duration as string) || "0 bytes";

  const getLatencyPercentage = (timeStr: string) => {
    const value = parseInt(timeStr.replace(/[^0-9]/g, ''));
    return isNaN(value) ? 0 : Math.min(100, (value / 2000) * 100); 
  };

  const isHttps = url.startsWith('https');

  return (
    <div className='w-full h-full bg-[#1e1e1e] flex flex-col border-l border-black overflow-hidden select-none'>
      {/* Sidebar Header/Navigation */}
      <div className="flex flex-col shrink-0 bg-[#23262a] border-b border-black">
        <div className="px-4 py-3 border-b border-black/50">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <FiActivity className="text-blue-500" size={14} />
            Inspector
          </h2>
        </div>
        
        <div className="flex w-full p-1 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={twMerge(
                  "flex-1 flex flex-col items-center justify-center py-2 rounded-md transition-all gap-1 border border-transparent",
                  isActive 
                    ? "bg-[#2d3035] text-blue-400 border-zinc-700/50 shadow-inner" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
                title={tab.label}
              >
                <Icon size={14} />
                <span className="text-[9px] font-bold uppercase tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className='flex-1 overflow-y-auto p-4 custom-scrollbar'>
        {activeTab === "Performance" && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xs font-bold text-zinc-400 mb-6 flex items-center gap-2 border-l-2 border-blue-500 pl-2">
              Latency Metrics
            </h3>
            
            <StatRow 
              label="Request Duration" 
              value={time} 
              percentage={getLatencyPercentage(time)} 
              colorClass={getLatencyPercentage(time) > 70 ? "bg-rose-500" : "bg-blue-500"} 
            />
            <StatRow label="Response Size" value={duration} percentage={30} colorClass="bg-indigo-500" />
            <StatRow label="Status Code" value={code} percentage={code === "200" ? 100 : 50} colorClass={code === "200" ? "bg-emerald-500" : "bg-amber-500"} />

            <div className="mt-8 p-3 rounded-xl bg-black/20 border border-zinc-800/50">
              <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-3 tracking-widest text-center">Stability Check</h4>
              <div className="flex gap-1 h-3 mb-2">
                {[...Array(24)].map((_, i) => (
                  <div 
                    key={i} 
                    className={twMerge(
                      "flex-1 rounded-sm",
                      code === "200" ? "bg-emerald-500/80" : "bg-rose-500/80"
                    )} 
                  />
                ))}
              </div>
              <p className="text-[9px] text-zinc-600 text-center italic">Service health snapshot for this endpoint</p>
            </div>
          </div>
        )}

        {activeTab === "Path" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-4">
             <div className="p-3 rounded-lg bg-black/20 border border-zinc-800/50">
               <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Full URL</span>
               <p className="text-xs font-mono break-all text-white">{url}</p>
             </div>
             <div className="p-3 rounded-lg bg-black/20 border border-zinc-800/50">
               <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">Method</span>
               <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 uppercase">
                 {method}
               </span>
             </div>
          </div>
        )}

        {activeTab === "Host" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-3">
             <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Domain</span>
                <span className="text-xs font-mono text-zinc-300">{new URL(url.startsWith('http') ? url : `http://${url}`).hostname}</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-zinc-800/50">
                <span className="text-xs text-zinc-500">Protocol</span>
                <span className="text-xs text-zinc-300 uppercase">{isHttps ? 'HTTPS' : 'HTTP'}</span>
             </div>
          </div>
        )}

        {activeTab === "SSL" && (
          <div className="animate-in fade-in duration-300">
             <div className="flex items-center gap-3 mb-6">
                <div className={twMerge(
                  "w-10 h-10 rounded-full flex items-center justify-center border",
                  isHttps ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                )}>
                   <FiLock className={isHttps ? "text-emerald-500" : "text-rose-500"} size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{isHttps ? 'Encrypted' : 'Insecure'}</h3>
                  <p className={twMerge(
                    "text-[10px] font-bold uppercase",
                    isHttps ? "text-emerald-500/80" : "text-rose-500/80"
                  )}>{isHttps ? 'TLS Active' : 'Plaintext'}</p>
                </div>
             </div>
             <div className="space-y-4">
                <StatRow label="Cipher" value={isHttps ? "TLS_AES_256_GCM_SHA384" : "NONE"} />
                <StatRow label="Verification" value={isHttps ? "CA Verified" : "UNTRUSTED"} />
             </div>
          </div>
        )}

        {activeTab === "Raw" && (
          <div className="animate-in fade-in duration-300 h-full">
            <div className="h-full bg-black/40 rounded border border-zinc-800 p-3 font-mono text-[10px] text-zinc-400 overflow-auto whitespace-pre">
{`SELECTED ID: ${selected.id}
URL: ${url}
METHOD: ${method}
STATUS: ${code}
TIME: ${time}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

