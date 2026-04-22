import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheck, FiZap, FiShield, FiCpu, FiLayout, FiMaximize, FiArrowRight } from 'react-icons/fi';
import { open } from '@tauri-apps/plugin-shell';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeatureItem = ({ label, free, pro }: { label: string, free: string | boolean, pro: string | boolean }) => (
    <div className="grid grid-cols-[1fr,80px,80px] py-3 border-b border-zinc-800/50 items-center">
        <span className="text-[11px] font-bold text-zinc-400">{label}</span>
        <div className="flex justify-center">
            {typeof free === 'boolean' ? (
                free ? <FiCheck className="text-emerald-500" size={14} /> : <FiX className="text-zinc-700" size={14} />
            ) : <span className="text-[10px] font-black text-zinc-600">{free}</span>}
        </div>
        <div className="flex justify-center">
            {typeof pro === 'boolean' ? (
                pro ? <FiCheck className="text-indigo-500" size={14} /> : <FiX className="text-zinc-700" size={14} />
            ) : <span className="text-[10px] font-black text-indigo-400">{pro}</span>}
        </div>
    </div>
);

export const UpgradeDialog: React.FC<UpgradeDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div 
        className="w-[540px] bg-[#080808] border border-zinc-800/80 rounded-[32px] shadow-2xl p-0 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effect */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-indigo-600/10 blur-[120px] pointer-events-none" />

        {/* Header */}
        <div className="px-10 pt-10 pb-6 flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="px-3 py-1 rounded-full bg-indigo-600/10 border border-indigo-500/20 text-indigo-500 text-[9px] font-black uppercase tracking-[0.2em]">
                    Premium Features
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-all border border-transparent hover:border-zinc-800"
                >
                    <FiX size={18} />
                </button>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight mt-2">
                Unleash the Power of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">NetworkSpy</span>
            </h2>
            <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-[80%]">
                Upgrade to a paid plan to remove limits and unlock advanced debugging capabilities.
            </p>
        </div>

        {/* Comparison Table */}
        <div className="px-10 pb-8 flex flex-col">
            <div className="grid grid-cols-[1fr,80px,80px] pb-3 border-b border-zinc-800 items-end">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Capabilities</span>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Free</span>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest text-center">Paid</span>
            </div>

            <FeatureItem label="Proxy Intercept Rules" free="3 Rules" pro="Unlimited" />
            <FeatureItem label="Traffic Filters" free="3 Filters" pro="Unlimited" />
            <FeatureItem label="Multiple Tabs" free="2 Tabs" pro="Unlimited" />
            <FeatureItem label="Breakpoints" free={false} pro={true} />
            <FeatureItem label="Custom Scripting" free={false} pro={true} />
            <FeatureItem label="MCP Support (AI Debugging)" free={false} pro={true} />
            <FeatureItem label="Custom Viewers (Pro)" free={false} pro={true} />
        </div>

        {/* Footer Actions */}
        <div className="p-10 bg-[#0c0c0c] border-t border-zinc-800/50 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-zinc-900/50 border border-zinc-800 flex flex-col gap-2 group hover:border-zinc-700 transition-all">
                    <FiShield className="text-blue-500 mb-1" size={18} />
                    <span className="text-xs font-black text-white">Personal</span>
                    <p className="text-[10px] text-zinc-500 font-medium">For independent developers. All core premium features.</p>
                </div>
                <div className="p-5 rounded-3xl bg-indigo-600/5 border border-indigo-500/20 flex flex-col gap-2 group hover:border-indigo-500/40 transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.1)]">
                    <FiZap className="text-indigo-500 mb-1" size={18} />
                    <span className="text-xs font-black text-white">Pro / Team</span>
                    <p className="text-[10px] text-zinc-500 font-medium">For teams & enterprises. Custom viewers & bulk licenses.</p>
                </div>
            </div>

            <button
                onClick={async () => {
                    try {
                        await open('https://networkspy.app/pricing');
                        onClose();
                    } catch (e) {
                        console.error("Failed to open pricing page:", e);
                        // Fallback
                        window.open('https://networkspy.app/pricing', '_blank');
                        onClose();
                    }
                }}
                className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[22px] bg-indigo-600 text-white text-[12px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-[0_15_30px_-10px_rgba(79,70,229,0.4)] transition-all active:scale-95 group"
            >
                Get Premium Access
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
            </button>
            
            <p className="text-[10px] text-zinc-600 text-center font-bold tracking-tight">
                One-time purchase • Lifetime updates • 30-day money-back guarantee
            </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
