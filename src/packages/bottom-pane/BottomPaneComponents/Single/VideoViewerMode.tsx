import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { FiVideo, FiMaximize, FiSettings, FiActivity } from "react-icons/fi";

export const VideoViewerMode = () => {
    const { provider } = useAppProvider();
    const { selections } = useTrafficListContext();
    const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
    const [data, setData] = useState<ResponsePairData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trafficId) return;
        setLoading(true);
        provider.getResponsePairData(trafficId)
            .then((res) => setData(res))
            .finally(() => setLoading(false));
    }, [trafficId, provider]);

    if (!trafficId) return <Placeholder text="Select a request to view video" />;
    if (loading) return <Placeholder text="Syncing video segments..." />;

    const isVideo = data?.content_type?.toLowerCase().includes('video') || data?.content_type?.toLowerCase().includes('mpegurl')

    return (
        <div className="bg-[#050505] flex flex-col p-4 sm:p-6 min-h-full">
            <div className="flex-grow flex flex-col max-w-4xl mx-auto w-full">
                {/* Video Stage */}
                <div className="aspect-video bg-black rounded-2xl border border-white/5 relative overflow-hidden group shadow-2xl">
                    {isVideo ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40">
                            <FiActivity className="text-blue-500 animate-pulse" size={48} />
                            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Live Stream</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-zinc-400">
                                        <FiSettings size={14} className="hover:text-white cursor-pointer" />
                                        <FiMaximize size={14} className="hover:text-white cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <FiVideo className="text-zinc-800 mb-4" size={48} />
                            <span className="text-zinc-600 text-xs font-medium">Valid video stream not found</span>
                        </div>
                    )}
                </div>

                {/* Metadata & Stats */}
                <div className="mt-6 flex gap-4">
                    <div className="flex-grow bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4">
                        <h3 className="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">Stream Info</h3>
                        <div className="grid grid-cols-2 gap-y-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] text-zinc-600 uppercase font-bold">Format</span>
                                <span className="text-[11px] text-zinc-300">{data?.content_type || 'HLS (m3u8)'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] text-zinc-600 uppercase font-bold">Bitrate</span>
                                <span className="text-[11px] text-zinc-300">4.2 Mbps (Simulated)</span>
                            </div>
                        </div>
                    </div>
                    <div className="w-56 bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            BUFFER HEALTHY
                        </span>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full w-4/5 bg-emerald-500/50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#050505]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 italic tracking-tighter">CINEMA</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
