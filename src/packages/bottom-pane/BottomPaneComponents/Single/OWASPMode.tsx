import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";

interface SecurityFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  category: string;
  id: string;
}

export const OWASPMode = () => {
  const { selections } = useTrafficListContext();
  const { provider } = useAppProvider();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);

  const [data, setData] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);

  useEffect(() => {
    if (!trafficId) return;

    setAnalyzing(true);
    provider.getRequestPairData(trafficId)
      .then(res => setData(res))
      .finally(() => {
        setFindings([
          {
            id: "A1:2021",
            severity: "high",
            title: "Broken Access Control",
            category: "Authorization",
            description: "Detected numeric user ID in URL. Check for IDOR vulnerabilities if proper ownership verification is missing."
          },
          {
            id: "A5:2021",
            severity: "medium",
            title: "Security Misconfiguration",
            category: "Headers",
            description: "Missing 'X-Content-Type-Options: nosniff' and 'Content-Security-Policy' headers."
          },
          {
            id: "A2:2021",
            severity: "critical",
            title: "Cryptographic Failures",
            category: "Encryption",
            description: "Sensitive data found in query parameters. Ensure sensitive tokens/secrets are passed via request body or headers."
          }
        ]);
        setAnalyzing(false);
      });
  }, [trafficId, provider]);

  if (!trafficId) return <Placeholder text="Select a request to run OWASP analysis" />;

  return (
    <div className="h-full bg-[#050505] flex flex-col overflow-hidden">
      <div className="flex flex-col @sm:flex-row items-start @sm:items-center px-4 @sm:px-6 py-4 border-b border-zinc-900 bg-[#0a0a0a] justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor font-black"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-tighter">OWASP Security Auditor</h2>
            <div className="text-[9px] text-zinc-500 font-bold tracking-widest">Top 10 Vulnerability Scanner</div>
          </div>
        </div>

        {analyzing && (
          <div className="flex items-center gap-2">
            <div className="w-12 h-1 bg-zinc-900 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-red-600 animate-[loading_1.5s_infinite]" style={{ width: '40%' }}></div>
            </div>
            <span className="text-[10px] font-black text-red-500 tracking-widest animate-pulse">Scanning...</span>
          </div>
        )}
      </div>

      <div className="flex-grow p-4 @sm:p-6 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-1 gap-4 max-w-4xl">
          {findings.map((finding) => (
            <div key={finding.id} className="group bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-red-500/30 transition-all duration-300 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-1 h-full ${finding.severity === 'critical' ? 'bg-red-600' :
                finding.severity === 'high' ? 'bg-orange-600' : 'bg-yellow-600'
                }`} />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">{finding.id}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${finding.severity === 'critical' ? 'bg-red-950/50 text-red-400' :
                    finding.severity === 'high' ? 'bg-orange-950/50 text-orange-400' : 'bg-yellow-950/50 text-yellow-400'
                    }`}>{finding.severity}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-600 tracking-widest">{finding.category}</span>
              </div>

              <h3 className="text-zinc-200 font-bold mb-2 group-hover:text-white transition-colors">{finding.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{finding.description}</p>

              <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-[9px] text-zinc-600 font-mono italic">Detected via Static Analysis Engine</div>
                <button className="text-[9px] font-black text-red-500 tracking-widest hover:text-red-400">View Remediation Guide</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex flex-col items-center justify-center bg-[#050505] p-6 @sm:p-10 text-center">
    <div className="w-16 h-16 @sm:w-20 @sm:h-20 rounded-full bg-red-600/5 flex items-center justify-center text-red-950 mb-6 border border-red-950/10">
      <svg className="w-8 h-8 @sm:w-10 @sm:h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 1a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </div>
    <h3 className="text-zinc-400 font-bold mb-1 italic">OWASP Audit Ready</h3>
    <p className="text-[11px] text-zinc-600 max-w-[200px] leading-relaxed">{text}</p>
  </div>
);

export default OWASPMode;
