import React, { useCallback, useMemo, useEffect } from "react";
import {
  TableView,
  TableViewContextMenuRenderer,
  TableViewHeader,
} from "../ui/TableView";
import { ImageRenderer, TagsRenderer, TextRenderer } from "./Renderers";
import { useTrafficListContext } from "./context/TrafficList";
import { useFilterContext } from "@src/context/FilterContext";
import { TrafficItemMap } from "./model/TrafficItemMap";
import { invoke } from "@tauri-apps/api/core";
import { useAppProvider } from "../app-env";
import { FiLock, FiUnlock } from "react-icons/fi";
import { listen } from "@tauri-apps/api/event";
import { save } from "@tauri-apps/plugin-dialog";

type TauriInvokeFn = (cmd: string, args?: any) => Promise<any>;

export const TrafficList: React.FC = () => {
  const { selections, setSelections } = useTrafficListContext();
  const { filteredTraffic } = useFilterContext();
  const { isRun } = useAppProvider();

  useEffect(() => {
    const unlisten = listen<{ ids: string[] }>("export_selected", async (event) => {
      try {
        const ids = event.payload.ids;
        if (!ids || ids.length === 0) return;

        const path = await save({
          filters: [
            {
              name: "HAR Capture",
              extensions: ["har"],
            },
          ],
        });

        if (path) {
          await invoke("export_selected_session", { path, ids });
        }
      } catch (err) {
        console.error("Failed to export selected items", err);
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const headers: TableViewHeader<TrafficItemMap>[] = useMemo(() => [
    {
      title: "ID",
      renderer: new TextRenderer("id"),
      minWidth: 100,
      sortable: true,
      compareValue: (a: any, b: any) => (Number(a) < Number(b) ? -1 : 1),
    },
    {
      title: "Mode",
      renderer: {
        render: ({ input }: { input: TrafficItemMap }) => {
          const intercepted = input.intercepted as boolean;
          return (
            <div className={`flex items-center justify-center h-full ${intercepted ? 'text-purple-400' : 'text-zinc-500'
              }`} title={intercepted ? 'Intercepted (Decrypted)' : 'Tunneled (Encrypted)'}>
              {intercepted ? <FiUnlock size={14} /> : <FiLock size={14} />}
            </div>
          );
        }
      },
      minWidth: 100,
    },
    { title: "Tags", renderer: new TagsRenderer("tags"), minWidth: 100 },
    { title: "URL", renderer: new TextRenderer("url"), minWidth: 400 },
    { title: "Client", renderer: new TextRenderer("client"), minWidth: 150 },
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
      isAllowAutoScroll={true}
      isAutoScroll={isRun}
    />
  );
};

import { Menu } from "@tauri-apps/api/menu";
import { emit } from "@tauri-apps/api/event";

class TrafficListContextMenuRenderer
  implements TableViewContextMenuRenderer<TrafficItemMap> {
  invoke: TauriInvokeFn;
  constructor(invoke: TauriInvokeFn) {
    this.invoke = invoke;
  }

  async render(items: TrafficItemMap[]): Promise<void> {
    try {
      const ids = items.map((i) => i.id);
      const menu = await Menu.new({
        items: [
          {
            id: "export_selected",
            text: `Export ${items.length} items to HAR`,
            enabled: items.length > 0,
            action: () => {
              emit("export_selected", { ids });
            },
          },
        ],
      });

      await menu.popup();
    } catch (e) {
      console.warn("Context menu is only available natively in Tauri", e);
    }
  }
}
