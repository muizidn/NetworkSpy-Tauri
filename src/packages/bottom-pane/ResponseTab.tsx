import { Editor } from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { NSTabs, Tab } from "../ui/NSTabs";
import { TableView } from "../ui/TableView";
import { KeyValueRenderer } from "./KeyValueRenderer";
import { decodeBody } from "./utils/bodyUtils";

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
    return decodeBody(data?.body, data?.content_type);
  }, [data?.body, data?.content_type]);

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
        <div className='h-full bg-[#1e1e1e]'>
          <Editor
            height="100%"
            language={data.content_type.includes("json") ? "json" : "text"}
            theme="vs-dark"
            value={decodedBody}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
      ),
    },
  ];

  return <NSTabs title="RESPONSE" tabs={tabs} initialTab="header" designStyle="basic" />;
};
