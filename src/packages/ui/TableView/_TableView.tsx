import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useRef, useState, ReactNode } from "react";
import { Renderer } from ".";
import { twMerge } from "tailwind-merge";
import { ContextMenu, showMenu } from "tauri-plugin-context-menu";
import React from "react";

interface TableViewProps<T> {
  headers: { title: string; renderer: Renderer<T> }[];
  data: T[];
  renderContextMenu?: (selectedItems: T[]) => ContextMenu.Options;
}

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

  function getRowIndex(e: any) {
    const index = (e.target as Node).parentElement?.getAttribute("data-index");
    return index;
  }

  async function onClickRow(e: any) {
    const indexString = getRowIndex(e);
    if (!indexString) {
      return;
    }

    const index = Number(indexString);

    if (e.shiftKey) {
      if (selectedRows.firstSelect) {
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

  async function showContextMenu(e: any) {
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
    <table className='table-auto w-full block relative'>
      <thead className='sticky top-0 absolute bg-[#23262a]'>
        <tr>
          {headers.map((header, index) => (
            <th key={index} className='px-4 py-2 text-left text-sm'>
              {header.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody ref={tbodyRef} className='overflow-y-auto' onScroll={handleScroll}>
        {data.map((item, index) => (
          <tr
            key={`item-${index}`}
            onContextMenu={showContextMenu}
            onClick={onClickRow}
            className={twMerge(
              "hover:bg-green-700",
              selectedRows.rows.includes(index) && "bg-green-400"
            )}
            data-index={index}>
            {headers.map((e, i) => (
              <React.Fragment key={i}>{e.renderer.render(item)}</React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
