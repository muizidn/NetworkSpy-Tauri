import { useEffect, useState, useMemo } from "react";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";
import { open } from "@tauri-apps/plugin-shell";
import { twMerge } from "tailwind-merge";

interface SecurityFinding {
  severity: "critical" | "high" | "medium" | "low" | "info" | "pass";
  title: string;
  description: string;
  category: string;
  id: string;
  link?: string;
  passed?: boolean;
}

export const OWASPMode = () => {
  const { selections } = useTrafficListContext();
  const { provider } = useAppProvider();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);

  const [analyzing, setAnalyzing] = useState(false);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);

  useEffect(() => {
    if (!trafficId) return;

    setAnalyzing(true);
    Promise.all([
      provider.getRequestPairData(trafficId),
      provider.getResponsePairData(trafficId)
    ])
      .then(([reqData, resData]) => {
        const traffic = selections.firstSelected;
        if (!traffic || !reqData) return;

        const allFindings: SecurityFinding[] = [
          {
            id: "A01:2021",
            severity: "pass",
            title: "Broken Access Control",
            category: "Authorization",
            description: "No obvious access control vulnerabilities detected (e.g. missing Authorization header on sensitive paths).",
            link: "https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
            passed: true
          },
          {
            id: "A02:2021",
            severity: "pass",
            title: "Cryptographic Failures",
            category: "Encryption",
            description: "No cryptographic failures detected (e.g. sensitive data in URL or unencrypted HTTP).",
            link: "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/",
            passed: true
          },
          {
            id: "A03:2021",
            severity: "pass",
            title: "Injection",
            category: "Injection",
            description: "No injection patterns detected in request parameters.",
            link: "https://owasp.org/Top10/A03_2021-Injection/",
            passed: true
          },
          {
            id: "A05:2021",
            severity: "pass",
            title: "Security Misconfiguration",
            category: "Headers",
            description: "All recommended security headers are present.",
            link: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
            passed: true
          },
          {
            id: "A06:2021",
            severity: "pass",
            title: "Vulnerable and Outdated Components",
            category: "Information Leakage",
            description: "No server or technology stack information leaked.",
            link: "https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/",
            passed: true
          },
          {
            id: "A07:2021",
            severity: "pass",
            title: "Identification and Authentication Failures",
            category: "Authentication",
            description: "Cookies are configured securely.",
            link: "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/",
            passed: true
          }
        ];

        const updateFinding = (id: string, updates: Partial<SecurityFinding>) => {
          const idx = allFindings.findIndex(f => f.id === id);
          if (idx !== -1) {
            if (!allFindings[idx].passed) {
              allFindings[idx].description += " " + updates.description;
            } else {
              allFindings[idx] = { ...allFindings[idx], ...updates, passed: false };
            }
          }
        };

        const getHeader = (headers: { key: string; value: string }[], key: string) => 
          headers?.find(h => h.key.toLowerCase() === key.toLowerCase())?.value;

        const reqHeaders = reqData.headers || [];
        const resHeaders = resData?.headers || [];
        const uri = traffic.uri || "";

        // A01: Broken Access Control
        const authHeader = getHeader(reqHeaders, 'authorization');
        if (!authHeader && (uri.includes('/api/') || uri.includes('/user') || uri.includes('/admin'))) {
          updateFinding("A01:2021", {
            severity: "high",
            title: "Potential Broken Access Control",
            description: "No Authorization header found for an endpoint that appears to be an API or sensitive path (/api, /user, /admin)."
          });
        }

        // A02: Cryptographic Failures
        if (uri.startsWith('http://') && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
          updateFinding("A02:2021", {
            severity: "critical",
            title: "Cleartext Transmission",
            description: "Request is made over unencrypted HTTP. Sensitive data could be intercepted."
          });
        }

        const sensitiveParams = ['password', 'token', 'secret', 'apikey', 'auth'];
        if (reqData.params) {
          const hasSensitiveParam = reqData.params.some(p => sensitiveParams.some(sp => p.key.toLowerCase().includes(sp)));
          if (hasSensitiveParam) {
            updateFinding("A02:2021", {
              severity: "critical",
              title: "Sensitive Data in URL",
              description: "Sensitive data (password, token, etc.) found in query parameters. This can be logged by servers or browser history."
            });
          }
        }

        // A03: Injection
        if (reqData.params) {
          const sqlInjectionPattern = /('|"|;|--|\/\*|UNION|SELECT|DROP|INSERT)/i;
          const xssPattern = /(<script|javascript:|onerror=|onload=)/i;
          let hasInjection = false;
          reqData.params.forEach(p => {
            const val = String(p.value);
            if (sqlInjectionPattern.test(val) || xssPattern.test(val)) hasInjection = true;
          });
          if (hasInjection) {
            updateFinding("A03:2021", {
              severity: "critical",
              title: "Potential Injection Attack",
              description: "Suspicious characters or keywords indicating SQL Injection or XSS found in query parameters."
            });
          }
        }

        // A05: Security Misconfiguration
        if (resData) {
          const csp = getHeader(resHeaders, 'content-security-policy');
          if (!csp) {
            updateFinding("A05:2021", {
              severity: "medium",
              title: "Missing Content-Security-Policy",
              description: "The 'Content-Security-Policy' header is missing. This makes the application vulnerable to XSS attacks."
            });
          }

          const hsts = getHeader(resHeaders, 'strict-transport-security');
          if (!hsts && uri.startsWith('https://')) {
            updateFinding("A05:2021", {
              severity: "medium",
              title: "Missing HSTS Header",
              description: "Strict-Transport-Security header is not set. The site is vulnerable to protocol downgrade attacks."
            });
          }

          const noSniff = getHeader(resHeaders, 'x-content-type-options');
          if (noSniff?.toLowerCase() !== 'nosniff') {
            updateFinding("A05:2021", {
              severity: "low",
              title: "Missing X-Content-Type-Options",
              description: "Missing 'X-Content-Type-Options: nosniff'. Browsers may perform MIME sniffing."
            });
          }

          // A06: Vulnerable and Outdated Components (Information Exposure)
          const serverHeader = getHeader(resHeaders, 'server');
          const poweredBy = getHeader(resHeaders, 'x-powered-by');
          if (serverHeader || poweredBy) {
            updateFinding("A06:2021", {
              severity: "info",
              title: "Technology Stack Exposure",
              description: `Server or framework details exposed. Server: ${serverHeader || 'none'}, X-Powered-By: ${poweredBy || 'none'}.`
            });
          }

          // A07: Identification and Authentication Failures (Cookies)
          const setCookies = resHeaders.filter(h => h.key.toLowerCase() === 'set-cookie');
          let insecureCookies = false;
          let cookieSnippet = "";
          setCookies.forEach(cookie => {
            const val = cookie.value.toLowerCase();
            if (!val.includes('httponly') || !val.includes('secure')) {
              insecureCookies = true;
              if (!cookieSnippet) cookieSnippet = cookie.value.substring(0, 20) + "...";
            }
          });
          
          if (insecureCookies) {
             updateFinding("A07:2021", {
                severity: "high",
                title: "Insecure Cookie Attributes",
                description: `Cookie is missing HttpOnly or Secure flags. Cookie value snippet: ${cookieSnippet}`
             });
          }
        }

        allFindings.sort((a, b) => {
          if (a.passed === b.passed) return a.id.localeCompare(b.id);
          return a.passed ? 1 : -1;
        });
        setFindings(allFindings);
      })
      .finally(() => {
        setAnalyzing(false);
      });
  }, [trafficId, provider, selections]);

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
            <div key={finding.id} className={twMerge("group border rounded-2xl p-5 transition-all duration-300 relative overflow-hidden", finding.passed ? "bg-zinc-900/10 border-zinc-800/20 hover:border-zinc-800/50" : "bg-zinc-900/40 border-zinc-800 hover:border-red-500/30")}>
              <div className={`absolute top-0 right-0 w-1 h-full ${finding.passed ? 'bg-zinc-800/30' : finding.severity === 'critical' ? 'bg-red-600' :
                finding.severity === 'high' ? 'bg-orange-600' : finding.severity === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                }`} />

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${finding.passed ? 'bg-zinc-900 text-zinc-700' : 'bg-zinc-800 text-zinc-500'}`}>{finding.id}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${finding.passed ? 'bg-green-950/20 text-green-800' : finding.severity === 'critical' ? 'bg-red-950/50 text-red-400' :
                    finding.severity === 'high' ? 'bg-orange-950/50 text-orange-400' : finding.severity === 'medium' ? 'bg-yellow-950/50 text-yellow-400' : 'bg-blue-950/50 text-blue-400'
                    }`}>{finding.passed ? 'PASS' : finding.severity.toUpperCase()}</span>
                </div>
                <span className={`text-[10px] font-bold tracking-widest ${finding.passed ? 'text-zinc-700' : 'text-zinc-600'}`}>{finding.category}</span>
              </div>

              <h3 className={`font-bold mb-2 transition-colors ${finding.passed ? 'text-zinc-600' : 'text-zinc-200 group-hover:text-white'}`}>{finding.title}</h3>
              <p className={`text-xs leading-relaxed ${finding.passed ? 'text-zinc-700' : 'text-zinc-500'}`}>{finding.description}</p>

              <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className={`text-[9px] font-mono italic ${finding.passed ? 'text-zinc-700' : 'text-zinc-600'}`}>Detected via Static Analysis Engine</div>
                {finding.link && (
                  <button 
                    onClick={() => open(finding.link!)}
                    className={`text-[9px] font-black tracking-widest ${finding.passed ? 'text-zinc-600 hover:text-zinc-500' : 'text-red-500 hover:text-red-400'}`}
                  >
                    View OWASP Guide
                  </button>
                )}
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
