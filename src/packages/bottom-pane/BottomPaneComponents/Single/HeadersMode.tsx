import { useEffect, useState, useMemo } from "react";
import { useAppProvider } from "@src/packages/app-env";
import { useTrafficListContext } from "../../../main-content/context/TrafficList";
import { RequestPairData } from "../../RequestTab";
import { TableView } from "../../../ui/TableView";
import { KeyValueRenderer } from "../../KeyValueRenderer";

export const HeadersMode = () => {
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

  if (!trafficId) return <Placeholder text="Select a request to view headers" />;
  if (loading) return <Placeholder text="Loading headers..." />;

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col">
      <div className="flex-grow overflow-auto p-4">
        <div className="mb-6">
          <h3 className="text-[10px] font-black uppercase text-blue-500 mb-2 tracking-widest">Request Headers</h3>
          <TableView
            headers={[
              { title: "Key", minWidth: 200, renderer: new KeyValueRenderer("key") },
              { title: "Value", minWidth: 300, renderer: new KeyValueRenderer("value") },
            ]}
            data={data?.headers || []}
          />
        </div>
      </div>
    </div>
  );
};

const Placeholder = ({ text }: { text: string }) => (
  <div className="h-full flex items-center justify-center text-zinc-500 bg-[#1e1e1e]">
    <div className="text-center">
      <div className="text-4xl font-bold opacity-10 mb-2">HEADERS</div>
      <div className="text-sm">{text}</div>
    </div>
  </div>
);
