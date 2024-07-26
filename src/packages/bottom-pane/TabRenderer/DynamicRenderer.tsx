import { useState } from "react";
import { TreeView } from "./TreeView";
import { HexView } from "./HexView";
import { FormURLEncodedView } from "./FormURLEncodedView";
import { MultipartFormDataView } from "./MultipartFormDataView";
import { XMLView } from "./XMLView";
import { ImageView } from "./ImageView";
import { HTMLView } from "./HTMLView";
import { HTMLWebView } from "./HTMLWebView";
import { MessagePackView } from "./MessagePackView";
import { ProtobufView } from "./ProtobufView";
import { JavaScriptView } from "./JavaScriptView";
import { CMLView } from "./CMLView";
import { M3U8View } from "./M3U8View";

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
  | "JavaScriptView"
  | "CMLView"
  | "M3U8View";

const DynamicRenderer: React.FC<{ data: string }> = ({ data }) => {
  const [selectedView, setSelectedView] = useState<DataViewType>("TreeView");

  const renderView = () => {
    switch (selectedView) {
      case "TreeView":
        return <TreeView data={data} />;
      case "HexView":
        return <HexView data={data} />;
      case "FormURLEncodedView":
        return <FormURLEncodedView data={data} />;
      case "MultipartFormDataView":
        return <MultipartFormDataView data={data} />;
      case "XMLView":
        return <XMLView data={data} />;
      case "ImageView":
        return <ImageView data={data} />;
      case "HTMLView":
        return <HTMLView data={data} />;
      case "HTMLWebView":
        return <HTMLWebView data={data} />;
      case "MessagePackView":
        return <MessagePackView data={data} />;
      case "ProtobufView":
        return <ProtobufView data={data} />;
      case "JavaScriptView":
        return <JavaScriptView data={data} />;
      case "CMLView":
        return <CMLView data={data} />;
      case "M3U8View":
        return <M3U8View data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-2">
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
          <option value="JavaScriptView">JavaScript View</option>
          <option value="CMLView">CML View</option>
          <option value="M3U8View">M3U8 View</option>
        </select>
      </div>
      <div className="flex-grow h-full overflow-auto">{renderView()}</div>
    </div>
  );
};

export default DynamicRenderer;
