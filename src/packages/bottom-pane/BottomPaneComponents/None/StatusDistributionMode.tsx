import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useFilterContext } from "@src/context/FilterContext";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const StatusDistributionMode = () => {
  const { filteredTraffic } = useFilterContext();

  const data = useMemo(() => {
    const codes: Record<string, number> = {};
    filteredTraffic.forEach((item) => {
      const code = (item.code as string) || "???";
      codes[code] = (codes[code] || 0) + 1;
    });
    return Object.entries(codes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTraffic]);

  if (filteredTraffic.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500 italic text-sm bg-[#1e1e1e]">
        No traffic data available.
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#1e1e1e] text-zinc-300 p-4 @sm:p-6 flex flex-col overflow-auto">
      <div className="mb-6 border-b border-zinc-800 pb-4 shrink-0">
        <h2 className="text-xl font-bold text-white mb-1">Status Code Distribution</h2>
        <p className="text-zinc-500 text-sm">Visual breakdown of response status codes across all captured traffic.</p>
      </div>

      <div className="flex-grow flex items-center justify-center min-h-0 h-[500px] shrink-0">
        <div className="w-full h-full max-w-4xl max-h-[500px] flex">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={160}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(1)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="w-64 flex flex-col justify-center space-y-4 ml-8">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Most Frequent</span>
              <span className="text-2xl font-bold text-blue-400">{data[0]?.name}</span>
              <span className="text-zinc-500 text-sm block">({data[0]?.value} occurrences)</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <span className="text-xs text-zinc-500 uppercase font-bold block mb-1">Unique Codes</span>
              <span className="text-2xl font-bold text-emerald-400">{data.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
