import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo } from "react";

export const PerformanceMode = () => {
    const { selections } = useTrafficListContext();
    const selectedItems = selections.others || [];

    if (selectedItems.length === 0) {
      return <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e]">Select requests to view performance breakdown</div>;
    }

    return (
      <div className="h-full bg-[#1e1e1e] p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-8 text-yellow-500">Performance Breakdown</h2>
          
          <div className="space-y-6">
              {selectedItems.map((item, i) => (
                  <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-[70%]">{String(item.url)}</span>
                          <span className="text-xs font-bold text-zinc-300">{item.duration}</span>
                      </div>
                      
                      {/* Fake Waterfall */}
                      <div className="w-full space-y-2">
                          <TimingBar label="DNS Lookup" color="bg-blue-500" width="10%" />
                          <TimingBar label="TCP Connection" color="bg-orange-500" width="15%" />
                          <TimingBar label="TLS Handshake" color="bg-purple-500" width="20%" />
                          <TimingBar label="TTFB (Server Processing)" color="bg-green-500" width="45%" offset="45%" />
                          <TimingBar label="Content Download" color="bg-cyan-500" width="10%" offset="90%" />
                      </div>
                  </div>
              ))}
          </div>
        </div>
      </div>
    );
};

const TimingBar = ({ label, color, width, offset = "0%" }: { label: string, color: string, width: string, offset?: string }) => (
    <div className="flex items-center gap-3">
        <div className="text-[10px] w-24 text-zinc-500 uppercase">{label}</div>
        <div className="flex-grow bg-zinc-800 h-2 rounded-full relative overflow-hidden">
            <div className={`absolute h-full ${color} rounded-full`} style={{ width, left: offset }}></div>
        </div>
    </div>
);
