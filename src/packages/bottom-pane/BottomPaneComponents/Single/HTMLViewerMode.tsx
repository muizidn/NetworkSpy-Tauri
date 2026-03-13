import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { HTMLWebView } from "../../TabRenderer/HTMLWebView";
import { decodeBody } from "../../utils/bodyUtils";

export const HTMLViewerMode = () => {
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

    if (!trafficId) return <Placeholder text="Select a request to view render" />;
    if (loading) return <Placeholder text="Rendering HTML..." />;

    const isHTML = data?.content_type?.toLowerCase().includes('html');

    return (
        <div className="bg-white flex flex-col min-h-full">
            <div className="flex-grow overflow-hidden">
                {isHTML ? (
                    <HTMLWebView data={decodeBody(data?.body, 'text/html')} />
                ) : (
                    <div className="h-full flex items-center justify-center bg-[#0a0a0a] text-zinc-500 text-sm italic">
                        Response is not HTML ({data?.content_type || 'Unknown Type'})
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 italic">BROWSER</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
