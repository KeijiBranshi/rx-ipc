import { IpcRenderer, IpcMain, WebContents } from "electron";

export type ProxyReport<T> =
  | {
      observer: string;
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
    };

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

export type ProxifyOptions<T> = ProxyOptions & {
  preRouteFilter?: (channel: string, payload: T) => boolean;
};
