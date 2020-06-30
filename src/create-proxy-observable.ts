import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import "rxjs/add/operator/mergeMap";

import { ProxyOptions } from "./types";
import { observeOn, ipcObserverChannels, ipcObservableChannels } from "./utils";

/**
 * Creates on Observable that mirrors values emitted by a proxy in
 * a separate process (dictated by ipc)
 * @param channel Determines the IPC Channel to use to route proxy emissions
 * @param uuid UUID Generator used to help track/sync subscriptions across processes
 * @param ipc Arbiter for base electron communication (e.g. ipcRenderer, ipcMain + WebContents)
 */
export default function createProxy<T>(options: ProxyOptions): Observable<T> {
  const { channel, ipc, uuid } = options;
  return Observable.create((observer: Observer<T>) => {
    const subscriptionId = uuid();
    const { subscribe, unsubscribe } = ipcObservableChannels(channel);
    const { next, error, complete } = ipcObserverChannels(
      channel,
      subscriptionId
    );

    const teardownNext = observeOn(ipc, next, (_event, value: T) => {
      try {
        observer.next(value);
      } catch (e) {
        observer.error(e);
      }
    });
    const teardownError = observeOn(ipc, error, (_event, e: Error) =>
      observer.error(e)
    );
    const teardownComplete = observeOn(ipc, complete, () =>
      observer.complete()
    );

    ipc.send(subscribe, subscriptionId);
    return () => {
      teardownNext();
      teardownError();
      teardownComplete();
      ipc.send(unsubscribe, subscriptionId);
    };
  });
}

export { createProxy };
