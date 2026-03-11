import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFilterContext } from "@src/context/FilterContext";

export const HealthTimelineMode = () => {
  const { filteredTraffic } = useFilterContext();

  const data = useMemo(() => {
    const total = filteredTraffic.length;
    const comparativeTimeGroups: Record<number, { name: string; success: number; error: number; other: number; avgLatency: number; count: number }> = {};
    const buckets = 30; // More granular for full page
    const bucketSize = Math.max(1, Math.floor(total / buckets));

    filteredTraffic.forEach((item, index) => {
      const bucketIdx = Math.floor(index / bucketSize);
      if (bucketIdx >= buckets) return;
      
      if (!comparativeTimeGroups[bucketIdx]) {
        comparativeTimeGroups[bucketIdx] = { name: `T-${bucketIdx + 1}`, success: 0, error: 0, other: 0, avgLatency: 0, count: 0 };
      }
      
      const code = String(item.code || "");
      if (code.startsWith("2")) comparativeTimeGroups[bucketIdx].success++;
      else if (code.startsWith("4") || code.startsWith("5")) comparativeTimeGroups[bucketIdx].error++;
      else comparativeTimeGroups[bucketIdx].other++;

      const timeStr = String(item.time || "0 ms");
      const timeVal = parseInt(timeStr) || 0;
      comparativeTimeGroups[bucketIdx].avgLatency += timeVal;
      comparativeTimeGroups[bucketIdx].count++;
    });

    return Object.values(comparativeTimeGroups).map(g => ({
      ...g,
      avgLatency: g.count > 0 ? Math.round(g.avgLatency / g.count) : 0
    }));
  }, [filteredTraffic]);

  if (filteredTraffic.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 italic text-sm bg-[#1e1e1e]">
        No traffic data available.
      </div>
    );
  }

  return (
    <div className="h-full bg-[#1e1e1e] text-zinc-300 p-6 flex flex-col">
      <div className="mb-6 flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Health & Latency History</h2>
          <p className="text-zinc-500 text-sm">Visualizing system stability and performance trends over time.</p>
        </div>
        <div className="text-right">
          <span className="block text-xs text-zinc-500 uppercase font-semibold">Sample Size</span>
          <span className="text-lg font-mono text-blue-400">{filteredTraffic.length} reqs</span>
        </div>
      </div>

      <div className="flex-grow min-h-0 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis yAxisId="count" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis 
              yAxisId="latency" 
              orientation="right" 
              stroke="#a855f7" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              unit="ms" 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line yAxisId="count" type="monotone" dataKey="success" name="Success (2xx)" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} />
            <Line yAxisId="count" type="monotone" dataKey="error" name="Errors (4xx/5xx)" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 6 }} />
            <Line 
              yAxisId="latency" 
              type="monotone" 
              dataKey="avgLatency" 
              name="Avg Latency" 
              stroke="#a855f7" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
