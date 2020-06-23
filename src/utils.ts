import { IpcRenderer, IpcMain, WebContents } from "electron";

export type PartialIpc = {
  on: IpcRenderer["on"] | IpcMain["on"];
  off: IpcRenderer["off"] | IpcMain["off"];
  send: IpcRenderer["send"] | WebContents["send"];
};

export type ProxyOptions = {
  channel: string;
  ipc: PartialIpc;
};

export function ipcObserverChannels(ipcChannel: string, correlationId: string) {
  return {
    next: `${ipcChannel}-${correlationId}-next`,
    error: `${ipcChannel}-${correlationId}-error`,
    complete: `${ipcChannel}-${correlationId}-complete`,
  };
}

export function ipcObservableChannels(ipcChannel: string) {
  return {
    subscribe: `${ipcChannel}-subscribed`,
    unsubscribe: `${ipcChannel}-unsubscribed`,
  };
}

export function observeOn(
  ipc: Pick<PartialIpc, "on" | "off">,
  channel: string,
  listener: (...args: any[]) => void
) {
  ipc.on(channel, listener);
  return () => ipc.off(channel, listener);
}
