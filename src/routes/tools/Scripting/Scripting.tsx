import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React from "react";

interface ScriptingModel {
  enabled: boolean;
  name: string;
  method: ToolMethod;
  matchingRule: string;
  script: string;
  request: boolean;
  response: boolean;
}

const mock = {
  data: [
    {
      enabled: false,
      name: "Login",
      method: "GET",
      matchingRule: "/v1/login/*",
      request: true,
      response: true,
    },
    {
      enabled: true,
      name: "Header 2",
      method: "POST",
      matchingRule: "/v1/*",
      request: true,
      response: false,
    },
    {
      enabled: false,
      name: "Header 3",
      method: "PUT",
      matchingRule: "/v1/*",
      request: false,
      response: true,
    },
  ] as ScriptingModel[],
};

export class ScriptingCellRenderer implements Renderer<ScriptingModel> {
  type: keyof ScriptingModel;

  constructor(type: keyof ScriptingModel) {
    this.type = type;
  }

  render({ input }: { input: ScriptingModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
      case "request":
      case "response":
        content = (
          <input type="checkbox" checked={input[this.type]} readOnly />
        );
        break;
      case "name":
      case "method":
      case "matchingRule":
        content = input[this.type];
        break;
      default:
        content = null;
        break;
    }

    return (
      <div className="select-none text-sm text-nowrap px-2 py-2 truncate">
        {content}
      </div>
    );
  }
}

const ScriptingList: React.FC = () => {
  return (
    <div>
      <TableView
        headers={[
          {
            title: "Name",
            minWidth: 250,
            renderer: new ScriptingCellRenderer("name"),
          },
          {
            title: "Method",
            minWidth: 250,
            renderer: new ScriptingCellRenderer("method"),
          },
          {
            title: "Matching Rule",
            minWidth: 250,
            renderer: new ScriptingCellRenderer("matchingRule"),
          },
          {
            title: "Request",
            minWidth: 250,
            renderer: new ScriptingCellRenderer("request"),
          },
          {
            title: "Response",
            minWidth: 250,
            renderer: new ScriptingCellRenderer("response"),
          },
        ]}
        data={mock.data}
      />
    </div>
  );
};

export default ScriptingList;
