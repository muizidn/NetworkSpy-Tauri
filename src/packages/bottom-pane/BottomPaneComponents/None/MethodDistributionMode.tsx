import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useFilterContext } from "@src/context/FilterContext";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export const MethodDistributionMode = () => {
  const { filteredTraffic } = useFilterContext();

  const data = useMemo(() => {
    const methods: Record<string, number> = {};
    filteredTraffic.forEach((item) => {
      const method = (item.method as string) || "UNKNOWN";
      methods[method] = (methods[method] || 0) + 1;
    });
    return Object.entries(methods)
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
        <h2 className="text-xl font-bold text-white mb-1">HTTP Methods Usage</h2>
        <p className="text-zinc-500 text-sm">Quantifying request methods to understand API interaction types.</p>
      </div>

      <div className="h-[400px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 40, right: 40, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={false} />
            <XAxis type="number" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis dataKey="name" type="category" stroke="#fff" fontSize={14} fontWeight="bold" tickLine={false} axisLine={false} />
            <Tooltip 
              cursor={{ fill: '#ffffff08' }}
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '13px' }}
            />
            <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={40}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
