import React from "react";
import { FiShield, FiAlertCircle } from "react-icons/fi";

interface InterceptionActionBarProps {
    isMultiple: boolean;
    tunneledCount: number;
    interceptedCount: number;
    isAdded: boolean;
    isIntercepting: boolean;
    handleIntercept: () => void;
    handleInterceptAll: () => void;
    isIntercepted: boolean;
}

export const InterceptionActionBar: React.FC<InterceptionActionBarProps> = ({
    isMultiple,
    tunneledCount,
    interceptedCount,
    isAdded,
    isIntercepting,
    handleIntercept,
    handleInterceptAll,
    isIntercepted
}) => {
    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-[#1a1c1e]/90 backdrop-blur-md border border-white/5 rounded-xl shadow-2xl shadow-black/50 z-50">
          <div className="flex items-center gap-3 px-3 py-1 border-r border-white/5 mr-1">
            {isMultiple ? (
              <>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{tunneledCount} Tunneled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tight">{interceptedCount} Intercepted</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {isIntercepted ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Interception Active</span>
                  </>
                ) : (
                  <>
                    <FiAlertCircle size={12} className="text-amber-500" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Direct Tunnel</span>
                  </>
                )}
              </div>
            )}
          </div>

          {(isMultiple ? tunneledCount > 0 : (!isIntercepted && !isAdded)) && (
            <button
              onClick={isMultiple ? handleInterceptAll : handleIntercept}
              disabled={isIntercepting}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-900/30"
            >
              <FiShield size={12} />
              {isIntercepting ? "Provisioning..." : isMultiple ? `Intercept ${tunneledCount} hosts` : "Intercept host"}
            </button>
          )}
        </div>
    );
};
