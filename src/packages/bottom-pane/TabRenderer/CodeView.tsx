import { Editor } from "@monaco-editor/react";

export const CodeView = ({ data, language }: { data: string, language?: string }) => (
  <Editor
    className="w-full h-full"
    defaultLanguage={language || "text"}
    defaultValue={data}
    options={{ minimap: { enabled: false } }}
  />
);
