// import { ContextMenu as TauriContextMenu } from "tauri-plugin-context-menu";

export type TableViewContextMenuRendererOptions = any;

export interface TableViewContextMenuRenderer<T> {
  render: (items: T[]) => Promise<void>;
}