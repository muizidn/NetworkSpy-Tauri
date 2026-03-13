import { useMemo, useState, useEffect } from "react";
import { CMLView } from "./CMLView";
import { CodeView } from "./CodeView";
import { HexView } from "./HexView";
import { HTMLView } from "./HTMLView";
import { HTMLWebView } from "./HTMLWebView";
import { ImageView } from "./ImageView";
import { M3U8View } from "./M3U8View";
import { MessagePackView } from "./MessagePackView";
import { MultipartFormDataView } from "./MultipartFormDataView";
import { ProtobufView } from "./ProtobufView";
import { TreeView } from "./TreeView";
import { XMLView } from "./XMLView";

type DataViewType =
  | "TreeView"
  | "HexView"
  | "FormURLEncodedView"
  | "MultipartFormDataView"
  | "XMLView"
  | "ImageView"
  | "HTMLView"
  | "HTMLWebView"
  | "MessagePackView"
  | "ProtobufView"
  | "CodeView"
  | "CMLView"
  | "M3U8View";

const DynamicRenderer: React.FC<{ data: Uint8Array; contentType?: string }> = ({
  data,
  contentType,
}) => {
  const [selectedView, setSelectedView] = useState<DataViewType>("TreeView");

  useEffect(() => {
    if (!contentType) return;
    
    const ct = contentType.toLowerCase();
    if (ct.includes("image")) {
      setSelectedView("ImageView");
    } else if (ct.includes("json")) {
      setSelectedView("TreeView");
    } else if (ct.includes("xml") || ct.includes("html")) {
      setSelectedView("HTMLView");
    } else if (ct.includes("protobuf")) {
      setSelectedView("ProtobufView");
    } else if (ct.includes("javascript")) {
      setSelectedView("CodeView");
    }
  }, [contentType]);

  const decodedString = useMemo(() => {
    if (!data || data.length === 0) return "";
    
    // Quick heuristic: Check if first 100 bytes contain a null byte (common in binary files)
    const isLikelyBinary = Array.from(data.slice(0, 100)).some(byte => byte === 0);
    
    if (isLikelyBinary && !contentType?.includes("text") && !contentType?.includes("json")) {
       return "[Binary Data]";
    }

    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(data);
    } catch (e) {
      return "[Binary Data]";
    }
  }, [data, contentType]);

  const renderView = () => {
    switch (selectedView) {
      case "TreeView":
        return <TreeView data={decodedString} />;
      case "HexView":
        return <HexView data={data} />;
      case "MultipartFormDataView":
        return <MultipartFormDataView data={decodedString} />;
      case "XMLView":
        return <XMLView data={decodedString} />;
      case "ImageView":
        return <ImageView data={data} />;
      case "HTMLView":
        return <HTMLView data={decodedString} />;
      case "HTMLWebView":
        return <HTMLWebView data={decodedString} />;
      case "MessagePackView":
        return <MessagePackView data={decodedString} />;
      case "ProtobufView":
        return <ProtobufView data={decodedString} />;
      case "CodeView":
        return <CodeView data={decodedString} />;
      case "CMLView":
        return <CMLView data={decodedString} />;
      case "M3U8View":
        return <M3U8View data={decodedString} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-2 h-full">
      <div className="flex space-x-2 p-2">
        <label>Select View:</label>
        <select
          value={selectedView}
          onChange={(e) => setSelectedView(e.target.value as DataViewType)}
        >
          <option value="TreeView">Tree View</option>
          <option value="HexView">Hex View</option>
          <option value="FormURLEncodedView">Form URL Encoded View</option>
          <option value="MultipartFormDataView">
            Multipart Form Data View
          </option>
          <option value="XMLView">XML View</option>
          <option value="ImageView">Image View</option>
          <option value="HTMLView">HTML View</option>
          <option value="HTMLWebView">HTML Web View</option>
          <option value="MessagePackView">Message Pack View</option>
          <option value="ProtobufView">Protobuf View</option>
          <option value="CodeView">JavaScript View</option>
          <option value="CMLView">CML View</option>
          <option value="M3U8View">M3U8 View</option>
        </select>
      </div>
      <div className="flex-grow h-full w-full overflow-auto">{renderView()}</div>
    </div>
  );
};

export default DynamicRenderer;
