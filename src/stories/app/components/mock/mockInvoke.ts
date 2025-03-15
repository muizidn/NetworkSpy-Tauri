import { TauriInvokeFn } from "@src/packages/tauri-env";

export const mockInvoke: TauriInvokeFn = (cmd, args) => {
    return Promise.reject();
  };