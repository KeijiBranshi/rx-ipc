import { IpcRenderer, IpcMain, WebContents } from "electron";

export type PartialIpc = {
  on: IpcRenderer["on"] | IpcMain["on"];
  off: IpcRenderer["off"] | IpcMain["off"];
  send: IpcRenderer["send"] | WebContents["send"];
};

type UuidGenerator = () => string;
export type ProxyOptions = {
  channel: string;
  ipc: PartialIpc;
  uuid: UuidGenerator;
};

type ObserverChannels = {
  next: string;
  error: string;
  complete: string;
};
export function ipcObserverChannels(
  ipcChannel: string,
  subscriptionId: string
): ObserverChannels {
  return {
    next: `${ipcChannel}-${subscriptionId}-next`,
    error: `${ipcChannel}-${subscriptionId}-error`,
    complete: `${ipcChannel}-${subscriptionId}-complete`,
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

/* eslint-disable @typescript-eslint/no-explicit-any */
type TeardownLogic = () => void;
export function observeOn(
  ipc: Pick<PartialIpc, "on" | "off">,
  channel: string,
  listener: (...args: any[]) => void
): TeardownLogic {
  ipc.on(channel, listener);
  return () => ipc.off(channel, listener);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
