import { ContextMenu as TauriContextMenu } from "tauri-plugin-context-menu";

export type TableViewContextMenuRendererOptions = TauriContextMenu.Options;

export interface TableViewContextMenuRenderer<T> {
  render: (items: T[]) => Promise<void>;
}