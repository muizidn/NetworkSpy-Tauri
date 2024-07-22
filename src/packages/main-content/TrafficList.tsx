import { listen } from "@tauri-apps/api/event";
import { useEffect, useState, useRef } from "react";
import { TableView, TableViewHeader } from "../ui/TableView";
import { ImageRenderer, TagsRenderer, TextRenderer } from "./Renderers";
import { TrafficItemMap } from "./model/TrafficItemMap";
import { v4 as uuidv4 } from "uuid";

export const TrafficList: React.FC = () => {
  const headers: TableViewHeader<TrafficItemMap>[] = [
    { title: "ID", renderer: new TextRenderer('id'), minWidth: 100, sortable: true },
    { title: "Tags", renderer: new TagsRenderer('tags') },
    { title: "URL", renderer: new TextRenderer('url') },
    { title: "Client", renderer: new ImageRenderer('client') },
    { title: "Method", renderer: new TextRenderer('method') },
    { title: "Status", renderer: new TextRenderer('status') },
    { title: "Code", renderer: new TextRenderer('code') },
    { title: "Time", renderer: new TextRenderer('time') },
    { title: "Duration", renderer: new TextRenderer('duration') },
    { title: "Request", renderer: new TextRenderer('request') },
    { title: "Response", renderer: new TextRenderer('response') }
  ];

  const [data, setData] = useState<TrafficItemMap[]>([
    {
      "id": "0",
      "tags": ["LOGIN DOCKER"],
      "url": "https://example.com",
      "client": "Client A",
      "method": "GET",
      "status": "Completed",
      "code": "200",
      "time": "732 ms",
      "duration": "16 bytes",
      "request": "Request Details",
      "response": "Response Details",
    },
  ]);

  const streamStarted = useRef(false);

  async function startStream() {
    await listen("count_event", (event: any) => {
      setData((prevData) => [
        ...prevData,
        {
          "id": (event.payload as any).message as string,
          "tags": ["LOGIN DOCKER", "AKAMAI Testing Robot"],
          "url": "https://example.com",
          "client": "Google Map",
          "method": "GET",
          "status": "Completed",
          "code": "200",
          "time": "732 ms",
          "duration": "16 bytes",
          "request": "Request Details",
          "response": "Response Details",
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

  function renderContextMenu(data: any[]) {
    return {
      items: [
        {
          label: `Select ${data.length}`,
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
    }
  }

  return (
    <TableView
      headers={headers}
      data={data}
      renderContextMenu={renderContextMenu}
    />
  );
};
