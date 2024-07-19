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
  JavaScriptView,
  M3U8View,
  MessagePackView,
  MultipartFormDataView,
  ProtobufView,
  TreeView,
  XMLView,
} from "./TabRenderer";
import DynamicRenderer from "./TabRenderer/DynamicRenderer";

type HTMLData = {
  body: {
    type: string;
    content: string;
  };
  headers: { key: string; value: string }[];
};

type RequestPairData = {
  [key: string]: HTMLData;
};

export const RequestTab = () => {
  const data: RequestPairData = {
    json: {
      body: {
        type: "json",
        content: '{"data": null}',
      },
      headers: [
        { key: "Authorization", value: "Bearer token" },
        { key: "X-Cloudflare", value: "Nonce, misharp" },
      ],
    },
    xml: {
      body: {
        type: "xml",
        content:
          "<note><to>User</to><from>AI</from><message>Hello, world!</message></note>",
      },
      headers: [{ key: "Content-Type", value: "application/xml" }],
    },
    image: {
      body: {
        type: "image",
        content: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
      },
      headers: [{ key: "Content-Type", value: "image/png" }],
    },
    html: {
      body: {
        type: "html",
        content:
          "<!DOCTYPE html><html><body><h1>Hello, world!</h1></body></html>",
      },
      headers: [{ key: "Content-Type", value: "text/html" }],
    },
  };

  const tabs: Tab[] = [
    {
      id: "body",
      title: "Body",
      content: <DynamicRenderer data={JSON.stringify(data.json)} />,
    },
    {
      id: "raw",
      title: "Raw",
      content: <pre>{data.json.body.content}</pre>,
    },
    {
      id: "treeview",
      title: "TreeView",
      content: <TreeView data={data.json.body.content} />,
    },
    {
      id: "hex",
      title: "Hex",
      content: <HexView data={data.json.body.content} />,
    },
    {
      id: "form-urlencoded",
      title: "Form URL Encoded",
      content: <FormURLEncodedView data={data.json.body.content} />,
    },
    {
      id: "multipart-form-data",
      title: "Multipart Form Data",
      content: <MultipartFormDataView data={data.json.body.content} />,
    },
    {
      id: "xml",
      title: "XML",
      content: <XMLView data={data.xml.body.content} />,
    },
    {
      id: "image",
      title: "Image",
      content: <ImageView data={data.image.body.content} />,
    },
    {
      id: "css",
      title: "CSS",
      content: (
        <Editor
          defaultLanguage='css'
          defaultValue={data.json.body.content}
          options={{ minimap: { enabled: false } }}
        />
      ),
    },
    {
      id: "html",
      title: "HTML",
      content: <HTMLView data={data.html.body.content} />,
    },
    {
      id: "html-webview",
      title: "HTML WebView",
      content: <HTMLWebView data={data.html.body.content} />,
    },
    {
      id: "message-pack",
      title: "Message Pack",
      content: <MessagePackView data={data.json.body.content} />,
    },
    {
      id: "protobuf",
      title: "Protobuf",
      content: <ProtobufView data={data.json.body.content} />,
    },
    {
      id: "javascript",
      title: "JavaScript",
      content: <JavaScriptView data={data.json.body.content} />,
    },
    {
      id: "cml",
      title: "CML",
      content: <CMLView data={data.json.body.content} />,
    },
    {
      id: "m3u8",
      title: "M3U8 (HLS)",
      content: <M3U8View data={data.json.body.content} />,
    },
    {
      id: "header",
      title: "Headers",
      content: (
        <TableView
          headers={[
            {
              title: "Key",
              renderer: new KeyValueRenderer("key"),
            },
            {
              title: "Value",
              renderer: new KeyValueRenderer("value"),
            },
          ]}
          data={data.json.headers}
        />
      ),
    },
  ];

  return <NSTabs title='REQUEST' tabs={tabs} initialTab='body' />;
};
