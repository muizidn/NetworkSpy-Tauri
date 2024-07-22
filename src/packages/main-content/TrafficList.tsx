import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, useRef } from "react";
import { TableView, TableViewContextMenuRenderer, TableViewHeader } from "../ui/TableView";
import { ImageRenderer, TagsRenderer, TextRenderer } from "./Renderers";
import { TrafficItemMap } from "./model/TrafficItemMap";
import { invoke } from "@tauri-apps/api/tauri";

export const TrafficList: React.FC = () => {
  const headers: TableViewHeader<TrafficItemMap>[] = [
    {
      title: "ID",
      renderer: new TextRenderer("id"),
      minWidth: 100,
      sortable: true,
      compareValue: (a, b) => (Number(a) < Number(b) ? -1 : 1),
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
  ];

  const [data, setData] = useState<TrafficItemMap[]>([
    {
      id: "0",
      tags: ["LOGIN DOCKER"],
      url: "https://example.com",
      client: "Client A",
      method: "GET",
      status: "Completed",
      code: "200",
      time: "732 ms",
      duration: "16 bytes",
      request: "Request Details",
      response: "Response Details",
    },
  ]);

  const streamStarted = useRef(false);

  async function startStream() {
    await listen("count_event", (event: any) => {
      setData((prevData) => [
        ...prevData,
        {
          id: (event.payload as any).message as string,
          tags: ["LOGIN DOCKER", "AKAMAI Testing Robot"],
          url: "https://example.com",
          client: "Google Map",
          method: "GET",
          status: "Completed",
          code: "200",
          time: "732 ms",
          duration: "16 bytes",
          request: "Request Details",
          response: "Response Details",
        },
      ]);
    });
  }

  useEffect(() => {
    if (!streamStarted.current) {
      startStream();
      streamStarted.current = true;
    }
  }, []);

  return (
    <TableView
      headers={headers}
      data={data}
      contextMenuRenderer={new TrafficListContextMenuRenderer()}
    />
  );
};


class TrafficListContextMenuRenderer implements TableViewContextMenuRenderer<TrafficItemMap> {
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

    await invoke(
      "plugin:context_menu|show_context_menu",
      // `as any` because otherwise mismatch type
      contextMenuData as any
    );
  }
}