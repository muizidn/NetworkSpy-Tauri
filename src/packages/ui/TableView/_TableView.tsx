import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { twMerge } from "tailwind-merge";
import { Renderer } from "./_Renderer";
import { useDrag, useDrop } from "react-dnd";
import { TableViewContextMenuRenderer } from "./_ContextMenu";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

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
  contextMenuRenderer?: TableViewContextMenuRenderer<T>;
  onSelectedRowChanged?: (firstSelected: T | null, items: T[] | null) => void;
  className?: string;
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
  isLast,
}: {
  header: TableViewHeader<T>;
  index: number;
  moveHeader: (dragIndex: number, hoverIndex: number) => void;
  sortConfig: { key: keyof T | null; order: SortOrder | null };
  handleSort: (index: number) => void;
  startResize: (index: number, startX: number) => void;
  columnWidth: number;
  isLast: boolean;
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

  const isActive = sortConfig.key === header.title.toLowerCase();

  return (
    <th
      ref={ref}
      className={twMerge(
          "px-4 py-3 relative bg-[#111111] border-b border-zinc-800 transition-colors",
          isLast ? "flex-grow" : "shrink-0",
          isActive ? "text-blue-400 bg-[#161616]" : "text-zinc-500 hover:bg-zinc-800/40"
      )}
      onClick={() => handleSort(index)}
      style={{
        opacity: isDragging ? 0.5 : 1,
        width: isLast ? undefined : columnWidth,
        flexBasis: isLast ? columnWidth : undefined,
        minWidth: header.minWidth
      }}
    >
      <div
        className="flex items-center justify-between cursor-grab w-full gap-2 overflow-hidden"
      >
        <span className="text-[10px] font-black uppercase tracking-widest truncate">{header.title}</span>
        {isActive && (
          <span className="shrink-0 p-0.5 bg-blue-500/10 rounded text-blue-500">
            {sortConfig.order === "asc" ? <FiChevronDown size={12} /> : <FiChevronUp size={12} />}
          </span>
        )}
      </div>
      <div
        onMouseDown={(e) => { e.stopPropagation(); startResize(index, e.clientX); }}
        className="absolute right-0 top-1/2 -translate-y-1/2 h-6 cursor-col-resize w-[1px] hover:w-[3px] bg-zinc-800 hover:bg-blue-500 transition-all z-20"
      ></div>
    </th>
  );
};

export const TableView = <T,>({
  headers: initialHeaders,
  data,
  contextMenuRenderer,
  onSelectedRowChanged,
  className,
}: TableViewProps<T>) => {
  const [selectedRows, setSelectedRows] = useState<{
    firstSelect?: number;
    rows: number[];
  }>({ rows: [] });
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [columnWidths, setColumnWidths] = useState<number[]>(
    initialHeaders.map((e) => e.minWidth || 150)
  );
  const [headers, setHeaders] = useState(initialHeaders);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    order: SortOrder | null;
  }>({ key: null, order: null });

  function getRowIndex(e: MouseEvent): string | null {
    let target = e.target as HTMLElement;

    while (target && target.tagName !== "TR") {
      target = target.parentElement as HTMLElement;
    }

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

  useEffect(() => {
    if (!onSelectedRowChanged) {
      return;
    }
    const firstSelect = selectedRows.firstSelect !== undefined
      ? data[selectedRows.firstSelect]
      : null;
    const allItems = selectedRows.rows.map((i) => data[i]);
    onSelectedRowChanged(firstSelect, allItems);
  }, [selectedRows]);

  async function showContextMenu(e: MouseEvent) {
    if (!contextMenuRenderer) {
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

    await contextMenuRenderer.render(selectedItems);
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
        const duration = 500;

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
        newWidths[index] = Math.max(header.minWidth || 50, newWidths[index] + dx);
        return newWidths;
      });
      startX = e.clientX;
    };

    const header = headers[index];

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
    const newColumnWidths = [...columnWidths];
    const [draggedWidth] = newColumnWidths.splice(dragIndex, 1);
    newColumnWidths.splice(hoverIndex, 0, draggedWidth);
    
    setHeaders(newHeaders);
    setColumnWidths(newColumnWidths);
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
    <div className={twMerge("w-full h-full flex flex-col bg-[#050505] overflow-x-auto custom-scrollbar", className)}>
        <table className="min-w-full w-max border-separate border-spacing-0 flex flex-col h-full overflow-hidden">
        <thead className="sticky top-0 z-30 shrink-0">
            <tr className="flex w-full">
            {headers.map((header, index) => (
                <HeaderCell
                key={`header-${index}`}
                header={header}
                index={index}
                moveHeader={moveHeader}
                sortConfig={sortConfig}
                handleSort={handleSort}
                startResize={startResize}
                columnWidth={columnWidths[index]}
                isLast={index === headers.length - 1}
                />
            ))}
            </tr>
        </thead>
        <tbody ref={tbodyRef} className="overflow-y-auto overflow-x-hidden flex-grow scroll-smooth" onScroll={handleScroll}>
            {sortedData.map((item, index) => {
                const isSelected = selectedRows.rows.includes(index);
                return (
                    <tr
                        key={`item-${index}`}
                        onContextMenu={showContextMenu}
                        onClick={onClickRow}
                        className={twMerge(
                        "flex w-full group transition-all duration-150 border-b border-zinc-900/50",
                        isSelected ? "bg-blue-600/10" : "hover:bg-zinc-800/30"
                        )}
                        data-index={index}
                    >
                        {headers.map((header, i) => {
                          const isLast = i === headers.length - 1;
                          return (
                            <td key={i} className={twMerge(
                              "px-4 py-2 text-zinc-400 text-[12px] truncate",
                              isLast ? "flex-grow" : "shrink-0"
                            )} style={{ 
                                width: isLast ? undefined : columnWidths[i], 
                                flexBasis: isLast ? columnWidths[i] : undefined,
                                minWidth: header.minWidth 
                            }}>
                                {header.renderer.render({
                                input: item,
                                width: columnWidths[i],
                                })}
                            </td>
                          );
                        })}
                    </tr>
                );
            })}
            
            {sortedData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-black/20 text-zinc-600 italic text-sm">
                    No data available
                </div>
            )}
        </tbody>
        </table>
    </div>
  );
};
