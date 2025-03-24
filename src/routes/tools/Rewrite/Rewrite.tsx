import { ToolMethod } from "@src/models/ToolMethod";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React from "react";

interface RewriteModel {
  enabled: boolean;
  name: string;
  method: ToolMethod;
  matchingRule: string;
  script: string;
}

const mock = {
  data: [
    {
      enabled: true,
      name: "Login",
      method: "GET",
      matchingRule: "/v1/login/*",
      script: "/home",
    },
    {
      enabled: false,
      name: "Header 2",
      method: "POST",
      matchingRule: "/v1/*",
      script: "/dashboard",
    },
    {
      enabled: true,
      name: "Header 3",
      method: "PUT",
      matchingRule: "/v1/*",
      script: "/profile",
    },
  ] as RewriteModel[],
};

export class RewriteCellRenderer implements Renderer<RewriteModel> {
  type: keyof RewriteModel;

  constructor(type: keyof RewriteModel) {
    this.type = type;
  }

  render({ input }: { input: RewriteModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "enabled":
        content = <input type="checkbox" checked={input[this.type]} readOnly />;
        break;
      case "name":
      case "method":
      case "matchingRule":
      case "script":
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

const RewriteList: React.FC = () => {
  return (
    <div>
      <TableView
        headers={[
          {
            title: "Enabled",
            minWidth: 100,
            renderer: new RewriteCellRenderer("enabled"),
          },
          {
            title: "Name",
            minWidth: 250,
            renderer: new RewriteCellRenderer("name"),
          },
          {
            title: "Method",
            minWidth: 250,
            renderer: new RewriteCellRenderer("method"),
          },
          {
            title: "Matching Rule",
            minWidth: 250,
            renderer: new RewriteCellRenderer("matchingRule"),
          },
          {
            title: "Script",
            minWidth: 250,
            renderer: new RewriteCellRenderer("script"),
          },
        ]}
        data={mock.data}
      />
    </div>
  );
};

export default RewriteList;
