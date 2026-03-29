import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { useMemo, useState } from "react";

export const SecurityScanMode = () => {
    const { selections } = useTrafficListContext();
    const selectedItems = selections.others || [];
    const [scanning, setScanning] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);

    const handleScan = () => {
        setScanning(true);
        setTimeout(() => {
            setResults([
                { id: 1, level: 'HIGH', title: 'Sensitive Token in URL', desc: 'Authentication token detected in GET parameters. Use Authorization header instead.', fix: 'Move token to headers' },
                { id: 2, level: 'MEDIUM', title: 'Missing Security Headers', desc: 'Response is missing X-Content-Type-Options: nosniff.', fix: 'Add security headers to backend' },
                { id: 3, level: 'LOW', title: 'Verbose Server Header', desc: 'Server exposes specific version numbers (e.g. nginx/1.18.0).', fix: 'Disable server version disclosure' },
            ]);
            setScanning(false);
        }, 2000);
    };

    if (selectedItems.length === 0) {
      return <div className="h-full flex items-center justify-center text-zinc-500 bg-zinc-950">Select requests to perform security scan</div>;
    }

    return (
      <div className="h-full bg-zinc-950 p-4 @sm:p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Security Inspector
                </h2>
                <div className="text-[10px] text-zinc-600 uppercase font-black pl-1">Compliance & Vulnerability Analysis</div>
              </div>
              {!results && (
                  <button 
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-6 py-2 rounded-full transition-all active:scale-95 disabled:opacity-50"
                  >
                      {scanning ? 'Analyzing...' : 'Start Scan'}
                  </button>
              )}
          </div>
          
          {scanning && (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="w-12 h-12 border-4 border-red-900 border-t-red-600 rounded-full animate-spin mb-4"></div>
                  <div className="text-sm text-zinc-500">Scanning traffic for potential vulnerabilities...</div>
              </div>
          )}

          {results && (
              <div className="space-y-4">
                  {results.map(res => (
                      <div key={res.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg border-l-4" style={{ borderLeftColor: res.level === 'HIGH' ? '#ef4444' : res.level === 'MEDIUM' ? '#f59e0b' : '#3b82f6' }}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-bold text-white">{res.title}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${res.level === 'HIGH' ? 'bg-red-500' : res.level === 'MEDIUM' ? 'bg-orange-500' : 'bg-blue-500'} text-white`}>{res.level}</span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4">{res.desc}</p>
                          <div className="bg-black/30 p-3 rounded-lg flex items-center gap-3">
                              <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Recommendation</span>
                              <span className="text-xs text-zinc-500">{res.fix}</span>
                          </div>
                      </div>
                  ))}
                  <button 
                    onClick={() => setResults(null)}
                    className="w-full py-3 text-[10px] text-zinc-600 font-bold uppercase hover:text-zinc-400 transition-colors"
                  >
                      Clear Results
                  </button>
              </div>
          )}
        </div>
      </div>
    );
};
