import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { NSTabs, Tab } from "../ui/NSTabs";
import { TableView } from "../ui/TableView";
import { KeyValueRenderer } from "./KeyValueRenderer";
import DynamicRenderer from "./TabRenderer/DynamicRenderer";

export type ResponsePairData = {
  headers: { key: string; value: string }[];
  params: { key: string; value: string | string[] }[];
  body?: Uint8Array;
  body_path?: string | null;
  content_type: string;
  intercepted: boolean;
};

export const ResponseTab = (props: {
  loadData: (traffic: { id: string }) => Promise<ResponsePairData>;
}) => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(
    () => selections.firstSelected?.id as string,
    [selections]
  );

  const [data, setData] = useState<ResponsePairData | null>(null);

  async function loadResponsePairData(traffic: { id: string }) {
    const responsePairData = await props.loadData(traffic);
    setData(responsePairData);
  }

  useEffect(() => {
    if (!trafficId) {
      return;
    }
    loadResponsePairData({ id: trafficId as string });
  }, [trafficId]);

  const decodedBody = useMemo(() => {
    if (!data?.body || data.body.length === 0) return "";
    try {
      return new TextDecoder().decode(data.body);
    } catch (e) {
      console.error("Failed to decode body as UTF-8", e);
      return "[Binary Data]";
    }
  }, [data?.body]);

  if (!trafficId || !data) {
    return null;
  }

  const tabs: Tab[] = [
    {
      id: "header",
      title: "Headers",
      content: (
        <TableView
          headers={[
            {
              title: "Key",
              minWidth: 250,
              renderer: new KeyValueRenderer("key"),
            },
            {
              title: "Value",
              minWidth: 250,
              renderer: new KeyValueRenderer("value"),
            },
          ]}
          data={data.headers}
        />
      ),
    },
    {
      id: "body",
      title: "Body",
      content: (
        <div className='h-full bg-[#111] overflow-hidden'>
          <DynamicRenderer
            data={data.body || new Uint8Array()}
            contentType={data.content_type}
          />
        </div>
      ),
    },
  ];

  return <NSTabs title="RESPONSE" tabs={tabs} initialTab="header" />;
};
