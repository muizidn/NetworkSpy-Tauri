import { useMemo } from "react";
import React from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { darken, lighten } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";

import { useSettingsContext } from "../../../context/SettingsProvider";

export interface TrafficProps {
  id: string;
  tags: string[];
  url: string;
  client: string;
  method: string;
  status: string;
  code: string;
  time: string;
  duration: string;
  request: string;
  response: string;
}

export interface TrafficListProps {
  data: TrafficProps[];
}

export interface TrafficItemProps {
  item: string;
}

export interface TrafficTagsProps {
  tags: string[];
}

const TextRender = ({ item }: TrafficItemProps) => {
  return item.length > 10 ? (
    <Tooltip title={item}>
      <p className='select-none text-sm text-nowrap px-4 truncate cursor-pointer'>
        {item}
      </p>
    </Tooltip>
  ) : (
    <p className='select-none text-sm text-nowrap px-4 truncate'>{item}</p>
  );
};

const TagRender = ({ tags }: TrafficTagsProps) => {
  return (
    <div className='flex overflow-auto no-scrollbar'>
      {tags.map((tag, i) => (
        <div
          key={i}
          className='tag bg-red-500 rounded-full text-nowrap text-xs px-2 py-1 my-2 mr-1'>
          {tag}
        </div>
      ))}
    </div>
  );
};

const ImageRender = ({ item }: TrafficItemProps) => {
  return (
    <img
      className='px-4'
      src={item}
      alt='Image'
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
};

const MaterialTableView: React.FC<TrafficListProps> = ({ data }) => {
  const { sizesCenterPane } = useSettingsContext();

  const baseBackgroundColor = "#23262a";
  const baseColor = "#fff";

  const columns = useMemo<MRT_ColumnDef<TrafficProps>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 120,
        Cell: ({ row }) => <TextRender item={row.original.id} />,
      },
      {
        accessorKey: "tags",
        header: "Tags",
        size: 250,
        enableSorting: false,
        Cell: ({ row }) => <TagRender tags={row.original.tags} />,
      },
      {
        accessorKey: "url",
        header: "URL",
        size: 400,
        enableSorting: false,
        Cell: ({ row }) => <TextRender item={row.original.url} />,
      },
      {
        accessorKey: "client",
        header: "Client",
        enableSorting: false,
        Cell: ({ row }) => <ImageRender item={row.original.client} />,
      },
      {
        accessorKey: "method",
        header: "Method",
        Cell: ({ row }) => <TextRender item={row.original.method} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: ({ row }) => <TextRender item={row.original.status} />,
      },
      {
        accessorKey: "code",
        header: "Code",
        enableSorting: false,
        Cell: ({ row }) => <TextRender item={row.original.code} />,
      },
      {
        accessorKey: "time",
        header: "Time",
        Cell: ({ row }) => <TextRender item={row.original.time} />,
      },
      {
        accessorKey: "duration",
        header: "Duration",
        Cell: ({ row }) => <TextRender item={row.original.duration} />,
      },
      {
        accessorKey: "request",
        header: "Request",
        enableSorting: false,
      },
      {
        accessorKey: "response",
        header: "Response",
        enableSorting: false,
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data,
    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnActions: false,
    enableTopToolbar: false,
    enablePagination: false,
    enableRowVirtualization: true,
    enableStickyHeader: true,
    muiTopToolbarProps: {
      sx: {
        color: baseColor,
      },
    },
    muiTablePaperProps: {
      elevation: 0, //change the mui box shadow
    },
    muiColumnDragHandleProps: {
      sx: {
        color: baseColor,
      },
    },
    muiColumnActionsButtonProps: {
      sx: {
        color: baseColor,
      },
    },
    muiTableHeadCellProps: {
      sx: {
        color: baseColor,
      },
    },
    muiTableBodyProps: {
      sx: () => ({
        '& tr:nth-of-type(odd):not([data-selected="true"]):not([data-pinned="true"]) > td':
          {
            backgroundColor: darken(baseBackgroundColor, 0.1),
            color: baseColor,
          },
        '& tr:nth-of-type(odd):not([data-selected="true"]):not([data-pinned="true"]):hover > td':
          {
            backgroundColor: darken(baseBackgroundColor, 0.2),
            color: baseColor,
          },
        '& tr:nth-of-type(even):not([data-selected="true"]):not([data-pinned="true"]) > td':
          {
            backgroundColor: lighten(baseBackgroundColor, 0.1),
            color: baseColor,
          },
        '& tr:nth-of-type(even):not([data-selected="true"]):not([data-pinned="true"]):hover > td':
          {
            backgroundColor: darken(baseBackgroundColor, 0.2),
            color: baseColor,
          },
      }),
    },
    muiTableContainerProps: { sx: { height: sizesCenterPane[0] } },
    mrtTheme: (theme) => ({
      baseBackgroundColor: baseBackgroundColor,
      draggingBorderColor: theme.palette.secondary.main,
    }),
  });

  return <MaterialReactTable table={table} />;
};

export default MaterialTableView;
