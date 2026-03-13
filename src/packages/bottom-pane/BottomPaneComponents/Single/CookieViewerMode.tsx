import React, { useMemo, useState, useEffect } from "react";
import { FiDatabase, FiCopy, FiInfo, FiSearch, FiLock, FiShield, FiCalendar } from "react-icons/fi";
import { twMerge } from "tailwind-merge";
import { useTrafficListContext } from "@src/packages/main-content/context/TrafficList";
import { useAppProvider } from "@src/packages/app-env";

interface CookieData {
  name: string;
  value: string;
  decodedValue: string;
  domain?: string;
  path?: string;
  expires?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  source: 'request' | 'response';
  id: string;
}

export const CookieViewerMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const selected = selections.firstSelected;
  const [filter, setFilter] = useState("");
  const [requestHeaders, setRequestHeaders] = useState<{ key: string; value: string }[]>([]);
  const [responseHeaders, setResponseHeaders] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    
    Promise.all([
      provider.getRequestPairData(String(selected.id)).catch(() => null),
      provider.getResponsePairData(String(selected.id)).catch(() => null)
    ]).then(([req, res]) => {
      setRequestHeaders(req?.headers || []);
      setResponseHeaders(res?.headers || []);
    }).finally(() => setLoading(false));
  }, [selected, provider]);

  const allCookies = useMemo(() => {
    const cookies: CookieData[] = [];

    const decodeValue = (val: string) => {
      try {
        return decodeURIComponent(val);
      } catch {
        return val;
      }
    };

    // 1. Parse Request Cookies
    const requestCookieHeader = requestHeaders.find(h => h.key.toLowerCase() === 'cookie');
    if (requestCookieHeader) {
      requestCookieHeader.value.split(';').forEach(pair => {
        const [name, ...valueParts] = pair.trim().split('=');
        if (name) {
          const rawValue = valueParts.join('=');
          cookies.push({
            name,
            value: rawValue,
            decodedValue: decodeValue(rawValue),
            source: 'request',
            id: `req-${name}-${Math.random().toString(36).substr(2, 9)}`
          });
        }
      });
    }

    // 2. Parse Response Cookies (Set-Cookie)
    responseHeaders.filter(h => h.key.toLowerCase() === 'set-cookie').forEach(h => {
      const parts = h.value.split(';');
      const [nameValue, ...attributes] = parts;
      const [name, ...valueParts] = nameValue.split('=');
      
      if (name) {
        const rawValue = valueParts.join('=');
        const cookie: CookieData = {
          name,
          value: rawValue,
          decodedValue: decodeValue(rawValue),
          source: 'response',
          id: `res-${name}-${Math.random().toString(36).substr(2, 9)}`
        };

        attributes.forEach(attr => {
          const [key, val] = attr.trim().split('=');
          const lowerKey = key.toLowerCase();
          if (lowerKey === 'domain') cookie.domain = val;
          else if (lowerKey === 'path') cookie.path = val;
          else if (lowerKey === 'expires') cookie.expires = val;
          else if (lowerKey === 'secure') cookie.secure = true;
          else if (lowerKey === 'httponly') cookie.httpOnly = true;
          else if (lowerKey === 'samesite') cookie.sameSite = val;
        });

        cookies.push(cookie);
      }
    });

    return cookies;
  }, [requestHeaders, responseHeaders]);

  const filteredCookies = useMemo(() => {
    if (!filter) return allCookies;
    const lowFilter = filter.toLowerCase();
    return allCookies.filter(c => 
      c.name.toLowerCase().includes(lowFilter) || 
      c.decodedValue.toLowerCase().includes(lowFilter) ||
      c.domain?.toLowerCase().includes(lowFilter)
    );
  }, [allCookies, filter]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!selected) return <Placeholder text="Select a traffic item to inspect cookies" />;
  if (loading) return <Placeholder text="Analyzing cookie jars..." icon={<FiDatabase className="animate-spin" size={32} />} />;
  if (allCookies.length === 0) return <Placeholder text="No cookies (request or response) found in this transaction" icon={<FiInfo size={32} />} />;

  return (
    <div className="flex flex-col h-full bg-[#0d0f11] text-zinc-300 font-sans overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#16191c] shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-teal-600/10 rounded-xl border border-teal-500/20 shadow-lg shadow-teal-500/5">
            <FiDatabase className="text-teal-500" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cookie Jar</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                {allCookies.filter(c => c.source === 'request').length} Request • {allCookies.filter(c => c.source === 'response').length} Response
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-teal-500 transition-colors" size={12} />
            <input 
              type="text"
              placeholder="Search cookies..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-[11px] w-48 focus:w-64 focus:border-teal-500/50 outline-none transition-all placeholder:text-zinc-700"
            />
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 gap-4">
            {filteredCookies.map((cookie) => (
              <div key={cookie.id} className="group flex flex-col rounded-xl border border-zinc-800 bg-black/20 hover:bg-zinc-800/30 transition-all duration-300 overflow-hidden shadow-lg">
                
                {/* Cookie Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/40">
                  <div className="flex items-center gap-3">
                    <span className={twMerge(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                      cookie.source === 'request' ? "bg-blue-600/10 border-blue-500/20 text-blue-400" : "bg-emerald-600/10 border-emerald-500/20 text-emerald-400"
                    )}>
                      {cookie.source}
                    </span>
                    <span className="text-xs font-bold text-teal-400 font-mono tracking-tight group-hover:text-teal-300 transition-colors">
                      {cookie.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cookie.httpOnly && <FiLock size={12} className="text-amber-500" title="HttpOnly" />}
                    {cookie.secure && <FiShield size={12} className="text-blue-500" title="Secure" />}
                    <button 
                      onClick={() => copyToClipboard(cookie.value)}
                      className="p-1 text-zinc-600 hover:text-white transition-colors"
                      title="Copy Raw Value"
                    >
                      <FiCopy size={13} />
                    </button>
                  </div>
                </div>

                {/* Values Section */}
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-black text-zinc-600 tracking-widest block mb-2">Decoded Value</span>
                    <div className="p-3 bg-black/40 rounded-lg border border-zinc-900 font-mono text-[11px] text-zinc-300 break-all leading-relaxed relative">
                      {(() => {
                        try {
                          const parsed = JSON.parse(cookie.decodedValue);
                          return (
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(parsed, null, 2)}
                            </pre>
                          );
                        } catch {
                          return cookie.decodedValue;
                        }
                      })()}
                      <button 
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(cookie.decodedValue);
                            copyToClipboard(JSON.stringify(parsed, null, 2));
                          } catch {
                            copyToClipboard(cookie.decodedValue);
                          }
                        }}
                        className="absolute top-2 right-2 p-1 bg-zinc-900 rounded border border-zinc-800 text-zinc-600 hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Copy Beautified Value"
                      >
                        <FiCopy size={10} />
                      </button>
                    </div>
                  </div>

                  {cookie.source === 'response' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <Attr label="Domain" value={cookie.domain} />
                      <Attr label="Path" value={cookie.path} />
                      <Attr label="SameSite" value={cookie.sameSite} />
                      <Attr label="Expires" value={cookie.expires} icon={<FiCalendar size={10} />} />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredCookies.length === 0 && (
              <div className="py-20 text-center space-y-2">
                <FiDatabase size={40} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">No matching cookies</p>
                <p className="text-zinc-700 text-[11px] italic">Try searching for key names or content</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-zinc-900 bg-[#0c0e10] flex gap-6 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
             <span className="w-2 h-2 rounded-full bg-teal-500/40" />
             Active Cookie Engine
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest border-l border-zinc-800 pl-6">
             Parsed {filteredCookies.length} entities
          </div>
      </div>
    </div>
  );
};

const Attr = ({ label, value, icon }: { label: string, value?: string, icon?: any }) => (
  <div className="flex flex-col">
    <span className="text-[8px] uppercase font-bold text-zinc-600 tracking-tighter flex items-center gap-1">
      {icon} {label}
    </span>
    <span className="text-[10px] font-mono text-zinc-500 mt-0.5 truncate" title={value}>
      {value || '-'}
    </span>
  </div>
);

const Placeholder = ({ text, icon = null }: { text: string, icon?: React.ReactNode }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0d0f11] p-10 text-center">
    <div className="flex flex-col items-center gap-4">
      {icon || <div className="text-4xl text-teal-950 font-bold opacity-30 tracking-tighter uppercase">Cookie Inspector</div>}
      <div className="text-sm max-w-md mx-auto font-medium text-zinc-600">{text}</div>
    </div>
  </div>
);

export default CookieViewerMode;
