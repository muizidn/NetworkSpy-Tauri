import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useRef, useState } from "react";
import {
  showMenu,
  onEventShowMenu,
  assetToPath,
} from "tauri-plugin-context-menu";

interface StreamData {
  message: string;
}

export const TableView = () => {
  const [data, setData] = useState<string[]>([]);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true); // State to track autoscroll enablement

  async function startStream() {
    await listen("count_event", (event: any) => {
      setData((prevData) => [
        ...prevData,
        (event.payload as StreamData).message,
      ]);
    });
  }

  const options = {
    items: [
      {
        label: "My first item",
        disabled: false,
        event: (e: any) => {
          alert(e.payload?.message);
        },
        payload: { message: "Hello from the payload!" },
        shortcut: "alt+m",
        // icon: {
        //     path: await assetToPath('assets/16x16.png'),
        //     width: 32,
        //     height: 32
        // }
      },
      {
        is_separator: true,
      },
      {
        label: "My second item",
        disabled: false,
        event: "my_second_item",
        shortcut: "cmd+C",
      },
      {
        label: "My third item",
        disabled: false,
        subitems: [
          {
            label: "My first subitem",
            checked: true,
            event: () => {
              alert("My first subitem clicked");
            },
            shortcut: "ctrl+m",
          },
          {
            label: "My second subitem",
            checked: false,
            disabled: true,
          },
        ],
      },
    ],
  };

  async function showContextMenu(e: any) {
    const index = (e.target as Node).parentElement?.getAttribute("data-index")
    if (!index) { return }
    console.log("Context menu should show at index", index);
   
    await invoke("plugin:context_menu|show_context_menu", {
      items: [
        {
          label: "Item 1",
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
    });
  }

  useEffect(() => {
    startStream();
  }, []);

  function _animateScroll() {
    if (tbodyRef.current) {
      const tbody = tbodyRef.current;
      const scrollHeight = tbody.scrollHeight;
      const clientHeight = tbody.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight;
      const currentScrollTop = tbody.scrollTop;

      // Animate scrolling
      const animateScroll = (startTime: number) => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const duration = 500; // Animation duration in milliseconds

        if (elapsed < duration) {
          const easedTime = easeInOutQuad(
            elapsed,
            currentScrollTop,
            maxScrollTop - currentScrollTop,
            duration
          );
          tbody.scrollTop = easedTime;
          requestAnimationFrame(() => animateScroll(startTime));
        } else {
          tbody.scrollTop = maxScrollTop;
        }
      };

      // Start animation
      animateScroll(Date.now());
    }
  }

  useEffect(() => {
    if (autoScrollEnabled && tbodyRef.current) {
      _animateScroll();
    }
  }, [data, autoScrollEnabled]);

  const handleScroll = () => {
    if (!tbodyRef.current) return;

    const tbody = tbodyRef.current;
    const atBottom =
      tbody.scrollTop + tbody.clientHeight === tbody.scrollHeight;
    const nearBottom =
      tbody.scrollHeight - tbody.scrollTop <= tbody.clientHeight * 2;

    if (atBottom) {
      setAutoScrollEnabled(true);
    } else if (!nearBottom) {
      setAutoScrollEnabled(false);
    }
  };

  // Easing function for smooth scroll animation
  const easeInOutQuad = (
    t: number,
    b: number,
    c: number,
    d: number
  ): number => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  };

  return (
    <div className="w-4/5 p-4">
      <button onClick={() => emit("start_stream", { payload: "Nonde" })}>
        click me
      </button>
      <table className="table-auto w-full">
        <thead>
          <tr>
            {[
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
            ].map((header, index) => (
              <th key={index} className="px-4 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          ref={tbodyRef}
          className="block overflow-y-scroll max-h-96"
          onScroll={handleScroll}
        >
          {data.map((e, i) => (
            <tr
              key={`item-${i}`}
              onContextMenu={showContextMenu}
              className="hover:bg-green-700"
              data-index={i}
              >
              <td>8753</td>
              <td>https://example.com</td>
              <td>{e}</td>
              <td>GET</td>
              <td>Completed</td>
              <td>200</td>
              <td>732 ms</td>
              <td>16 bytes</td>
              <td>Request Details</td>
              <td>Response Details</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
