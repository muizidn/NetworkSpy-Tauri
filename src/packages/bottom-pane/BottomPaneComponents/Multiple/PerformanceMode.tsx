import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo } from "react";

export const PerformanceMode = () => {
    const { selections } = useTrafficListContext();
    const selectedItems = selections.others || [];

    if (selectedItems.length === 0) {
      return <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e]">Select requests to view performance breakdown</div>;
    }

    return (
      <div className="bg-[#1e1e1e] p-4 sm:p-6 min-h-full">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-8 text-yellow-500">Performance Breakdown</h2>
          
          <div className="space-y-6">
              {selectedItems.map((item, i) => {
                  const perf = (item.performance as any) || { dns: 20, tcp: 30, tls: 50, ttfb: 200, download: 50 };
                  const total = perf.dns + perf.tcp + perf.tls + perf.ttfb + perf.download;
                  
                  const getP = (val: number) => (val / total * 100).toFixed(2) + "%";
                  const dnsOff = "0%";
                  const tcpOff = (perf.dns / total * 100).toFixed(2) + "%";
                  const tlsOff = ((perf.dns + perf.tcp) / total * 100).toFixed(2) + "%";
                  const ttfbOff = ((perf.dns + perf.tcp + perf.tls) / total * 100).toFixed(2) + "%";
                  const dlOff = ((perf.dns + perf.tcp + perf.tls + perf.ttfb) / total * 100).toFixed(2) + "%";

                  return (
                      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg">
                          <div className="flex justify-between items-center mb-6">
                              <span className="text-xs font-mono text-zinc-400 truncate max-w-[70%] bg-black/30 px-2 py-1 rounded border border-white/5">{String(item.url)}</span>
                              <div className="flex flex-col items-end">
                                  <span className="text-[10px] text-zinc-500 uppercase font-black">Total Duration</span>
                                  <span className="text-sm font-black text-blue-500 tracking-tighter">{total}ms</span>
                              </div>
                          </div>
                          
                          <div className="w-full space-y-3">
                              <TimingBar label="DNS Lookup" color="bg-indigo-500" width={getP(perf.dns)} offset={dnsOff} time={perf.dns} />
                              <TimingBar label="TCP Connect" color="bg-orange-500" width={getP(perf.tcp)} offset={tcpOff} time={perf.tcp} />
                              <TimingBar label="TLS Secure" color="bg-purple-500" width={getP(perf.tls)} offset={tlsOff} time={perf.tls} />
                              <TimingBar label="Wait (TTFB)" color="bg-emerald-500" width={getP(perf.ttfb)} offset={ttfbOff} time={perf.ttfb} />
                              <TimingBar label="Download" color="bg-sky-500" width={getP(perf.download)} offset={dlOff} time={perf.download} />
                          </div>
                      </div>
                  );
              })}
          </div>
        </div>
      </div>
    );
};

const TimingBar = ({ label, color, width, offset = "0%", time }: { label: string, color: string, width: string, offset?: string, time: number }) => (
    <div className="flex items-center gap-4">
        <div className="text-[9px] w-20 text-zinc-500 uppercase font-bold tracking-widest">{label}</div>
        <div className="flex-grow bg-[#111] h-1.5 rounded-full relative overflow-hidden ring-1 ring-white/5">
            <div className={`absolute h-full ${color} rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,0,0,0.3)]`} style={{ width, left: offset }}></div>
        </div>
        <div className="text-[10px] w-12 text-right font-mono text-zinc-400">{time}ms</div>
    </div>
);
