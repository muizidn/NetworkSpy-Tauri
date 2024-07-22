import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { twMerge } from "tailwind-merge";
import { ContextMenu } from "tauri-plugin-context-menu";
import { Renderer } from "./_Renderer";
import { useDrag, useDrop } from "react-dnd";

export interface TableViewHeader<T> {
  title: string;
  renderer: Renderer<T>;
  sortable?: boolean;
  minWidth?: number;
  compareValue?: (a: any, b: any) => number;
}

export interface TableViewProps<T> {
  headers: TableViewHeader<T>[];
  data: T[];
  renderContextMenu?: (selectedItems: T[]) => ContextMenu.Options;
}

type SortOrder = "asc" | "desc";

const HeaderCell = <T,>({
  header,
  index,
  moveHeader,
  sortConfig,
  handleSort,
  startResize,
  columnWidth,
}: {
  header: TableViewHeader<T>;
  index: number;
  moveHeader: (dragIndex: number, hoverIndex: number) => void;
  sortConfig: { key: keyof T | null; order: SortOrder | null };
  handleSort: (index: number) => void;
  startResize: (index: number, startX: number) => void;
  columnWidth: number;
}) => {
  const ref = useRef<HTMLTableHeaderCellElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "header",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "header",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveHeader(item.index, index);
        item.index = index;
      }
    },
  });

  drag(drop(ref));

  return (
    <th
      className="px-2 py-2 text-left text-sm relative"
      onClick={() => handleSort(index)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
      }}
    >
      <div
        ref={ref}
        className="flex items-center justify-between cursor-grab"
        style={{ width: columnWidth, minWidth: header.minWidth }}
      >
        <span>{header.title}</span>

        {sortConfig.key === header.title.toLowerCase() && (
          <span className="cursor-pointer mr-2">
            {sortConfig.order === "asc" ? "🔼" : "🔽"}
          </span>
        )}
      </div>
      <div
        onMouseDown={(e) => startResize(index, e.clientX)}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize mx-2 flex items-center justify-center"
        style={{ transform: "translateX(50%)" }}
      >
        <div className="hover:bg-blue-500 bg-gray-600 rounded-sm w-0.5 hover:w-full h-[50%]"></div>
      </div>
    </th>
  );
};

export const TableView = <T,>({
  headers: initialHeaders,
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
    initialHeaders.map(() => 150)
  );
  const [headers, setHeaders] = useState(initialHeaders);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    order: SortOrder | null;
  }>({ key: null, order: null });

  function getRowIndex(e: MouseEvent): string | null {
    let target = e.target as HTMLElement;

    // Traverse up the DOM tree until a <tr> element is found
    while (target && target.tagName !== "TR") {
      target = target.parentElement as HTMLElement;
    }

    // Check if the <tr> element was found and has the data-index attribute
    if (target && target.tagName === "TR") {
      const index = target.getAttribute("data-index");
      return index;
    }

    return null;
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

    e.preventDefault();

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
    const key = headers[index].title.toLocaleLowerCase() as keyof T;
    let order: SortOrder = "asc";
    if (sortConfig.key === key && sortConfig.order === "asc") {
      order = "desc";
    }
    setSortConfig({ key, order });
  };

  const moveHeader = (dragIndex: number, hoverIndex: number) => {
    const newHeaders = [...headers];
    const [draggedHeader] = newHeaders.splice(dragIndex, 1);
    newHeaders.splice(hoverIndex, 0, draggedHeader);
    setHeaders(newHeaders);
  };

  const sortedData = React.useMemo(() => {
    if (sortConfig.key === null) {
      return data;
    }
    const key = sortConfig.key as keyof T;
    const defaultComparer = (a: any, b: any) => (a < b ? -1 : 1);
    const comparer =
      headers.find((e) => (e.title.toLowerCase() as keyof T) === key)
        ?.compareValue || defaultComparer;

    return [...data].sort((a, b) => {
      if (sortConfig.order === "asc") {
        return comparer(a[key], b[key]);
      } else if (sortConfig.order === "desc") {
        return comparer(b[key], a[key]);
      }
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <table className="table-auto w-full block relative">
      <thead className="sticky top-0 bg-[#23262a]">
        <tr>
          {headers.map((header, index) => (
            <HeaderCell
              key={index}
              header={header}
              index={index}
              moveHeader={moveHeader}
              sortConfig={sortConfig}
              handleSort={handleSort}
              startResize={startResize}
              columnWidth={columnWidths[index]}
            />
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
              <td key={i} style={{ width: columnWidths[i] }}>
                {header.renderer.render({
                  input: item,
                })}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
