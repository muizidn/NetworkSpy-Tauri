import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiActivity, FiSave, FiInfo } from 'react-icons/fi';
import { twMerge } from "tailwind-merge";

export interface BreakpointModel {
  id: string;
  enabled: boolean;
  name: string;
  method: string;
  matching_rule: string;
  request: boolean;
  response: boolean;
}

interface BreakpointDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: BreakpointModel) => void;
  initialData?: BreakpointModel | null;
}

export const BreakpointDialog: React.FC<BreakpointDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}) => {
  const [rule, setRule] = useState<BreakpointModel>({
    id: "",
    enabled: true,
    name: "",
    method: "ALL",
    matching_rule: "*",
    request: true,
    response: true
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
          method: "ALL",
          matching_rule: "*",
          request: true,
          response: true
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!rule.name.trim()) {
      setError("Please enter a name for the breakpoint.");
      return;
    }
    if (!rule.matching_rule.trim()) {
      setError("Please enter a matching rule (e.g., * or */api/*).");
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
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <FiActivity size={20} />
                </div>
                <div>
                    <h2 className="text-base font-black text-white tracking-tight uppercase">
                        {initialData ? "Edit Breakpoint" : "New Breakpoint"}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Define traffic matching criteria</p>
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
        <div className="p-8 flex flex-col gap-6">
            {/* Friendly Name */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest pl-1">Breakpoint Name</label>
                <input
                    autoFocus
                    type="text"
                    value={rule.name}
                    onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-5 py-4 text-zinc-100 text-[13px] font-semibold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="e.g. Stripe API Interceptor"
                />
            </div>

            {/* Matching Rules Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Method</label>
                    <select 
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-300 text-xs font-bold focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        value={rule.method}
                        onChange={e => setRule(prev => ({ ...prev, method: e.target.value }))}
                    >
                        <option value="ALL">ALL</option>
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                        <option value="OPTIONS">OPTIONS</option>
                    </select>
                </div>
                <div className="col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">URL Pattern (Glob OK)</label>
                    <input
                        type="text"
                        value={rule.matching_rule}
                        onChange={(e) => setRule(prev => ({ ...prev, matching_rule: e.target.value }))}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-100 text-xs font-mono focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
                        placeholder="e.g. */api/*"
                    />
                </div>
            </div>

            {/* Interception Settings */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-500">
                        <FiInfo size={14} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.15em]">Interception Types</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setRule(prev => ({ ...prev, request: !prev.request }))}
                        className={twMerge(
                            "group flex flex-col gap-3 p-4 rounded-xl border transition-all text-left relative overflow-hidden",
                            rule.request 
                                ? "bg-amber-500/10 border-amber-500/40" 
                                : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                        )}
                    >
                        {rule.request && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" />}
                        <span className={twMerge("text-[10px] font-black uppercase tracking-widest", rule.request ? "text-amber-500" : "text-zinc-600")}>Request</span>
                        <span className="text-[11px] font-medium leading-relaxed">Breakpoint before data reaches the server</span>
                    </button>

                    <button 
                        onClick={() => setRule(prev => ({ ...prev, response: !prev.response }))}
                        className={twMerge(
                            "group flex flex-col gap-3 p-4 rounded-xl border transition-all text-left relative overflow-hidden",
                            rule.response 
                                ? "bg-blue-500/10 border-blue-500/40" 
                                : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-700"
                        )}
                    >
                        {rule.response && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
                        <span className={twMerge("text-[10px] font-black uppercase tracking-widest", rule.response ? "text-blue-500" : "text-zinc-600")}>Response</span>
                        <span className="text-[11px] font-medium leading-relaxed">Breakpoint before data reaches the client</span>
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
                className="flex-[1.5] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
                <FiSave size={14} />
                Save Breakpoint Rule
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
