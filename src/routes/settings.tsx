import React, { useState, useEffect } from 'react';
import { FiSettings, FiTarget, FiInfo, FiTerminal } from 'react-icons/fi';
import { useSettingsContext } from '../context/SettingsProvider';
import { getVersion } from '@tauri-apps/api/app';

export default function Settings() {
  const { showConnectMethod, setShowConnectMethod, streamCertificateLogs, setStreamCertificateLogs } = useSettingsContext();
  const [appVersion, setAppVersion] = useState<string>('0.0.0');

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-300 overflow-y-auto no-scrollbar">
      <div className="p-12 max-w-4xl mx-auto w-full">
         <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-2xl">
                <FiSettings size={24} className="text-zinc-500 animate-[spin_8s_linear_infinite]" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Proxy Settings</h1>
                <p className="text-zinc-500 text-xs font-medium tracking-wide uppercase mt-1">Configure your interception environment</p>
            </div>
         </div>

         <div className="space-y-6">
            <div 
              className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all duration-300 cursor-pointer"
              onClick={() => setShowConnectMethod(!showConnectMethod)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <FiTarget size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-0.5">Show CONNECT Method</h3>
                        <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                            Show HTTP CONNECT requests used to establish TLS tunnels. These are usually uninformative but can be useful for debugging proxies.
                        </p>
                    </div>
                </div>
                
                <button 
                   className={`w-12 h-6 rounded-full relative transition-all duration-300 ${showConnectMethod ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-zinc-800'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${showConnectMethod ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            <div 
              className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-all duration-300 cursor-pointer"
              onClick={() => setStreamCertificateLogs(!streamCertificateLogs)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <FiTerminal size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-0.5">Stream Certificate Logs</h3>
                        <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                            Show real-time logs during certificate installation and removal. Useful for debugging why certificates fail to install.
                        </p>
                    </div>
                </div>
                
                <button 
                   className={`w-12 h-6 rounded-full relative transition-all duration-300 ${streamCertificateLogs ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-zinc-800'}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${streamCertificateLogs ? 'left-7' : 'left-1'}`} />
                </button>
            </div>
            
            <div className="p-8 rounded-2xl bg-gradient-to-br from-zinc-900/50 to-transparent border border-zinc-800/50 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Heads up</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed italic">
                    By default, Network Spy filters out CONNECT requests to keep your traffic list clean and focused on actual application data. Enable this only if you specifically need to inspect the handshake process.
                </p>
            </div>
         </div>
         
         <div className="mt-24 pt-8 border-t border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Environment Synced</span>
            </div>
            <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-inner group">
                    <FiInfo size={14} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Version {appVersion}</span>
                  </div>
            </div>
         </div>
      </div>
    </div>
  );
}
