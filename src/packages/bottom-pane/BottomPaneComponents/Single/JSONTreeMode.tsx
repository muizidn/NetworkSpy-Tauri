import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { TreeView } from "../../TabRenderer/TreeView";

export const JSONTreeMode = () => {
  const { provider } = useAppProvider();
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(() => selections.firstSelected?.id as string, [selections]);
  const [data, setData] = useState<RequestPairData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trafficId) return;
    setLoading(true);
    provider.getRequestPairData(trafficId)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [trafficId, provider]);

  if (!trafficId) return <Placeholder text="Select a request to view JSON Tree" />;
  if (loading) return <Placeholder text="Loading data..." />;

  return (
    <div className="bg-[#1e1e1e] flex flex-col min-h-full">
      <div className="flex-grow p-4">
        <TreeView data={data?.body || ""} />
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e]">
    <div className="text-center">
      <div className="text-4xl font-bold opacity-10 mb-2">JSON TREE</div>
      <div className="text-sm">{text}</div>
    </div>
  </div>
);
