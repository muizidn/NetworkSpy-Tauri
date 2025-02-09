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

type ResponsePairData = {
  headers: { key: string; value: string }[];
  params: { key: string; value: string | string[] }[];
  body: string;
  contentType: string;
};

export const ResponseTab = () => {
  const { selections } = useTrafficListContext();
  const traffic = useMemo(() => selections.firstSelected, [selections]);

  if (!traffic) {
    return null;
  }

  const data: ResponsePairData = {
    headers: [
      { key: "Authorization", value: "Bearer token" },
      { key: "X-Cloudflare", value: "Nonce, misharp" },
      { key: "Content-Type", value: "application/json" }, // Change this to test other types
    ],
    params: [
      { key: "authToken", value: "Bearer token" },
      { key: "page", value: "1" },
      { key: "perPage", value: "100" },
      { key: "product_ids", value: ["id1", "id2"] },
    ],
    body: `{
      "id": "4541600237192504000",
      "tags": ["API TESTING", "NETWORK MONITORING"],
      "url": "https://amazon.com:157/product/books?page=1&authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiYWRtaW4iLCJwZXJtaXNzaW9ucyI6WyJib29rcyJdLCJpYXQiOjE2MjMzMzAwNzIsImV4cCI6MTYyMzM0MjY3Mn0.WjtjqnszjFL3Gb-F3TSvTKHl5VxbFf4jJ2yyK_SXxxg",
      "client": "Video Streaming",
      "method": "DELETE",
      "status": "Failed",
      "code": "200",
      "time": "650 ms",
      "duration": "91 bytes",
      "request": "Response data",
      "response": "-"
    }`,
    contentType: "application/x-www-form-urlencoded", // Change this to test other types
  };

  const isImage = data.contentType.includes("image");
  const isHTML = data.contentType.includes("html");
  const isJSON = data.contentType.includes("json");
  const isXML = data.contentType.includes("xml");
  const isJavaScript = data.contentType.includes("javascript");
  const isProtobuf = data.contentType.includes("protobuf");
  const isCML = data.contentType.includes("cml");
  const isHLS = data.contentType.includes("application/x-mpegurl");
  const isMultipart = data.contentType.includes("multipart/form-data");
  const isFormURLEncoded = data.contentType.includes(
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

  return <NSTabs title="RESPONSE" tabs={tabs} initialTab="body" />;
};