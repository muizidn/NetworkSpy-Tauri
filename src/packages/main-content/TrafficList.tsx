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
  const { selections, setSelections, setTrafficList, setTrafficSet } = useTrafficListContext();
  const { filteredTraffic } = useFilterContext();
  const { isRun } = useAppProvider();

  useEffect(() => {
    const unlistenExport = listen<{ ids: string[] }>("export_selected", async (event) => {
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

    const unlistenDelete = listen<{ ids: string[] }>("delete_selected", (event) => {
      const idsToDelete = new Set(event.payload.ids);

      setTrafficList(prev => prev.filter((item: TrafficItemMap) => !idsToDelete.has(String(item.id))));
      setTrafficSet(prev => {
        const next = { ...prev };
        event.payload.ids.forEach((id: string) => delete next[id]);
        return next;
      });
      setSelections({ firstSelected: null, others: null });
    });

    return () => {
      unlistenExport.then((f) => f());
      unlistenDelete.then((f) => f());
    };
  }, [setTrafficList, setTrafficSet, setSelections]);

  const headers: TableViewHeader<TrafficItemMap>[] = useMemo(() => [
    {
      title: "ID",
      renderer: {
        render: ({ input }: { input: TrafficItemMap }) => {
          const getStatusColor = (code: string, method: string) => {
            if (method === 'CONNECT') return 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.3)]';
            const c = parseInt(code);
            if (isNaN(c)) return 'bg-zinc-600'; // Pending
            if (c >= 500) return 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.4)]';
            if (c >= 400) return 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.3)]';
            if (c >= 300) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]';
            if (c >= 200) return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]';
            if (c >= 100) return 'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.3)]';
            return 'bg-zinc-600';
          };

          return (
            <div className="flex items-center gap-2 px-1">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(String(input.code), String(input.method))}`} />
              <span className="truncate opacity-80 font-mono text-[10px]">{input.id as string}</span>
            </div>
          );
        }
      },
      minWidth: 70,
      sortable: true,
      compareValue: (a: any, b: any) => (Number(a) < Number(b) ? -1 : 1),
    },
    {
      title: "SSL",
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
      minWidth: 50,
    },
    { title: "Tags", renderer: new TagsRenderer("tags"), minWidth: 100 },
    { title: "URL", renderer: new TextRenderer("url"), minWidth: 400 },
    { title: "Client", renderer: new TextRenderer("client"), minWidth: 150 },
    { title: "Method", renderer: new TextRenderer("method") },
    { title: "Code", renderer: new TextRenderer("code") },
    {
      title: "Time",
      renderer: new TextRenderer("time"),
      sortable: true,
      compareValue: (a: any, b: any) => (a.timestamp < b.timestamp ? -1 : 1),
    },
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
      selectedItems={selections.others}
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
          {
            id: "delete_selected",
            text: `Delete ${items.length === 1 ? 'item' : `${items.length} items`}`,
            enabled: items.length > 0,
            action: () => {
              emit("delete_selected", { ids });
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
