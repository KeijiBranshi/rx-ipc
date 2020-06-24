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

type ObserverChannels = {
  next: string;
  error: string;
  complete: string;
};
export function ipcObserverChannels(
  ipcChannel: string,
  correlationId: string,
): ObserverChannels {
  return {
    next: `${ipcChannel}-${correlationId}-next`,
    error: `${ipcChannel}-${correlationId}-error`,
    complete: `${ipcChannel}-${correlationId}-complete`,
  };
}

type ObservableChannels = {
  subscribe: string;
  unsubscribe: string;
};
export function ipcObservableChannels(ipcChannel: string): ObservableChannels {
  return {
    subscribe: `${ipcChannel}-subscribed`,
    unsubscribe: `${ipcChannel}-unsubscribed`,
  };
}

type TeardownLogic = () => void;
export function observeOn(
  ipc: Pick<PartialIpc, "on" | "off">,
  channel: string,
  listener: (...args: any[]) => void,
): TeardownLogic {
  ipc.on(channel, listener);
  return () => ipc.off(channel, listener);
}
