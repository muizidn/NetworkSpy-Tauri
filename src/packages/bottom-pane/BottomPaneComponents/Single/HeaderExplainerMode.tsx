import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { FiInfo, FiShield, FiCloud, FiLock, FiAlertTriangle, FiCheckCircle, FiEdit2 } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { CustomScriptManager } from "../../CustomScriptManager";
import { useCustomScripts, HeaderFinding } from "../../useCustomScripts";

interface HeaderExplanation {
  title: string;
  description: string;
  category: "General" | "Security" | "Caching" | "System" | "Cloudflare";
  icon: React.ReactNode;
}

const HEADER_DB: Record<string, HeaderExplanation> = {
  // Cloudflare
  "cf-ray": { title: "Cloudflare Ray ID", description: "A unique identifier assigned by Cloudflare to track the request through their network.", category: "Cloudflare", icon: <FiCloud className="text-orange-400" /> },
  "cf-cache-status": { title: "Cloudflare Cache State", description: "Indicates if the resource was served from Cloudflare's edge cache (HIT, MISS, DYNAMIC).", category: "Cloudflare", icon: <FiCloud className="text-orange-400" /> },
  "cf-ipcountry": { title: "Visitor Country", description: "The ISO 3166-1 Alpha-2 code of the country from which the request originated.", category: "Cloudflare", icon: <FiCloud className="text-orange-400" /> },
  "cf-connecting-ip": { title: "Real Visitor IP", description: "Cloudflare passes the client's original IP address in this header.", category: "Cloudflare", icon: <FiCloud className="text-orange-400" /> },

  // Security
  "strict-transport-security": { title: "HSTS Policy", description: "Tells the browser to only interact with the server using HTTPS connections.", category: "Security", icon: <FiShield className="text-red-400" /> },
  "content-security-policy": { title: "CSP", description: "Defines which resources the browser is allowed to load, preventing XSS attacks.", category: "Security", icon: <FiShield className="text-red-400" /> },
  "x-frame-options": { title: "Clickjacking Protection", description: "Controls whether the site can be embedded in iframes or frames.", category: "Security", icon: <FiShield className="text-red-400" /> },
  "x-content-type-options": { title: "MIME Sniffing Prevention", description: "Prevents browsers from interpreting files as a different MIME type.", category: "Security", icon: <FiShield className="text-red-400" /> },

  // General
  "set-cookie": { title: "Cookie Instruction", description: "The server is asking the browser to store a cookie for future requests.", category: "General", icon: <FiLock className="text-blue-400" /> },
  "authorization": { title: "Auth Credentials", description: "Contains the credentials identifying the client to the server.", category: "Security", icon: <FiLock className="text-blue-400" /> },
  "cache-control": { title: "Cache Directives", description: "Instructions for both browser and intermediate caches on how to handle storage.", category: "Caching", icon: <FiInfo className="text-zinc-400" /> },

  // System
  "server": { title: "Server Signature", description: "Describes the software used by the origin server to handle the request.", category: "System", icon: <FiInfo className="text-zinc-600" /> },
  "x-powered-by": { title: "Technology Stack", description: "Often used to indicate the backend framework or language (e.g., Express, PHP, ASP.NET). Usually recommended to hide for security.", category: "System", icon: <FiInfo className="text-zinc-600" /> },
  "access-control-allow-origin": { title: "CORS Policy", description: "Specifies which domains are permitted to access the resource via cross-origin requests.", category: "Security", icon: <FiShield className="text-green-400" /> },
  "user-agent": { title: "Client Identity", description: "Identifies the application, operating system, vendor, and/or version of the requesting user agent.", category: "General", icon: <FiInfo className="text-blue-400" /> },
  "host": { title: "Target Host", description: "Specifies the domain name of the server and (optionally) the TCP port number on which the server is listening.", category: "System", icon: <FiInfo className="text-zinc-400" /> },
  "accept": { title: "Acceptable Types", description: "Informs the server about the types of data that can be sent back to the client (MIME types).", category: "General", icon: <FiInfo className="text-zinc-400" /> },
  "connection": { title: "Connection Control", description: "Controls whether the network connection stays open after the current transaction finishes.", category: "System", icon: <FiInfo className="text-zinc-400" /> },
};

const CustomHeaderIcon = () => (
  <div className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
    <FiLock size={10} />
    <span className="font-black tracking-widest">Custom Header</span>
  </div>
);

const FindingCard = ({ finding }: { finding: HeaderFinding & { isCustom?: boolean, isError?: boolean, scriptName?: string } }) => (
  <div className={twMerge(
    "group overflow-hidden rounded-3xl border transition-all duration-300 shadow-xl mb-4",
    finding.isError
      ? "border-red-900/50 bg-red-950/10 hover:border-red-500/50"
      : "border-blue-900/30 bg-blue-950/5 hover:border-blue-500/50"
  )}>
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={twMerge(
            "text-[10px] font-black tracking-widest px-2 py-0.5 rounded",
            finding.isError ? "bg-red-500 text-white" : "bg-blue-600 text-white"
          )}>
            {finding.type}
          </span>
          <span className="text-[10px] font-black text-zinc-500 tracking-widest pl-1">Protocol Finding</span>
        </div>
        <div className={twMerge(
          "text-[8px] font-black px-2 py-0.5 rounded-full border tracking-tighter shadow-sm",
          finding.isError
            ? "bg-red-600 text-white border-red-500"
            : "bg-blue-950 text-blue-400 border-blue-900/30"
        )}>
          {finding.isError ? "Runtime Error" : "Success"}
        </div>
      </div>

      <div className={twMerge(
        "text-xs font-mono p-3 rounded-xl border leading-relaxed",
        finding.isError
          ? "text-red-400 bg-red-950/20 border-red-500/20"
          : "text-zinc-300 bg-black/30 border-white/5"
      )}>
        {finding.value}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
          <div className="text-[8px] font-black text-zinc-600 tracking-widest mb-1 flex items-center gap-1">
            {finding.isError ? <FiAlertTriangle size={8} /> : <FiInfo size={8} />} {finding.isError ? "Cause" : "Info"}
          </div>
          <div className="text-[10px] text-zinc-400 italic font-medium leading-tight">{finding.risk}</div>
        </div>
        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
          <div className="text-[8px] font-black text-zinc-600 tracking-widest mb-1 flex items-center gap-1">
            {finding.isError ? <FiEdit2 size={8} /> : <FiCheckCircle size={8} />} {finding.isError ? "Fix" : "Result"}
          </div>
          <div className="text-[10px] text-zinc-400 italic font-medium leading-tight">{finding.solution}</div>
        </div>
      </div>
    </div>
  </div>
);

export const HeaderExplainerMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [reqData, setReqData] = useState<RequestPairData | null>(null);
  const [resData, setResData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"Request" | "Response" | "Custom Scripts">("Request");
  const [searchQuery, setSearchQuery] = useState("");

  const trafficData = useMemo(() => {
    const d = activeTab === "Request" ? reqData : resData;
    return { body: null, headers: d?.headers || [] };
  }, [reqData, resData, activeTab]);

  const { customFindings, isRunning } = useCustomScripts<HeaderFinding>('header_explainer', trafficData.body, trafficData.headers);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    Promise.all([
      provider.getRequestPairData(trafficId),
      provider.getResponsePairData(trafficId)
    ]).then(([req, res]) => {
      setReqData(req);
      setResData(res);
    }).finally(() => setLoading(false));
  }, [trafficId, provider]);

  const headers = useMemo(() => {
    const list = activeTab === "Request" ? (reqData?.headers || []) : (resData?.headers || []);
    const filtered = list.filter(h =>
      h.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.map(h => {
      const key = h.key.toLowerCase();
      let explanation = HEADER_DB[key];
      let isCustom = false;

      if (!explanation && key.startsWith("x-")) {
        isCustom = true;
        explanation = {
          title: "Extension Header",
          description: "This is a non-standard or custom extension header (Common in X- prefix headers).",
          category: "System",
          icon: <FiInfo className="text-purple-400" />
        };
      }

      let cookieAnalysis = null;
      if (key === "set-cookie") {
        cookieAnalysis = {
          isHttpOnly: h.value.toLowerCase().includes("httponly"),
          isSecure: h.value.toLowerCase().includes("secure"),
          sameSite: h.value.toLowerCase().includes("samesite=strict") ? "Strict" : h.value.toLowerCase().includes("samesite=lax") ? "Lax" : "None"
        };
      }

      return { ...h, explanation, isCustom, cookieAnalysis };
    });
  }, [reqData, resData, activeTab, searchQuery]);

  if (!trafficId) return <Placeholder text="Select a request to explain headers" />;
  if (loading) return <Placeholder text="Scanning headers..." />;

  return (
    <div className="h-full bg-[#050505] flex flex-col overflow-hidden font-sans">
      <div className="px-6 pt-4 border-b border-zinc-900 bg-[#0a0a0a] flex flex-col shadow-lg shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <FiInfo size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tighter">Header Explainer</h2>
              <div className="text-[9px] text-zinc-500 font-bold tracking-widest italic leading-none">Intelligence Layer</div>
            </div>
          </div>

          {activeTab !== "Custom Scripts" && (
            <div className="flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-lg px-3 py-1.5 focus-within:border-blue-500/50 transition-all">
              <FiInfo size={12} className="text-zinc-600" />
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()} headers...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] text-zinc-300 placeholder:text-zinc-600 w-32 @sm:w-48 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 font-black tracking-widest"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {(["Request", "Response", "Custom Scripts"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={twMerge(
                "pb-3 text-[11px] font-black tracking-widest transition-all relative",
                activeTab === tab ? tab === "Custom Scripts" ? "text-orange-500" : "text-blue-500" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className={twMerge(
                  "absolute bottom-0 left-0 right-0 h-0.5 shadow-lg",
                  tab === "Custom Scripts" ? "bg-orange-500 shadow-orange-500/50" : "bg-blue-500 shadow-blue-500/50"
                )} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar p-4 @sm:p-6 space-y-4 pb-10">
        {activeTab === "Custom Scripts" ? (
          <div className="max-w-4xl mx-auto">
            <CustomScriptManager category="header_explainer" />
          </div>
        ) : (
          <>
            {customFindings.length > 0 && (
              <div className="mb-8">
                <div className="text-[10px] font-black text-blue-500 tracking-widest mb-4 pl-1 flex items-center gap-2">
                  <FiShield size={12} /> Custom Header Insights
                </div>
                {customFindings.map((finding, i) => <FindingCard key={i} finding={finding} />)}
              </div>
            )}

            <div className="text-[10px] font-black text-zinc-600 tracking-widest pl-1 mb-4 flex items-center justify-between">
              <span>Protocol Explanations ({headers.length})</span>
              {isRunning && <span className="text-blue-500 animate-pulse">Scanning...</span>}
            </div>

            {headers.length === 0 && (
              <div className="text-center py-20 opacity-30 text-xs italic">
                {searchQuery ? `No ${activeTab.toLowerCase()} headers match "${searchQuery}"...` : `No ${activeTab.toLowerCase()} headers found...`}
              </div>
            )}

            {headers.map((header, idx) => (
              <div key={idx} className={twMerge(
                "group bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 hover:bg-zinc-900/50 transition-all duration-300",
                header.explanation?.category === "Cloudflare" && "border-orange-500/20 bg-orange-500/5",
                header.explanation?.category === "Security" && "border-red-500/20 bg-red-500/5",
                header.isCustom && "border-purple-500/20 bg-purple-500/5"
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-mono text-xs font-bold">{header.key}</span>
                    {header.isCustom && <CustomHeaderIcon />}
                  </div>
                  {header.explanation && (
                    <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-lg shrink-0">
                      {header.explanation.icon}
                      <span className="text-[9px] font-black text-zinc-400 tracking-widest">{header.explanation.category}</span>
                    </div>
                  )}
                </div>

                <div className="bg-black/40 rounded-xl p-3 mb-3 border border-zinc-800/50">
                  <code className="text-[11px] text-zinc-400 break-all leading-relaxed whitespace-pre-wrap">{header.value}</code>
                </div>

                {header.explanation && (
                  <div className="flex flex-col gap-1.5 border-l-2 border-zinc-800 pl-3">
                    <div className="text-[10px] font-black text-blue-400/80 tracking-wider">{header.explanation.title}</div>
                    <p className="text-xs text-zinc-500 leading-relaxed italic">
                      {header.explanation.description}
                    </p>
                  </div>
                )}

                {header.cookieAnalysis && (
                  <div className="mt-4 pt-4 border-t border-zinc-800/50 grid grid-cols-1 @sm:grid-cols-3 gap-3">
                    <div className={twMerge("p-2 rounded-lg text-center border", header.cookieAnalysis.isHttpOnly ? "bg-green-600/10 border-green-500/20 text-green-500" : "bg-red-600/10 border-red-500/20 text-red-500")}>
                      <div className="text-[8px] font-black mb-1 opacity-60">HttpOnly</div>
                      <div className="text-[10px] font-bold">{header.cookieAnalysis.isHttpOnly ? "SECURE" : "INSECURE"}</div>
                    </div>
                    <div className={twMerge("p-2 rounded-lg text-center border", header.cookieAnalysis.isSecure ? "bg-green-600/10 border-green-500/20 text-green-500" : "bg-red-600/10 border-red-500/20 text-red-500")}>
                      <div className="text-[8px] font-black mb-1 opacity-60">Secure</div>
                      <div className="text-[10px] font-bold">{header.cookieAnalysis.isSecure ? "ENABLED" : "MISSING"}</div>
                    </div>
                    <div className="p-2 bg-zinc-800/50 rounded-lg text-center border border-zinc-700/50">
                      <div className="text-[8px] font-black text-zinc-500 mb-1">SameSite</div>
                      <div className="text-[10px] font-bold text-zinc-300">{header.cookieAnalysis.sameSite}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 @sm:p-10 text-center">
    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700 mb-6 rotate-12">
      <FiInfo size={32} />
    </div>
    <h3 className="text-zinc-400 font-bold mb-1 italic">Protocol Inspector Ready</h3>
    <p className="text-[11px] text-zinc-600 leading-relaxed max-w-[180px]">{text}</p>
  </div>
);

export default HeaderExplainerMode;
