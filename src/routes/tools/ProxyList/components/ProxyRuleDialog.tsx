import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiShield, FiSave, FiInfo, FiZap, FiLock } from 'react-icons/fi';
import { twMerge } from "tailwind-merge";

export interface ProxyRuleModel {
  id: string;
  enabled: boolean;
  name: string;
  pattern: string;
  client?: string | null;
  action: 'INTERCEPT' | 'TUNNEL';
}

interface ProxyRuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: ProxyRuleModel) => void;
  initialData?: ProxyRuleModel | null;
}

export const ProxyRuleDialog: React.FC<ProxyRuleDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}) => {
  const [rule, setRule] = useState<ProxyRuleModel>({
    id: "",
    enabled: true,
    name: "",
    pattern: "*",
    client: null,
    action: "INTERCEPT"
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setRule(initialData);
      } else {
        setRule({
          id: "",
          enabled: true,
          name: "",
          pattern: "*",
          client: null,
          action: "INTERCEPT"
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!rule.name.trim()) {
      setError("Please enter a name for the rule.");
      return;
    }
    if (!rule.pattern.trim()) {
      setError("Please enter a pattern (e.g., google.com or *google*).");
      return;
    }
    onSave(rule);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="w-[480px] bg-[#0d0d0d] border border-zinc-800 rounded-3xl shadow-2xl p-0 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 shadow-blue-500/5 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#121212] px-8 py-6 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                    <FiShield size={20} />
                </div>
                <div>
                    <h2 className="text-base font-black text-white tracking-tight uppercase">
                        {initialData ? "Edit Proxy Rule" : "New Proxy Rule"}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Control traffic decryption</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
            >
                <FiX size={18} />
            </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto max-h-[60vh] p-8 flex flex-col gap-6 custom-scrollbar">
            {/* Friendly Name */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Rule Name</label>
                <input
                    autoFocus
                    type="text"
                    value={rule.name}
                    onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-[13px] font-semibold focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
                    placeholder="e.g. Internal Banking API"
                />
            </div>

            {/* Pattern */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Target Pattern (Domain or Glob)</label>
                <input
                    type="text"
                    value={rule.pattern}
                    onChange={(e) => setRule(prev => ({ ...prev, pattern: e.target.value }))}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-xs font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
                    placeholder="e.g. *.internal.company.com"
                />
            </div>

            {/* Client */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Target Client App (Process Name)</label>
                <input
                    type="text"
                    value={rule.client || ""}
                    onChange={(e) => setRule(prev => ({ ...prev, client: e.target.value || null }))}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-xs font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-inner"
                    placeholder="e.g. Google Chrome Helper"
                />
                <p className="text-[9px] text-zinc-600 font-medium px-1 italic mt-1 leading-relaxed">
                    Traffic matching these criteria will follow the action below. Use <code className="text-zinc-400 font-bold bg-zinc-400/10 px-1 rounded">*</code> for broad matching. Non-matching traffic is tunneled by default.
                </p>
            </div>

            {/* Action Settings */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-500">
                        <FiZap size={14} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.15em]">Proxy Action</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setRule(prev => ({ ...prev, action: 'INTERCEPT' }))}
                        className={twMerge(
                            "group flex flex-col gap-3 p-4 rounded-xl border transition-all text-left relative overflow-hidden",
                            rule.action === 'INTERCEPT'
                                ? "bg-emerald-500/10 border-emerald-500/40" 
                                : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                        )}
                    >
                        {rule.action === 'INTERCEPT' && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />}
                        <div className="flex items-center gap-2">
                            <FiZap className={rule.action === 'INTERCEPT' ? "text-emerald-500" : "text-zinc-600"} size={14} />
                            <span className={twMerge("text-[10px] font-black uppercase tracking-widest", rule.action === 'INTERCEPT' ? "text-emerald-500" : "text-zinc-600")}>Intercept</span>
                        </div>
                        <span className="text-[11px] font-medium leading-relaxed">Decrypt and inspect HTTPS traffic</span>
                    </button>

                    <button 
                        onClick={() => setRule(prev => ({ ...prev, action: 'TUNNEL' }))}
                        className={twMerge(
                            "group flex flex-col gap-3 p-4 rounded-xl border transition-all text-left relative overflow-hidden",
                            rule.action === 'TUNNEL' 
                                ? "bg-amber-500/10 border-amber-500/40" 
                                : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                        )}
                    >
                        {rule.action === 'TUNNEL' && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />}
                        <div className="flex items-center gap-2">
                            <FiLock className={rule.action === 'TUNNEL' ? "text-amber-500" : "text-zinc-600"} size={14} />
                            <span className={twMerge("text-[10px] font-black uppercase tracking-widest", rule.action === 'TUNNEL' ? "text-amber-500" : "text-zinc-600")}>Tunnel</span>
                        </div>
                        <span className="text-[11px] font-medium leading-relaxed">Pass through without decryption</span>
                    </button>
                </div>
            </div>

            {error && <p className="text-[11px] text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl animate-shake italic">⚠️ {error}</p>}
        </div>

        {/* Footer */}
        <div className="bg-[#121212] px-8 py-6 border-t border-zinc-800/80 flex items-center gap-4">
            <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
            >
                Cancel
            </button>
            <button
                onClick={handleSave}
                className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
                <FiSave size={14} />
                Save Proxy Rule
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
