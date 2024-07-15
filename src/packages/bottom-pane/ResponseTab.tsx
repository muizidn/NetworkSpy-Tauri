import { Editor } from "@monaco-editor/react";
import { useState } from "react";
import "react-tabs/style/react-tabs.css";

export const ResponseTab = () => {
  const [currentTab, setCurrentTab] = useState("body");

  const tabs = [
    {
      id: "body",
      title: "Body",
    },
    {
      id: "header",
      title: "Headers",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white border w-full">
      <div className="flex space-x-2">
        <h3 className="p-2">Response</h3>
        {tabs.map((e, i) => {
          return (
            <button key={e.id} onClick={() => setCurrentTab(e.id)}>
              {e.title}
            </button>
          );
        })}
      </div>
      <div className="relative w-full h-full">
        <TabPanel current={currentTab} tag="body">
          <Editor
            defaultLanguage="javascript"
            defaultValue="// some comment"
            options={{ minimap: { enabled: false } }}
          />
        </TabPanel>
        <TabPanel current={currentTab} tag="header">
          <div>Header</div>
        </TabPanel>
      </div>
    </div>
  );
};

function TabPanel({
  tag,
  current,
  children,
}: {
  tag: string;
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute w-full h-full" hidden={current !== tag}>
      {children}
    </div>
  );
}
