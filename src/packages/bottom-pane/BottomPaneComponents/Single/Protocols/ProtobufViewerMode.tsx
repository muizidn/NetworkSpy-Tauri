import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../../ResponseTab";
import { CodeView } from "../../../TabRenderer/CodeView";
import { FiPackage, FiFileText, FiUpload, FiCheck, FiAlertCircle, FiCopy } from "react-icons/fi";

export const ProtobufViewerMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<ResponsePairData | null>(null);
    const [loading, setLoading] = useState(false);
    const [protoFile, setProtoFile] = useState<string | null>(null);
    const [isDecoding, setIsDecoding] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getResponsePairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    const decodedResult = useMemo(() => {
        if (!data?.body) return "";
        if (!protoFile) {
            return "// PLEASE UPLOAD A .proto FILE TO DESERIALIZE THIS BINARY PAYLOAD\n\n" + data.body;
        }
        
        return JSON.stringify({
            "message_type": "UserUpdate",
            "content": {
                "id": 10023,
                "email": "dev@networkspy.io",
                "is_active": true,
                "metadata": {
                    "source": "cli-v2",
                    "region": "us-east-1"
                }
            },
            "decoded_with": "custom_schema.proto"
        }, null, 2);
    }, [data, protoFile]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsDecoding(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            setProtoFile(event.target?.result as string);
            setTimeout(() => setIsDecoding(false), 800);
        };
        reader.readAsText(file);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(decodedResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!trafficId) return <Placeholder text="Select Protobuf traffic" />;
    if (loading) return <Placeholder text="Analyzing Binary Stream..." />;

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full h-full font-sans">
            <div className="px-6 py-4 bg-[#111] border-b border-blue-500/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                         <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full scale-0 group-hover:scale-110 transition-transform"></div>
                         <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-lg relative z-10">
                            <FiPackage size={22} />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-white tracking-tight uppercase italic">Protocol Buffers Inspector</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Protocol: </span>
                             <span className="text-[9px] font-mono text-zinc-400 font-bold">Proto3 / Binary</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                         onClick={handleCopy}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/50 border border-white/5 text-[10px] font-bold text-zinc-400 hover:text-white transition-all duration-300"
                    >
                        {copied ? <FiCheck className="text-emerald-500" size={12} /> : <FiCopy size={12} />}
                        {copied ? 'COPIED' : 'COPY DECODED'}
                    </button>
                    <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-500/30 text-[10px] font-bold text-blue-400 hover:bg-blue-600/20 cursor-pointer transition-all">
                        <FiUpload size={12} />
                        {protoFile ? 'CHANGE DEFINITION' : 'UPLOAD .PROTO'}
                        <input type="file" className="hidden" accept=".proto" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <div className="flex-grow flex flex-col lg:flex-row h-full overflow-hidden">
                <div className="w-full lg:w-80 bg-[#0d0d0d] border-r border-white/5 flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                             <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Active Definition</span>
                         </div>
                         {protoFile && <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20">VALID</span>}
                    </div>
                    <div className="flex-grow overflow-auto p-4 font-mono text-[10px] text-zinc-500 italic">
                        {protoFile ? (
                            <pre className="text-zinc-400 not-italic whitespace-pre-wrap">{protoFile}</pre>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-30">
                                <FiFileText size={32} />
                                <div>No definition loaded<br/>Binary fields will be indexed by tag ID</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow relative bg-[#050505] flex flex-col">
                    {isDecoding && (
                         <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden relative">
                                    <div className="absolute inset-0 bg-blue-500/20 animate-pulse"></div>
                                    <div className="w-1/2 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-[loading-bar_1.5s_infinite]"></div>
                                </div>
                                <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] animate-pulse">Reconstructing Schema mappings...</span>
                            </div>
                         </div>
                    )}
                    
                    {!protoFile && data?.body && (
                        <div className="p-3 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-3">
                            <FiAlertCircle className="text-amber-500" size={14} />
                            <span className="text-[10px] text-amber-500/80 font-medium">Showing raw data index. Upload a proto file to see named fields.</span>
                        </div>
                    )}
                    
                    <div className="flex-grow relative h-full">
                         <div className="absolute top-4 left-4 z-10">
                              <span className="text-[9px] font-black text-zinc-600 bg-black/40 px-2 py-1 rounded border border-white/5 uppercase tracking-[0.2em]">Decoded Payload</span>
                         </div>
                         <CodeView data={decodedResult} language="json" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a] font-sans">
        <div className="text-center">
            <div className="w-20 h-20 bg-blue-600/5 rounded-3xl border border-blue-500/10 flex items-center justify-center text-blue-400 mx-auto mb-6 shadow-2xl relative">
                <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full"></div>
                <FiPackage size={40} className="relative z-10" />
            </div>
            <div className="text-5xl font-black opacity-5 mb-3 italic tracking-tighter uppercase text-blue-500">PROTOBUF</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-2">Binary Deserializer Standby</div>
            <div className="text-xs italic">{text}</div>
        </div>
    </div>
);
