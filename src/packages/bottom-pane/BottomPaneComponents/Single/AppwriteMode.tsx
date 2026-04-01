import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { FiBox, FiUsers, FiHardDrive, FiActivity } from "react-icons/fi";
import { SiAppwrite } from "react-icons/si";

export const AppwriteMode = () => {
  const { selections } = useTrafficListContext();
  const { provider } = useAppProvider();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    provider.getRequestPairData(trafficId)
      .then(res => setData(res))
      .finally(() => setLoading(false));
  }, [trafficId, provider]);

  if (!trafficId) return <Placeholder text="Select an Appwrite request to inspect" />;

  const isAppwrite = data?.request?.headers?.['x-appwrite-project'] || 
                     data?.request?.url?.includes("appwrite.io");

  return (
    <div className="h-full bg-[#050505] flex flex-col overflow-hidden">
      <div className="flex flex-col @sm:flex-row items-start @sm:items-center px-4 @sm:px-6 py-4 border-b border-zinc-900 bg-[#0a0a0a] justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-500">
            <SiAppwrite className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter">Appwrite Inspector</h2>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Open Source BaaS</div>
          </div>
        </div>
        
        {isAppwrite && (
            <div className="px-3 py-1 bg-pink-950/30 border border-pink-900/50 rounded-full">
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                    Project: {data?.request?.headers?.['x-appwrite-project'] || 'Unknown'}
                </span>
            </div>
        )}
      </div>

      <div className="flex-grow p-4 @sm:p-6 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 max-w-6xl">
            {/* Context Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 border-l-4 border-l-pink-600">
                <div className="flex items-center gap-2 mb-4">
                    <FiBox className="text-pink-500" size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Request Context</h3>
                </div>
                <div className="space-y-3">
                    <DetailRow label="Project ID" value={data?.request?.headers?.['x-appwrite-project'] || "N/A"} />
                    <DetailRow label="JWT" value={data?.request?.headers?.['x-appwrite-jwt'] ? 'Present' : 'None'} />
                    <DetailRow label="Locale" value={data?.request?.headers?.['x-appwrite-locale'] || "N/4"} />
                    <DetailRow label="Response Format" value={data?.request?.headers?.['x-appwrite-response-format'] || "JSON"} />
                </div>
            </div>

            {/* Service Discovery */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiActivity className="text-pink-500" size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Service Targeted</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {identifyService(data?.request?.url).map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-bold rounded border border-zinc-700 uppercase">
                            {s}
                        </span>
                    ))}
                </div>
            </div>

            {/* Data Preview */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 @sm:col-span-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <SiAppwrite size={80} />
                </div>
                <div className="flex items-center gap-2 mb-4 text-pink-500">
                    <FiUsers size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Document / User Data</h3>
                </div>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-zinc-800/50 relative z-10">
                    <pre className="text-zinc-300">
                        {data?.request?.body ? JSON.stringify(parseJson(data.request.body), null, 2) : "// No payload"}
                    </pre>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const identifyService = (url: string) => {
    if (!url) return ["Unknown"];
    const services = [];
    if (url.includes("/database")) services.push("Databases");
    if (url.includes("/users") || url.includes("/account")) services.push("Auth / Users");
    if (url.includes("/storage")) services.push("Storage");
    if (url.includes("/functions")) services.push("Cloud Functions");
    if (url.includes("/teams")) services.push("Teams");
    if (url.includes("/graphql")) services.push("GraphQL");
    return services.length > 0 ? services : ["Generic API"];
}

const parseJson = (b: any) => {
    try { return typeof b === 'string' ? JSON.parse(b) : b; }
    catch { return b; }
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center text-[11px]">
        <span className="text-zinc-500">{label}</span>
        <span className="font-bold text-zinc-200">{value}</span>
    </div>
);

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 @sm:p-10 text-center">
      <div className="w-16 h-16 @sm:w-20 @sm:h-20 rounded-full bg-pink-600/5 flex items-center justify-center text-pink-950 mb-6 border border-pink-950/10">
        <SiAppwrite className="w-8 h-8 @sm:w-10 @sm:h-10 opacity-20" />
      </div>
      <h3 className="text-zinc-400 font-bold mb-1 italic">Appwrite Inspector</h3>
      <p className="text-[11px] text-zinc-600 max-w-[200px] leading-relaxed">{text}</p>
    </div>
);

export default AppwriteMode;
