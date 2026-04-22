import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../../ResponseTab";
import { CodeView } from "../../../TabRenderer/CodeView";
import { FiLayers, FiCopy, FiCheck, FiCode, FiShare2 } from "react-icons/fi";
import { decodeBody } from "@src/packages/bottom-pane/utils/bodyUtils";

const beautifyXML = (xml: string) => {
    if (!xml) return "";
    let formatted = '';
    let indent = '';
    const tab = '  ';
    xml.split(/>\s*</).forEach(function (node) {
        if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
        formatted += indent + '<' + node + '>\r\n';
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
    });
    return formatted.substring(1, formatted.length - 1).trim();
};

export const SOAPViewerMode = () => {
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

    const formattedSOAP = useMemo(() => {
        return beautifyXML(decodeBody(data?.body) || "");
    }, [data]);

    const handleCopy = () => {
        navigator.clipboard.writeText(formattedSOAP);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select SOAP traffic" />;
    if (loading) return <Placeholder text="Expanding SOAP Envelope..." />;

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full h-full font-sans">
            <div className="px-4 @sm:px-6 py-4 bg-[#111] border-b border-blue-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                        <div className="w-8 h-8 @sm:w-10 @sm:h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg relative z-10 brightness-125">
                            <FiShare2 size={22} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tight italic">Enterprise SOAP Inspector</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-zinc-500 tracking-widest">WSDL Endpoint: </span>
                            <span className="text-[9px] font-mono text-blue-400/80 font-bold tracking-wider">SOAP 1.1 / 1.2</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'COPIED' : 'COPY BODY'}
                    </button>
                </div>
            </div>

            <div className="flex-grow relative bg-[#050505]">
                <div className="absolute top-4 left-4 z-10">
                    <span className="text-[9px] font-black text-blue-500/40 bg-black/40 px-2 py-1 rounded border border-blue-500/10 tracking-[0.2em]">XML Payload</span>
                </div>
                <CodeView data={formattedSOAP} language="xml" />
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] font-sans">
        <div className="text-center">
            <div className="w-16 h-16 @sm:w-20 @sm:h-20 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex items-center justify-center text-blue-500 mx-auto mb-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full"></div>
                <FiShare2 size={40} className="relative z-10" />
            </div>
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter text-blue-500/50">WSDL</div>
            <div className="text-[10px] font-bold tracking-widest text-zinc-600 mb-2">Service Descriptor Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
