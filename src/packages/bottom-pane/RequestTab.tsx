import { Editor } from "@monaco-editor/react";
import { NSTabs, Tab } from "../ui/NSTabs";
import { TableView } from "../ui/TableView";
import { KeyValueRenderer } from "./KeyValueRenderer";
import {
  CMLView,
  FormURLEncodedView,
  HexView,
  HTMLView,
  HTMLWebView,
  ImageView,
  CodeView,
  M3U8View,
  MessagePackView,
  MultipartFormDataView,
  ProtobufView,
  TreeView,
  XMLView,
} from "./TabRenderer";
import DynamicRenderer from "./TabRenderer/DynamicRenderer";
import { useTrafficListContext } from "../main-content/context/TrafficList";
import { useEffect, useMemo, useRef, useState } from "react";

export type RequestPairData = {
  headers: { key: string; value: string }[];
  params: { key: string; value: string | string[] }[];
  body: string;
  content_type: string;
};

export const RequestTab = (props: {
  loadData: (traffic: { id: string }) => Promise<RequestPairData>;
}) => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(
    () => selections.firstSelected?.id as string,
    [selections]
  );

  const [data, setData] = useState<RequestPairData | null>(null);

  async function loadRequestPairData(traffic: { id: string }) {
    const requestPairData = await props.loadData(traffic);
    setData(requestPairData);
  }

  useEffect(() => {
    if (!trafficId) {
      return;
    }
    loadRequestPairData({ id: trafficId as string });
  }, [trafficId]);

  if (!trafficId || !data) {
    return null;
  }

  const contentType = data.content_type || "";
  const isImage = contentType.includes("image");
  const isHTML = contentType.includes("html");
  const isJSON = contentType.includes("json");
  const isXML = contentType.includes("xml");
  const isJavaScript = contentType.includes("javascript");
  const isProtobuf = contentType.includes("protobuf");
  const isCML = contentType.includes("cml");
  const isHLS = contentType.includes("application/x-mpegurl");
  const isMultipart = contentType.includes("multipart/form-data");
  const isFormURLEncoded = contentType.includes(
    "application/x-www-form-urlencoded"
  );

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
      id: "params",
      title: "Params",
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
          data={data.params.map(p => ({ key: p.key, value: Array.isArray(p.value) ? p.value.join(', ') : p.value }))}
        />
      ),
    },
    {
      id: "body",
      title: "Body",
      content: (
        <div className="h-full bg-[#111] overflow-hidden">
            <Editor
                height="100%"
                theme="vs-dark"
                defaultLanguage="text"
                value={data.body}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 11,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                     automaticLayout: true,
                }}
            />
        </div>
      ),
    },
  ];

  return <NSTabs title="REQUEST" tabs={tabs} initialTab="header" />;
};
