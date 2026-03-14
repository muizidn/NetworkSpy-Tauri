import React from 'react';
import { FiSettings, FiTool, FiZap } from 'react-icons/fi';

export default function Settings() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0a0a0a] p-12">
      <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-8 relative">
        <FiSettings size={40} className="text-zinc-600 animate-[spin_8s_linear_infinite]" />
        <div className="absolute top-0 right-0">
           <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center border-4 border-black text-[10px] text-white">
              <FiZap size={10} fill="currentColor" />
           </div>
        </div>
      </div>
      
      <h1 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">Settings</h1>
      <p className="text-zinc-500 max-w-sm text-center text-sm leading-relaxed mb-10">
        We're revamping the settings interface to provide more granular control over your proxy environment.
      </p>

      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Available in</span>
            <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300 font-bold border border-zinc-700">v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
