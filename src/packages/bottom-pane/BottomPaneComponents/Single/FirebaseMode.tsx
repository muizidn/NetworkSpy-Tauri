import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { FiDatabase, FiCloud, FiActivity, FiKey } from "react-icons/fi";
import { SiFirebase } from "react-icons/si";

export const FirebaseMode = () => {
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

  if (!trafficId) return <Placeholder text="Select a Firebase request to inspect" />;

  const isFirebase = data?.request?.url?.includes("firebaseio.com") || 
                     data?.request?.url?.includes("googleapis.com/v1/projects") ||
                     data?.request?.url?.includes("firestore.googleapis.com");

    return (
    <div className="h-full bg-[#050505] flex flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-4 sm:px-6 py-4 border-b border-zinc-900 bg-[#0a0a0a] justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-500">
            <SiFirebase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter">Firebase Inspector</h2>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Backend-as-a-Service</div>
          </div>
        </div>
        
        {!isFirebase && data && (
            <div className="px-3 py-1 bg-red-950/30 border border-red-900/50 rounded-full shrink-0">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Non-Firebase Traffic</span>
            </div>
        )}
      </div>

      <div className="flex-grow p-4 sm:p-4 sm:p-6 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-6xl">
            {/* Request Summary Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiCloud className="text-orange-500" size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Service Details</h3>
                </div>
                <div className="space-y-3">
                    <DetailRow label="Project ID" value={extractProjectId(data?.request?.url) || "N/A"} />
                    <DetailRow label="Operation" value={getFirebaseOp(data?.request?.url, data?.request?.method) || "Unknown"} />
                    <DetailRow label="SDK Version" value={extractSDKVersion(data?.request?.headers) || "N/A"} />
                </div>
            </div>

            {/* Auth Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiKey className="text-orange-500" size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Authentication</h3>
                </div>
                <div className="space-y-3">
                    <DetailRow label="API Key" value={extractApiKey(data?.request?.url) || "Hidden"} isCode />
                    <DetailRow label="Auth Method" value={data?.request?.headers?.['authorization'] ? 'Bearer Token' : 'None'} />
                </div>
            </div>

            {/* Payload Analysis */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 sm:col-span-2">
                <div className="flex items-center gap-2 mb-4 text-orange-500">
                    <FiDatabase size={16} />
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-wider">Document / Data Body</h3>
                </div>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-xs overflow-x-auto border border-zinc-800/50">
                    <pre className="text-zinc-300">
                        {data?.request?.body ? JSON.stringify(parseFirebaseBody(data.request.body), null, 2) : "// No payload detected"}
                    </pre>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const extractProjectId = (url: string) => {
    if (!url) return null;
    const firestoreMatch = url.match(/projects\/([^\/]+)/);
    if (firestoreMatch) return firestoreMatch[1];
    const rtdbMatch = url.match(/https:\/\/([^\.]+)\.firebaseio\.com/);
    if (rtdbMatch) return rtdbMatch[1];
    return null;
};

const getFirebaseOp = (url: string, method: string) => {
    if (!url) return null;
    if (url.includes(":commit")) return "Transaction Commit";
    if (url.includes(":runQuery")) return "Query Execution";
    if (url.includes(":lookup")) return "Document Lookup";
    if (method === "PATCH") return "Update Document";
    if (method === "POST") return "Create Document";
    if (method === "GET") return "Get Document/Collection";
    return null;
}

const extractApiKey = (url: string) => {
    if (!url) return null;
    const match = url.match(/key=([^&]+)/);
    return match ? match[1] : null;
}

const extractSDKVersion = (headers: any) => {
    if (!headers) return null;
    return headers['x-firebase-client'] || headers['x-goog-api-client'] || null;
}

const parseFirebaseBody = (body: any) => {
    try {
        if (typeof body === 'string') return JSON.parse(body);
        return body;
    } catch {
        return body;
    }
}

const DetailRow = ({ label, value, isCode }: { label: string, value: string, isCode?: boolean }) => (
    <div className="flex justify-between items-center text-[11px] gap-2">
        <span className="text-zinc-500 shrink-0">{label}</span>
        <span className={`${isCode ? 'font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded text-[10px]' : 'font-bold'} text-zinc-200 truncate`}>{value}</span>
    </div>
);

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-4 sm:p-6 sm:p-6 sm:p-10 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-600/5 flex items-center justify-center text-orange-950 mb-6 border border-orange-950/10">
        <SiFirebase className="w-8 h-8 sm:w-10 sm:h-10 opacity-20" />
      </div>
      <h3 className="text-zinc-400 font-bold mb-1 italic uppercase tracking-widest text-xs">Firebase Inspector</h3>
      <p className="text-[10px] text-zinc-600 max-w-[200px] leading-relaxed uppercase font-bold tracking-tight">{text}</p>
    </div>
);

export default FirebaseMode;
