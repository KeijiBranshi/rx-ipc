import { IpcRenderer, IpcMain, WebContents } from "electron";

export type ProxyReport<T> =
  | {
      observer: string;
      payload?: unknown;
    }
  | {
      observer: "next";
      payload: T;
    }
  | {
      observer: "error";
      payload: Error;
    }
  | {
      observer: "complete";
      payload?: undefined;
    };

export type PartialIpc = {
  on: IpcRenderer["on"] | IpcMain["on"];
  off: IpcRenderer["off"] | IpcMain["off"];
  send: IpcRenderer["send"] | WebContents["send"];
};

export type ProxyOptions = {
  channel: string;
  ipc: PartialIpc;
};

export type ProxifyOptions<T> = ProxyOptions & {
  preRouteFilter?: (channel: string, payload: T) => boolean;
};
