import { PartialIpc } from "./types";

type ObserverChannels = {
  next: string;
  error: string;
  complete: string;
};
export function ipcObserverChannels(
  ipcChannel: string,
  subscriberId: string
): ObserverChannels {
  return {
    next: `${ipcChannel}-${subscriberId}-next`,
    error: `${ipcChannel}-${subscriberId}-error`,
    complete: `${ipcChannel}-${subscriberId}-complete`,
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
