import React, { useCallback, useMemo } from "react";
import {
  TableView,
  TableViewContextMenuRenderer,
  TableViewHeader,
} from "../ui/TableView";
import { ImageRenderer, TagsRenderer, TextRenderer } from "./Renderers";
import { useTrafficListContext } from "./context/TrafficList";
import { useFilterContext } from "@src/context/FilterContext";
import { TrafficItemMap } from "./model/TrafficItemMap";
import { invoke } from "@tauri-apps/api/tauri";

type TauriInvokeFn = (cmd: string, args?: any) => Promise<any>;

export const TrafficList: React.FC = () => {
  const { setSelections } = useTrafficListContext();
  const { filteredTraffic } = useFilterContext();

  const headers: TableViewHeader<TrafficItemMap>[] = useMemo(() => [
    {
      title: "ID",
      renderer: new TextRenderer("id"),
      minWidth: 100,
      sortable: true,
      compareValue: (a: any, b: any) => (Number(a) < Number(b) ? -1 : 1),
    },
    { title: "Tags", renderer: new TagsRenderer("tags"), minWidth: 100 },
    { title: "URL", renderer: new TextRenderer("url"), minWidth: 400 },
    { title: "Client", renderer: new ImageRenderer("client") },
    { title: "Method", renderer: new TextRenderer("method") },
    { title: "Status", renderer: new TextRenderer("status") },
    { title: "Code", renderer: new TextRenderer("code") },
    { title: "Time", renderer: new TextRenderer("time") },
    { title: "Duration", renderer: new TextRenderer("duration") },
    { title: "Request", renderer: new TextRenderer("request") },
    { title: "Response", renderer: new TextRenderer("response") },
  ], []);

  const contextMenuRenderer = useMemo(() => new TrafficListContextMenuRenderer(invoke), []);

  const handleSelectedRowChanged = useCallback((first: TrafficItemMap | null, items: TrafficItemMap[] | null) => {
    setSelections({ firstSelected: first, others: items });
  }, [setSelections]);

  return (
    <TableView
      headers={headers}
      data={filteredTraffic}
      contextMenuRenderer={contextMenuRenderer}
      onSelectedRowChanged={handleSelectedRowChanged}
    />
  );
};

class TrafficListContextMenuRenderer
  implements TableViewContextMenuRenderer<TrafficItemMap> {
  invoke: TauriInvokeFn;
  constructor(invoke: TauriInvokeFn) {
    this.invoke = invoke;
  }

  async render(items: TrafficItemMap[]): Promise<void> {
    const contextMenuData = {
      items: [
        {
          label: `Select ${items.length}`,
          disabled: false,
          event: "item1clicked",
          payload: "Hello World!",
          shortcut: "ctrl+M",
          subitems: [
            {
              label: "Subitem 1",
              disabled: true,
              event: "subitem1clicked",
            },
            {
              is_separator: true,
            },
            {
              label: "Subitem 2",
              disabled: false,
              checked: true,
              event: "subitem2clicked",
            },
          ],
        },
      ],
    };

    await this.invoke(
      "plugin:context_menu|show_context_menu",
      // `as any` because otherwise mismatch type
      contextMenuData as any
    );
  }
}
