import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { FiDatabase, FiLock, FiSettings, FiExternalLink } from "react-icons/fi";
import { SiSupabase } from "react-icons/si";

export const SupabaseMode = () => {
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

  if (!trafficId) return <Placeholder text="Select a Supabase request to inspect" />;

  const isSupabase = data?.request?.url?.includes("supabase.co") || 
                      data?.request?.headers?.['x-client-info']?.includes("supabase");

  const supabaseUrl = data?.request?.url ? new URL(data.request.url) : null;
  const projectName = supabaseUrl?.hostname.split('.')[0] || "Unknown";

  return (
    <div className="h-full bg-[#050505] flex flex-col overflow-hidden">
      <div className="flex items-center px-6 py-4 border-b border-zinc-900 bg-[#0a0a0a] justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <SiSupabase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter">Supabase Inspector</h2>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">PostgreSQL Backend</div>
          </div>
        </div>
        
        {isSupabase && (
            <div className="px-3 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-full flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{projectName}</span>
            </div>
        )}
      </div>

      <div className="flex-grow p-6 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl">
            {/* API Details */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                    <FiSettings className="text-emerald-500" size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">REST / PostgREST</h3>
                </div>
                <div className="space-y-3">
                    <DetailRow label="Table" value={extractTable(data?.request?.url) || "N/A"} />
                    <DetailRow label="Schema" value={data?.request?.headers?.['content-profile'] || 'public'} />
                    <DetailRow label="Service Role" value={data?.request?.headers?.['apikey']?.length > 40 ? 'Yes' : 'No'} />
                </div>
            </div>

            {/* Auth/JWT */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/20 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                    <FiLock className="text-emerald-500" size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Auth Context</h3>
                </div>
                <div className="space-y-3">
                    <DetailRow label="Has Anon Key" value={data?.request?.headers?.['apikey'] ? 'Yes' : 'No'} />
                    <DetailRow label="Auth Type" value={data?.request?.headers?.['authorization'] ? 'Authenticated' : 'Anonymous'} />
                    <DetailRow label="Client Info" value={data?.request?.headers?.['x-client-info'] || 'N/A'} />
                </div>
            </div>

            {/* Query Analysis */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                        <FiDatabase size={16} />
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Query / Body Params</h3>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600">PostgREST Syntax</span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Filters</h4>
                        <div className="bg-black/40 rounded-lg p-3 border border-zinc-800/50">
                             {extractFilters(data?.request?.url).length > 0 ? (
                                 extractFilters(data?.request?.url).map((f, i) => (
                                     <div key={i} className="font-mono text-[11px] py-1 border-b border-zinc-800/30 last:border-0">
                                         <span className="text-emerald-400">{f.key}</span>
                                         <span className="text-zinc-500"> {f.op} </span>
                                         <span className="text-zinc-300">{f.val}</span>
                                     </div>
                                 ))
                             ) : (
                                 <div className="text-[10px] text-zinc-600 italic">No filters detected</div>
                             )}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Payload</h4>
                        <div className="bg-black/40 rounded-lg p-3 border border-zinc-800/50 h-full max-h-[200px] overflow-auto">
                            <pre className="text-zinc-300 text-[11px] font-mono">
                                {data?.request?.body ? JSON.stringify(parseJson(data.request.body), null, 2) : "// No body"}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const extractTable = (url: string) => {
    if (!url) return null;
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/');
        return parts[parts.indexOf('v1') + 1] || null;
    } catch { return null; }
}

const extractFilters = (url: string) => {
    if (!url) return [];
    try {
        const u = new URL(url);
        const filters: any[] = [];
        u.searchParams.forEach((val, key) => {
            if (val.includes('.') && !key.startsWith('select')) {
                const [op, ...rest] = val.split('.');
                filters.push({ key, op, val: rest.join('.') });
            }
        });
        return filters;
    } catch { return []; }
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
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-600/5 flex items-center justify-center text-emerald-950 mb-6 border border-emerald-950/10">
        <SiSupabase className="w-10 h-10 opacity-20" />
      </div>
      <h3 className="text-zinc-400 font-bold mb-1 italic">Supabase Inspector</h3>
      <p className="text-[11px] text-zinc-600 max-w-[200px] leading-relaxed">{text}</p>
    </div>
);

export default SupabaseMode;
