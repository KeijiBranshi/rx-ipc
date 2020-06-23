import { v4 as uuid } from "node-uuid";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import "rxjs/add/operator/mergeMap";

import { observeOn } from "./utils";

import {
  PartialIpc,
  ProxyOptions,
  ipcObserverChannels,
  ipcObservableChannels,
} from "./utils";

export function createProxy<T>(options: ProxyOptions): Observable<T> {
  const { channel, ipc } = options;
  return Observable.create((observer: Observer<T>) => {
    const correlationId = uuid();
    const { subscribe, unsubscribe } = ipcObservableChannels(channel);
    const { next, error, complete } = ipcObserverChannels(
      channel,
      correlationId
    );

    const teardownNext = observeOn(ipc, next, ({}, value: T) => {
      try {
        observer.next(value);
      } catch (e) {
        observer.error(e);
      }
    });
    const teardownError = observeOn(ipc, error, ({}, error: Error) =>
      observer.error(error)
    );
    const teardownComplete = observeOn(ipc, complete, () =>
      observer.complete()
    );

    ipc.send(subscribe, correlationId);
    return () => {
      teardownNext();
      teardownError();
      teardownComplete();
      ipc.send(unsubscribe, correlationId);
    };
  });
}
