import { emit, listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

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
      _animateScroll()
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
            <tr key={`item-${i}`}>
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
