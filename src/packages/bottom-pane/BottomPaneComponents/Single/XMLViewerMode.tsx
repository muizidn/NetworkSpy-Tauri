import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { ResponsePairData } from "../../ResponseTab";
import { XMLView } from "../../TabRenderer/XMLView";

export const XMLViewerMode = () => {
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

    if (!trafficId) return <Placeholder text="Select a request to view XML" />;
    if (loading) return <Placeholder text="Formatting XML..." />;

    const isXML = data?.content_type?.toLowerCase().includes('xml');

    return (
        <div className="bg-[#0a0a0a] flex flex-col min-h-full">
            <div className="flex-grow p-4 font-mono">
                {isXML ? (
                    <XMLView data={data?.body || ""} />
                ) : (
                    <div className="text-zinc-500 text-sm italic p-4 text-center">
                         Not an XML document ({data?.content_type || 'Unknown Type'})
                    </div>
                )}
            </div>
        </div>
    );
};

const Placeholder = ({ text }: { text: string }) => (
    <div className="h-full flex items-center justify-center text-zinc-500 bg-[#0a0a0a]">
        <div className="text-center">
            <div className="text-4xl font-black opacity-10 mb-2 italic">XML</div>
            <div className="text-sm">{text}</div>
        </div>
    </div>
);
