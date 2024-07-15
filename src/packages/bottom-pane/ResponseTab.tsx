import { Editor } from "@monaco-editor/react";
import { useState } from "react";
import { NSTabs, Tab } from "../ui/NSTabs";

export const ResponseTab = () => {
  const tabs: Tab[] = [
    {
      id: "body",
      title: "Body",
      content: (
        <Editor
          defaultLanguage="javascript"
          defaultValue="// some comment"
          options={{ minimap: { enabled: false } }}
        />
      ),
    },
    {
      id: "header",
      title: "Headers",
      content: <div>Header</div>,
    },
  ];

  return <NSTabs title="Response" tabs={tabs} initialTab="body" />;
};
