import { Editor } from "@monaco-editor/react";
import { NSTabs, Tab } from "../ui/NSTabs";
import { TableView } from "../ui/TableView";
import { TextRenderer } from "../main-content/Renderers";
import { KeyValueRenderer } from "./KeyValueRenderer";

type HTMLData = {
  body: {
    type: string;
    content: string;
  };
  headers: { key: string; value: string }[];
};

interface Renderer {
  type: string;
  render: (input: HTMLData) => React.ReactNode;
}

type ResponsePairData = {
  [key: string]: HTMLData;
};

// Mock components for rendering different data types
const TreeView = ({ data }: { data: string }) => (
  <pre>{JSON.stringify(JSON.parse(data), null, 2)}</pre>
);
const HexView = ({ data }: { data: string }) => <pre>{data}</pre>;
const FormURLEncodedView = ({ data }: { data: string }) => <pre>{data}</pre>;
const MultipartFormDataView = ({ data }: { data: string }) => <pre>{data}</pre>;
const XMLView = ({ data }: { data: string }) => <pre>{data}</pre>;
const ImageView = ({ src }: { src: string }) => (
  <img src={src} alt="response" />
);
const HTMLView = ({ data }: { data: string }) => <pre>{data}</pre>;
const HTMLWebView = ({ data }: { data: string }) => (
  <iframe srcDoc={data} style={{ width: "100%", height: "100%" }} />
);
const MessagePackView = ({ data }: { data: string }) => <pre>{data}</pre>;
const ProtobufView = ({ data }: { data: string }) => <pre>{data}</pre>;
const JavaScriptView = ({ data }: { data: string }) => (
  <Editor
    defaultLanguage="javascript"
    defaultValue={data}
    options={{ minimap: { enabled: false } }}
  />
);
const CMLView = ({ data }: { data: string }) => <pre>{data}</pre>;
const M3U8View = ({ data }: { data: string }) => <pre>{data}</pre>;

export const ResponseTab = () => {
  const data: ResponsePairData = {
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
      content: (
        <Editor
          defaultLanguage={data.json.body.type}
          defaultValue={data.json.body.content}
          options={{ minimap: { enabled: false } }}
        />
      ),
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
      content: <ImageView src={data.image.body.content} />,
    },
    {
      id: "css",
      title: "CSS",
      content: (
        <Editor
          defaultLanguage="css"
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

  return <NSTabs title="Response" tabs={tabs} initialTab="body" />;
};
