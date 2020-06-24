import { v4 as uuid } from "node-uuid";

import { Observable } from "rxjs/Observable";

import { Observer } from "rxjs/Observer";

import "rxjs/add/operator/mergeMap";

import {
  observeOn,
  ProxyOptions,
  ipcObserverChannels,
  ipcObservableChannels,
} from "./utils";

export default function createProxy<T>(options: ProxyOptions): Observable<T> {
  const { channel, ipc } = options;

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
