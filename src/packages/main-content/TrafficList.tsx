import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  showMenu,
  onEventShowMenu,
  assetToPath,
} from "tauri-plugin-context-menu";
import { TableView } from "../ui/TableView";

export const TrafficList: React.FC = () => {
  const headers = [
    "ID",
    "URL",
    "Client",
    "Method",
    "Status",
    "Code",
    "Time",
    "Duration",
    "Request",
    "Response",
  ];

  const [data, setData] = useState([
    {
      id: "8753",
      url: "https://example.com",
      client: "Client A",
      method: "GET",
      status: "Completed",
      code: 200,
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
          url: "https://example.com",
          client: (event.payload as any).message as string,
          method: "GET",
          status: "Completed",
          code: 200,
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

  return (
    <TableView
      headers={headers}
      data={data}
      renderRow={(item, index) => (
        <>
          <td className="select-none">{item.id}</td>
          <td className="select-none">{item.url}</td>
          <td className="select-none">{item.client}</td>
          <td className="select-none">{item.method}</td>
          <td className="select-none">{item.status}</td>
          <td className="select-none">{item.code}</td>
          <td className="select-none">{item.time}</td>
          <td className="select-none">{item.duration}</td>
          <td className="select-none">{item.request}</td>
          <td className="select-none">{item.response}</td>
        </>
      )}
    />
  );
};
