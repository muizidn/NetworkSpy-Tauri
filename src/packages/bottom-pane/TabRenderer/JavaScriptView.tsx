import { Editor } from "@monaco-editor/react";

export const JavaScriptView = ({ data }: { data: string }) => (
  <Editor
    defaultLanguage="javascript"
    defaultValue={data}
    options={{ minimap: { enabled: false } }}
  />
);
