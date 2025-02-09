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
import { invoke } from "@tauri-apps/api";

type RequestPairData = {
  headers: { key: string; value: string }[];
  params: { key: string; value: string | string[] }[];
  body: string;
  content_type: string;
};

export const RequestTab = () => {
  const { selections } = useTrafficListContext();
  const trafficId = useMemo(
    () => selections.firstSelected?.id as string,
    [selections]
  );

  const [data, setData] = useState<RequestPairData | null>(null);

  async function loadRequestPairData(traffic: { id: string }) {
    const requestPairData = await invoke<RequestPairData>(
      "get_request_pair_data",
      { trafficId: traffic.id as string }
    );
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

  const isImage = data.content_type.includes("image");
  const isHTML = data.content_type.includes("html");
  const isJSON = data.content_type.includes("json");
  const isXML = data.content_type.includes("xml");
  const isJavaScript = data.content_type.includes("javascript");
  const isProtobuf = data.content_type.includes("protobuf");
  const isCML = data.content_type.includes("cml");
  const isHLS = data.content_type.includes("application/x-mpegurl");
  const isMultipart = data.content_type.includes("multipart/form-data");
  const isFormURLEncoded = data.content_type.includes(
    "application/x-www-form-urlencoded"
  );

  const tabs: Tab[] = [
    {
      id: "body",
      title: "Body",
      content: <DynamicRenderer data={data.body} />,
    },
    {
      id: "raw",
      title: "Raw",
      content: <pre>{data.body}</pre>,
    },
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
    ...(isImage
      ? [
          {
            id: "image",
            title: "Image",
            content: <ImageView data={data.body} />,
          },
        ]
      : []),
    ...(isHTML
      ? [
          {
            id: "html",
            title: "HTML",
            content: <HTMLView data={data.body} />,
          },
        ]
      : []),
    ...(isJSON
      ? [
          {
            id: "json",
            title: "JSON",
            content: <DynamicRenderer data={data.body} />,
          },
        ]
      : []),
    ...(isXML
      ? [
          {
            id: "xml",
            title: "XML",
            content: <XMLView data={data.body} />,
          },
        ]
      : []),
    ...(isJavaScript
      ? [
          {
            id: "javascript",
            title: "JavaScript",
            content: <CodeView data={data.body} />,
          },
        ]
      : []),
    ...(isProtobuf
      ? [
          {
            id: "protobuf",
            title: "Protobuf",
            content: <ProtobufView data={data.body} />,
          },
        ]
      : []),
    ...(isCML
      ? [
          {
            id: "cml",
            title: "CML",
            content: <CMLView data={data.body} />,
          },
        ]
      : []),
    ...(isHLS
      ? [
          {
            id: "m3u8",
            title: "M3U8 (HLS)",
            content: <M3U8View data={data.body} />,
          },
        ]
      : []),
    ...(isMultipart
      ? [
          {
            id: "multipart-form-data",
            title: "Multipart Form Data",
            content: <MultipartFormDataView data={data.body} />,
          },
        ]
      : []),
    ...(isFormURLEncoded
      ? [
          {
            id: "form-urlencoded",
            title: "Form URL Encoded",
            content: <FormURLEncodedView params={data.params} />,
          },
        ]
      : []),
    {
      id: "treeview",
      title: "TreeView",
      content: isJSON ? <TreeView data={data.body} /> : null,
    },
    {
      id: "hex",
      title: "Hex",
      content: isJSON ? <HexView data={data.body} /> : null,
    },
  ];

  return <NSTabs title="REQUEST" tabs={tabs} initialTab="body"/>;
};
