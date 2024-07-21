import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState } from "react";
import { TableView } from "../ui/TableView";
import { ImageRenderer, TagsRenderer, TextRenderer } from "./Renderers";
import { TrafficItemMap } from "./model/TrafficItemMap";
import MaterialTableView, {
  TrafficProps,
} from "../ui/TableView/_MaterialTableView";

export const TrafficList: React.FC = () => {
  // const headers = [
  //   { title: "ID", renderer: new TextRenderer("id") },
  //   { title: "Tags", renderer: new TagsRenderer("tags") },
  //   { title: "URL", renderer: new TextRenderer("url") },
  //   { title: "Client", renderer: new ImageRenderer("client") },
  //   { title: "Method", renderer: new TextRenderer("method") },
  //   { title: "Status", renderer: new TextRenderer("status") },
  //   { title: "Code", renderer: new TextRenderer("code") },
  //   { title: "Time", renderer: new TextRenderer("time") },
  //   { title: "Duration", renderer: new TextRenderer("duration") },
  //   { title: "Request", renderer: new TextRenderer("request") },
  //   { title: "Response", renderer: new TextRenderer("response") },
  // ];

  const [data, setData] = useState<TrafficProps[]>([
    {
      id: "1753",
      tags: ["LOGIN DOCKER", "LOGIN DOCKER"],
      url: "https://tailwindcss.com/docs/position#sticky-positioning-elements",
      client: "Client A",
      method: "GET",
      status: "Completed",
      code: "200",
      time: "732 ms",
      duration: "16 bytes",
      request: "Request Details",
      response: "Response Details",
    },
    {
      id: "2753",
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
    {
      id: "3753",
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
    {
      id: "8753",
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
    {
      id: "8753",
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
    {
      id: "8753",
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

  async function startStream() {
    await listen("count_event", (event: any) => {
      setData((prevData) => [
        ...prevData,
        {
          id: "8753",
          tags: ["LOGIN DOCKER", "AKAMAI Testing Robot"],
          url: "https://example.com",
          client: (event.payload as any).message as string,
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
    startStream();
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
    };
  }

  // return (
  //   <TableView
  //     headers={headers}
  //     data={data}
  //     renderContextMenu={renderContextMenu}
  //   />
  // );

  return <MaterialTableView data={data} />;
};
