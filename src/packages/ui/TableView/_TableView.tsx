import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  MouseEvent,
} from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { twMerge } from "tailwind-merge";
import { ContextMenu } from "tauri-plugin-context-menu";
import { Renderer } from "./_Renderer";

export interface TableViewHeader<T>  {
  title: string;
  renderer: Renderer<T>;
  sortable?: boolean;
  minWidth?: number;
}

export interface TableViewProps<T> {
  headers: TableViewHeader<T>[];
  data: T[];
  renderContextMenu?: (selectedItems: T[]) => ContextMenu.Options;
}

type SortOrder = "asc" | "desc";

export const TableView = <T,>({
  headers,
  data,
  renderContextMenu,
}: TableViewProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<{
    firstSelect?: number;
    rows: number[];
  }>({ rows: [] });
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [columnWidths, setColumnWidths] = useState<number[]>(
    headers.map(() => 150)
  );
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    order: SortOrder | null;
  }>({ key: null, order: null });

  function getRowIndex(e: MouseEvent) {
    const index = (e.target as HTMLElement).parentElement?.getAttribute(
      "data-index"
    );
    return index;
  }

  async function onClickRow(e: MouseEvent) {
    const indexString = getRowIndex(e);
    if (!indexString) {
      return;
    }

    const index = Number(indexString);

    if (e.shiftKey) {
      if (selectedRows.firstSelect !== undefined) {
        const firstSelected = selectedRows.firstSelect;
        if (firstSelected < index) {
          const newSelectedRows = Array.from(
            { length: index - firstSelected + 1 },
            (_, i) => firstSelected + i
          );
          setSelectedRows({
            firstSelect: firstSelected,
            rows: newSelectedRows,
          });
        } else {
          const newSelectedRows = Array.from(
            { length: firstSelected - index + 1 },
            (_, i) => index + i
          );
          setSelectedRows({
            firstSelect: firstSelected,
            rows: newSelectedRows,
          });
        }
      }
    } else {
      setSelectedRows({ firstSelect: index, rows: [index] });
    }
  }

  async function showContextMenu(e: MouseEvent) {
    if (!renderContextMenu) {
      return;
    }

    const indexString = getRowIndex(e);
    if (!indexString) {
      return;
    }

    let selectedItems = [data[Number(indexString)]];
    if (selectedRows.rows.length > 1) {
      selectedItems = selectedRows.rows.map((i) => data[i]);
    }

    const contextMenuData = renderContextMenu(selectedItems);

    await invoke(
      "plugin:context_menu|show_context_menu",
      // `as any` because otherwise mismatch type
      contextMenuData as any
    );
  }

  function _animateScroll() {
    if (tbodyRef.current) {
      const tbody = tbodyRef.current;
      const scrollHeight = tbody.scrollHeight;
      const clientHeight = tbody.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight;
      const currentScrollTop = tbody.scrollTop;

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

  const startResize = (index: number, startX: number) => {
    const handleMouseMove = (e: any) => {
      const dx = e.clientX - startX;
      setColumnWidths((prev) => {
        const newWidths = [...prev];
        newWidths[index] += dx;
        return newWidths;
      });
      startX = e.clientX;
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleSort = (index: number) => {
    const key = headers[index].title as keyof T;
    let order: SortOrder = "asc";
    if (sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    }
    setSortConfig({ key, order });
  };

  const sortedData = React.useMemo(() => {
    if (sortConfig.key === null) {
      return data;
    }
    return [...data].sort((a, b) => {
      if (a[sortConfig.key as keyof T] < b[sortConfig.key as keyof T]) {
        return sortConfig.order === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key as keyof T] > b[sortConfig.key as keyof T]) {
        return sortConfig.order === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

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
    <table className="table-auto w-full block relative">
      <thead className="sticky top-0 bg-[#23262a]">
        <tr>
          {headers.map((header, index) => (
            <th
              key={index}
              className="px-4 py-2 text-left text-sm cursor-pointer"
              onClick={() => handleSort(index)}
              style={{
                width: columnWidths[index],
                minWidth: header.minWidth,
                position: "relative",
              }}
            >
              <div className="flex items-center justify-between">
                <span>{header.title}</span>
                <div
                  onMouseDown={(e) => startResize(index, e.clientX)}
                  className="absolute right-0 top-1 h-[80%] w-1 cursor-col-resize hover:bg-blue-500 bg-gray-600 rounded-sm mx-2"
                  style={{ transform: "translateX(50%)" }}
                ></div>
                {sortConfig.key === header.title && (
                  <span>{sortConfig.order === "asc" ? "🔼" : "🔽"}</span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody ref={tbodyRef} className="overflow-y-auto" onScroll={handleScroll}>
        {sortedData.map((item, index) => (
          <tr
            key={`item-${index}`}
            onContextMenu={showContextMenu}
            onClick={onClickRow}
            className={twMerge(
              "hover:bg-green-700",
              selectedRows.rows.includes(index) && "bg-green-400"
            )}
            data-index={index}
          >
            {headers.map((header, i) => (
              <td key={i}>{header.renderer.render(item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
