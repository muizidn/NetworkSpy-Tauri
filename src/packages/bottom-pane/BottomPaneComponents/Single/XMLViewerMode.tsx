import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { XMLView } from "../../TabRenderer/XMLView";
import { FiCopy, FiCheck, FiWind } from "react-icons/fi";

const beautifyXML = (xml: string) => {
    if (!xml) return "";
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(function(node) {
        if (node.match( /^\/\w/ )) {
            indent = indent.substring(tab.length);
        }
        formatted += indent + '<' + node + '>\r\n';
        if (node.match( /^<?\w[^>]*[^\/]$/ )) {
            indent += tab;
        }
    });
    return formatted.substring(1, formatted.length-3);
};

export const XMLViewerMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<ResponsePairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isFormatted, setIsFormatted] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getResponsePairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const displayXML = useMemo(() => {
        const raw = data?.body || "";
        return isFormatted ? beautifyXML(raw) : raw;
    }, [data, isFormatted]);

    const handleCopy = () => {
        navigator.clipboard.writeText(displayXML);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select a request to view XML" />;
    if (loading) return <Placeholder text="Formatting XML..." />;

    const isXML = data?.content_type?.toLowerCase().includes('xml') || data?.body?.trim().startsWith('<');

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full h-full font-sans">
            {/* Premium Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-[#111] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">XML Inspector</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsFormatted(!isFormatted)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 border ${
                            isFormatted 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                            : 'bg-zinc-800/50 border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
                    >
                        <FiWind size={12} />
                        {isFormatted ? 'Beauty Mode: ON' : 'Make it Beautiful'}
                    </button>

                    <button 
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'Copy' : 'Copy'}
                    </button>
                </div>
            </div>

            <div className="flex-grow p-4">
                {isXML ? (
                    <XMLView data={displayXML} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-zinc-900/10 rounded-2xl border border-zinc-800/50 m-4 italic">
                         <div className="text-xs mb-1 font-bold uppercase tracking-widest opacity-30">Type Mismatch</div>
                         <div className="text-[10px]">Not a standard XML document ({data?.content_type || 'Unknown Type'})</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] font-sans">
        <div className="text-center">
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter uppercase">XML</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Structure Engine Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
