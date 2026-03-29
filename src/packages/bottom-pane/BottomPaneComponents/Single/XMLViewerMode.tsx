import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { XMLView } from "../../TabRenderer/XMLView";
import { FiCopy, FiCheck, FiWind, FiLayers } from "react-icons/fi";
import { decodeBody } from "../../utils/bodyUtils";

const beautifyXML = (xml: string) => {
    if (!xml) return "";
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(function (node) {
        if (node.match(/^\/\w/)) {
            indent = indent.substring(tab.length);
        }
        formatted += indent + '<' + node + '>\r\n';
        if (node.match(/^<?\w[^>]*[^\/]$/)) {
            indent += tab;
        }
    });
    return formatted.substring(1, formatted.length - 3).trim();
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
        const decoded = decodeBody(data?.body, 'application/xml');
        return isFormatted ? beautifyXML(decoded) : decoded;
    }, [data, isFormatted]);

    const handleCopy = () => {
        navigator.clipboard.writeText(displayXML);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select request for XML structure" />;
    if (loading) return <Placeholder text="Beautifying XML..." />;

    const isXML = data?.content_type?.toLowerCase().includes('xml') || displayXML?.trim().startsWith('<');

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full h-full font-sans">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#111] border-b border-orange-500/10 shadow-2xl relative z-10">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full scale-0 group-hover:scale-110 transition-transform"></div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-2xl relative z-10">
                            <FiLayers size={20} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tight uppercase italic">XML / SOAP Inspector</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Type: </span>
                            <span className="text-[9px] font-mono text-orange-400/80 font-bold uppercase tracking-wider">{data?.content_type || 'application/xml'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFormatted(!isFormatted)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-300 border ${isFormatted
                                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                : 'bg-zinc-800/50 border-white/5 text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <FiWind size={12} />
                        {isFormatted ? 'BEAUTIFY: ACTIVE' : 'MAKE IT PRETTY'}
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'COPIED' : 'COPY'}
                    </button>
                </div>
            </div>

            <div className="flex-grow p-4 relative h-full">
                {isXML ? (
                    <div className="h-full bg-[#050505] rounded-2xl border border-white/[0.03] overflow-hidden shadow-3xl">
                        <XMLView data={displayXML} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 bg-orange-500/5 rounded-2xl border border-orange-500/10 m-4 italic">
                        <div className="text-xs mb-1 font-bold uppercase tracking-widest text-orange-500/40">XML Mismatch</div>
                        <div className="text-[10px] text-zinc-600">This payload does not appear to be valid XML</div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] font-sans">
        <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-600/5 rounded-3xl border border-orange-500/10 flex items-center justify-center text-orange-500 mx-auto mb-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-orange-500/5 blur-2xl rounded-full"></div>
                <FiLayers size={40} className="relative z-10" />
            </div>
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter uppercase text-orange-500">STRUCTURE</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">XML DOM Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
