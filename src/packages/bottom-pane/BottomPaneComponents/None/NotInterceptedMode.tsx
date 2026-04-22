import React from "react";
import { FiLock, FiUnlock, FiShield, FiCheckCircle } from "react-icons/fi";

interface NotInterceptedModeProps {
    domain: string;
    isAdded: boolean;
    isIntercepting: boolean;
    handleIntercept: () => void;
    clientName?: string;
    onInterceptClient: (name: string) => void;
}

export const NotInterceptedMode: React.FC<NotInterceptedModeProps> = ({
    domain,
    isAdded,
    isIntercepting,
    handleIntercept,
    clientName,
    onInterceptClient
}) => {
    if (isAdded) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-[#0a0a0a]">
                <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                    <FiCheckCircle size={48} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-white mb-3 tracking-tight tracking-[0.2em]">Rule Added</h2>
                <p className="text-zinc-500 max-w-md text-sm leading-relaxed mb-4">
                    Interception rule has been created.
                </p>
                <p className="text-zinc-400 max-w-md text-xs font-bold bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
                    Please repeat the request in your app to see the decrypted data
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-[#0a0a0a]">
            <div className="w-24 h-24 rounded-full bg-zinc-900/50 flex items-center justify-center mb-6 border border-zinc-800 shadow-2xl relative">
                <FiLock size={48} className="text-zinc-600" />
                <div className="absolute -bottom-1 -right-1 bg-red-500/20 text-red-400 p-1.5 rounded-full border border-red-500/30">
                    <FiShield size={16} />
                </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight tracking-[0.2em]">Proxy Not Intercepted</h2>
            <p className="text-zinc-500 max-w-md text-sm leading-relaxed mb-10">
                This traffic to <span className="text-zinc-300 font-mono font-bold">{domain}</span> is currently being tunneled directly. To decrypt and inspect this traffic, add it to your <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Proxy Intercept List</span>.
            </p>
            <div className="flex flex-col gap-4">
                <button
                    onClick={handleIntercept}
                    disabled={isIntercepting}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-indigo-900/40 min-w-[280px]"
                >
                    <FiUnlock size={18} />
                    {isIntercepting ? "Adding..." : `Add "${domain}" to Proxy List`}
                </button>

                {clientName && clientName !== "-" && (
                    <button
                        onClick={() => onInterceptClient(clientName)}
                        disabled={isIntercepting}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-2xl font-black text-xs transition-all active:scale-95 disabled:opacity-50 border border-zinc-800 min-w-[280px]"
                    >
                        <FiShield size={18} />
                        {isIntercepting ? "Adding..." : `Intercept all from "${clientName}"`}
                    </button>
                )}
            </div>
        </div>
    );
};
