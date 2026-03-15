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

  const handleExport = useCallback(async (ids: (string | number | boolean | string[])[], format: 'har' | 'csv' | 'sqlite' = 'har') => {
    try {
      if (!ids || ids.length === 0) return;

      let extension = 'har';
      let name = 'HAR Capture';
      if (format === 'csv') { extension = 'csv'; name = 'CSV Spreadsheet'; }
      if (format === 'sqlite') { extension = 'sqlite'; name = 'SQLite Database'; }

      const now = new Date();
      const dateStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + "-" +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0');

      const defaultPath = `networkspy-${dateStr}.${extension}`;

      const path = await save({
        defaultPath,
        filters: [{ name: name, extensions: [extension] }],
      });

      if (path) {
        const idStrings = ids.map(id => String(id));
        if (format === 'har') {
          await invoke("export_selected_to_har", { path, ids: idStrings });
        } else if (format === 'csv') {
          await invoke("export_selected_to_csv", { path, ids: idStrings });
        } else if (format === 'sqlite') {
          await invoke("export_selected_to_sqlite", { path, ids: idStrings });
        }
      }
    } catch (err) {
      console.error("Failed to export items", err);
    }
  }, []);

  const handleDelete = useCallback((ids: (string | number | boolean | string[])[]) => {
    const idsToDelete = new Set(ids.map(id => String(id)));
    setTrafficList(prev => prev.filter((item: TrafficItemMap) => !idsToDelete.has(String(item.id))));
    setTrafficSet(prev => {
      const next = { ...prev };
      ids.forEach(id => delete next[String(id)]);
      return next;
    });
    setSelections({ firstSelected: null, others: null });
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
            if (c >= 200) return 'bg-green-500 shadow-[0_0_8_rgba(34,197,94,0.3)]';
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

  const contextMenuRenderer = useMemo(() => ({
    render: async (items: TrafficItemMap[]) => {
      try {
        const ids = items.map((i) => i.id);
        const exportSubmenu = await Submenu.new({
          text: "Export As...",
          items: [
            await MenuItem.new({
              text: "HAR Archive (.har)",
              action: () => handleExport(ids, 'har')
            }),
            await MenuItem.new({
              text: "CSV Spreadsheet (.csv)",
              action: () => handleExport(ids, 'csv')
            }),
            await MenuItem.new({
              text: "Raw SQLite DB (.sqlite)",
              action: () => handleExport(ids, 'sqlite')
            }),
          ]
        });

        const menu = await Menu.new({
          items: [
            exportSubmenu,
            await MenuItem.new({
              id: "delete_selected",
              text: `Delete ${items.length === 1 ? 'item' : `${items.length} items`}`,
              enabled: items.length > 0,
              action: () => handleDelete(ids),
            }),
          ],
        });

        await menu.popup();
      } catch (e) {
        console.warn("Context menu issue", e);
      }
    }
  }), [handleExport, handleDelete]);

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

import { Menu, MenuItem, Submenu } from "@tauri-apps/api/menu";
