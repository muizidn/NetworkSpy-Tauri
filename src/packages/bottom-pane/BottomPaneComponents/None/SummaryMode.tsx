import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useFilterContext } from "@src/context/FilterContext";
import { useMemo } from "react";

export const SummaryMode = () => {
  const { filteredTraffic } = useFilterContext();
  const { trafficSet } = useTrafficListContext();

  const formatSize = (bytes: number) => {
    if (bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const stats = useMemo(() => {
    const total = filteredTraffic.length;
    const methods: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    const contentTypes: Record<string, number> = {};
    let totalReqBytes = 0;
    let totalResBytes = 0;

    filteredTraffic.forEach((item) => {
      const method = (item.method as string) || "UNKNOWN";
      methods[method] = (methods[method] || 0) + 1;

      const status = (item.status as string) || "PENDING";
      statuses[status] = (statuses[status] || 0) + 1;

      const contentType = (item.content_type as string) || "unknown";
      const shortType = contentType.split(";")[0];
      contentTypes[shortType] = (contentTypes[shortType] || 0) + 1;

      const raw = trafficSet[String(item.id)];
      if (raw) {
        totalReqBytes += raw.request?.size || 0;
        totalResBytes += raw.response?.size || 0;
      }
    });

    return {
      total,
      methods,
      statuses,
      contentTypes,
      totalReqSize: formatSize(totalReqBytes),
      totalResSize: formatSize(totalResBytes),
      totalTransfer: formatSize(totalReqBytes + totalResBytes)
    };
  }, [filteredTraffic, trafficSet]);

  return (
    <div className="h-full bg-[#1e1e1e] text-white p-4 @sm:p-6 overflow-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl @sm:text-2xl font-black mb-6 @sm:mb-8 text-blue-400 uppercase tracking-tighter">Network Intelligence Summary</h1>

        <div className="grid grid-cols-2 @sm:grid-cols-2 @md:grid-cols-2 @lg:grid-cols-4 gap-3 @sm:gap-4 mb-8">
          <StatCard title="Total" value={stats.total} color="border-blue-500" />
          <StatCard title="Upload" value={stats.totalReqSize} color="border-orange-500" />
          <StatCard title="Download" value={stats.totalResSize} color="border-emerald-500" />
          <StatCard title="Transfer" value={stats.totalTransfer} color="border-purple-500" />
        </div>

        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-8">
          <Section title="HTTP Methods">
            <div className="space-y-2">
              {Object.entries(stats.methods).map(([method, count]) => (
                <ProgressBar key={method} label={method} count={count} total={stats.total} />
              ))}
            </div>
          </Section>

          <Section title="Status Codes">
            <div className="space-y-2">
              {Object.entries(stats.statuses).map(([status, count]) => (
                <ProgressBar key={status} label={status} count={count} total={stats.total} color={getStatusColor(status)} />
              ))}
            </div>
          </Section>

          <Section title="Content Types" className="@sm:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.contentTypes).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center bg-zinc-800 p-2 rounded">
                  <span className="text-sm truncate mr-2" title={type}>{type}</span>
                  <span className="text-xs font-mono bg-zinc-700 px-2 py-0.5 rounded">{count}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
  <div className={`bg-zinc-900 border-l-4 ${color} p-4 rounded shadow-lg`}>
    <div className="text-zinc-400 text-xs uppercase font-semibold">{title}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
  </div>
);

const Section = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-zinc-900 p-5 rounded-lg border border-zinc-800 ${className}`}>
    <h3 className="text-sm font-semibold mb-4 text-zinc-300 uppercase tracking-wider">{title}</h3>
    {children}
  </div>
);

const ProgressBar = ({ label, count, total, color = "bg-blue-500" }: { label: string; count: number; total: number; color?: string }) => {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex flex-col">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="text-zinc-400">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const getStatusColor = (status: string) => {
  if (status.startsWith("2")) return "bg-green-500";
  if (status.startsWith("3")) return "bg-blue-500";
  if (status.startsWith("4")) return "bg-yellow-500";
  if (status.startsWith("5")) return "bg-red-500";
  return "bg-zinc-500";
};
