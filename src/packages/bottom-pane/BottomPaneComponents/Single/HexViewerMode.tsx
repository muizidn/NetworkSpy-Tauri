import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { HexView } from "../../TabRenderer/HexView";
import { FiCopy, FiCheck, FiCpu } from "react-icons/fi";

export const HexViewerMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<ResponsePairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getResponsePairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const handleCopy = () => {
        if (!data?.body) return;
        const bytes = new TextEncoder().encode(data.body);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
        navigator.clipboard.writeText(hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select a request to view HEX" />;
    if (loading) return <Placeholder text="Calculating HEX..." />;

    const byteCount = data?.body ? new TextEncoder().encode(data.body).length : 0;

    return (
        <div className="bg-[#050505] flex flex-col min-h-full h-full font-sans">
            {/* Premium Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#0a0a0a] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Binary Inspector</span>
                    <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-900 rounded border border-white/5 text-[9px] text-zinc-500 font-mono">
                         <FiCpu size={10} />
                         {byteCount} BYTES
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-emerald-400 transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'HEX COPIED' : 'COPY HEX'}
                    </button>
                </div>
            </div>

            <div className="flex-grow p-6 overflow-auto custom-scrollbar">
                <div className="bg-zinc-900/10 rounded-2xl border border-zinc-800/50 p-6 shadow-2xl">
                    <HexView data={data?.body || ""} />
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#050505] font-sans">
        <div className="text-center">
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter uppercase">HEX</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Memory Engine Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
