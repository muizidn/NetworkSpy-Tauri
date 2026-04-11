import { MonacoEditor } from "@src/packages/ui/MonacoEditor";

export const CodeView = ({ data, language }: { data: string, language?: string }) => (
  <MonacoEditor
    className="w-full h-full"
    defaultLanguage={language || "text"}
    defaultValue={data}
    options={{ minimap: { enabled: false } }}
  />
);
