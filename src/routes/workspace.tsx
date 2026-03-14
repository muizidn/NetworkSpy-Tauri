import React from 'react';
import { FiLayout, FiClock, FiStar } from 'react-icons/fi';

export default function WorkspacePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-[#0a0a0a]">
      <div className="max-w-md w-full bg-[#161616] border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4">
            <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                Incoming
            </span>
        </div>
        
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-6">
          <FiLayout size={32} className="text-blue-500" />
        </div>

        <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Workspaces</h1>
        
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Organize your network research into isolated workspaces. Every workspace keeps its own traffic history, scripts, and environment variables.
        </p>

        <ul className="space-y-3 mb-8">
            <li className="flex items-center gap-3 text-xs text-zinc-500">
                <FiCheckCircle size={14} className="text-green-500" />
                <span>Isolated Traffic Storage</span>
            </li>
            <li className="flex items-center gap-3 text-xs text-zinc-500">
                <FiCheckCircle size={14} className="text-green-500" />
                <span>Shared Team Context (Pro)</span>
            </li>
            <li className="flex items-center gap-3 text-xs text-zinc-500">
                <FiCheckCircle size={14} className="text-green-500" />
                <span>Project-specific Breakpoints</span>
            </li>
        </ul>

        <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5 italic">
          <FiClock size={14} className="text-zinc-500" />
          <span className="text-[11px] text-zinc-500">Scheduled for Q3 2026 update</span>
        </div>
      </div>
    </div>
  );
}

const FiCheckCircle = ({ size, className }: { size: number, className: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);
