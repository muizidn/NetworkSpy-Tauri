import { TrafficItemMap } from "@src/packages/main-content/model/TrafficItemMap";
import { Renderer, TableView } from "@src/packages/ui/TableView";
import React, { useState } from "react";

interface DiffingModel extends TrafficItemMap  {
  note: string;
}

const mock = {
  data: [
    {
      note: "Login",
      method: "GET",
      is_ssl: false,
    },
    {
      note: "Header 2",
      method: "POST",
      is_ssl: true,
    },
    {
      note: "Header 3",
      method: "PUT",
      is_ssl: false,
    },
  ] as DiffingModel[],
};

interface DiffingModelRuntimeData {
  __runtime__index: number;
  __runtime__isDiffLeft: boolean;
  __runtime__isDiffRight: boolean;
}

type __RendererModel = DiffingModel & DiffingModelRuntimeData

export class DiffingCellRenderer implements Renderer<__RendererModel> {
  type: keyof (__RendererModel);
  onClickDiff?: (index: number, checked: boolean) => void;

  constructor(type: keyof (__RendererModel), onClickDiff?: (index: number, checked: boolean) => void) {
    this.type = type;
    this.onClickDiff = onClickDiff;
  }

  render({ input }: { input: __RendererModel }): React.ReactNode {
    let content: React.ReactNode;

    switch (this.type) {
      case "is_ssl":
        content = (
          <input
            type="checkbox"
            checked={input[this.type] as boolean}
            readOnly
          />
        );
        break;
      case "__runtime__isDiffLeft":
      case "__runtime__isDiffRight":
        content = (
          <input
            type="checkbox"
            checked={input[this.type] as boolean}
            onChange={(ev) => this.onClickDiff?.(input.__runtime__index, ev.target.checked)}
          />
        );
        break;
      case "method":
      case "note":
        content = input[this.type];
        break;
      default:
        const value = input[this.type];
        if (typeof value === "boolean") {
          content = <input type="checkbox" checked={value} readOnly />;
        } else if (typeof value === "string") {
          content = value;
        } else if (Array.isArray(value)) {
          content = value.join(", ");
        } else {
          content = null;
        }
        break;
    }

    return (
      <div className="select-none text-sm text-nowrap px-2 py-2 truncate">
        {content}
      </div>
    );
  }
}

const DiffingList: React.FC = () => {
  const [diffLeft, setDiffLeft] = useState<number | null>(null);
  const [diffRight, setDiffRight] = useState<number | null>(null);

  const handleDiffLeft = (index: number, checked: boolean) => {
    setDiffLeft(checked ? index : null);
  };

  const handleDiffRight = (index: number, checked: boolean) => {
    setDiffRight(checked ? index : null);
  };

  //@ts-ignore
  const data: __RendererModel[] = mock.data.map((datum, index) => ({
    ...datum,
    __runtime__index: index,
    __runtime__isDiffLeft: diffLeft === index,
    __runtime__isDiffRight: diffRight === index,
  }));

  return (
    <div>
      <TableView
        headers={[
          {
            title: "Left",
            minWidth: 50,
            renderer: new DiffingCellRenderer("__runtime__isDiffLeft", handleDiffLeft),
          },
          {
            title: "Right",
            minWidth: 50,
            renderer: new DiffingCellRenderer("__runtime__isDiffRight", handleDiffRight),
          },
          {
            title: "Note",
            minWidth: 250,
            renderer: new DiffingCellRenderer("note"),
          },
          {
            title: "Method",
            minWidth: 250,
            renderer: new DiffingCellRenderer("method"),
          },
          {
            title: "SSL",
            minWidth: 250,
            renderer: new DiffingCellRenderer("is_ssl"),
          },
        ]}
        data={data}
      />
    </div>
  );
};

export default DiffingList;
