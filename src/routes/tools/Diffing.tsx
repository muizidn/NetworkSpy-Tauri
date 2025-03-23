import { TextRenderer } from "@src/packages/main-content/Renderers";
import { TableView } from "@src/packages/ui/TableView";
import React from "react";

const data = {
  headers: [
    { name: "Header 1", method: "GET", matchingRule: "Exact" },
    { name: "Header 2", method: "POST", matchingRule: "Partial" },
    { name: "Header 3", method: "PUT", matchingRule: "Regex" },
  ],
};

const Diffing: React.FC = () => {
  return (
    <div>
      <TableView
        headers={[
          {
            title: "Name",
            minWidth: 250,
            renderer: new TextRenderer("name"),
          },
          {
            title: "Method",
            minWidth: 250,
            renderer: new TextRenderer("method"),
          },
          {
            title: "Matching Rule",
            minWidth: 250,
            renderer: new TextRenderer("matchingRule"),
          },
        ]}
        data={data.headers}
      />
    </div>
  );
};

export default Diffing;
