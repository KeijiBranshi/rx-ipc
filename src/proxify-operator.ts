import {
  ProxyOptions,
  ipcObservableChannels,
  ipcObserverChannels,
  PartialIpc,
} from "./utils";

import { IpcRendererEvent, IpcMainEvent } from "electron";
import { Observable } from "rxjs/Observable";
import { fromEvent } from "rxjs/observable/fromEvent";
import "rxjs/add/operator/filter";
import "rxjs/add/operator/do";
import "rxjs/add/operator/takeUntil";

export function proxify(options: ProxyOptions) {
  // Using a factory to make the transition to RxJS 6 syntax a little easier
  return function proxifyOperator<T>(source: Observable<T>): Observable<T> {
    const { channel } = options;
    const [onSubscribe, onUnsubscribe] = remoteSubscriptionEvents(options);

    const marks = onSubscribe.mergeMap(([subscriber, correlationId]) => {
      const correlatedUnsubscribe = onUnsubscribe.filter(
        (id) => correlationId === id
      );
      const channels = ipcObserverChannels(channel, correlationId);
      return source
        .do(
          (next: T) => subscriber.send(channels.next, next),
          (e: Error) => subscriber.send(channels.error, e),
          () => subscriber.send(channels.complete)
        )
        .takeUntil(correlatedUnsubscribe);
    });

    // reroute all marks to MainProcess for aggregation
    return marks;
  };
}

type IpcEvent = IpcMainEvent | IpcRendererEvent;
type CorrelationId = string;
type IpcSubscriber = Pick<PartialIpc, "send">;
type IpcSubscribeRequest = [IpcSubscriber, CorrelationId];

function remoteSubscriptionEvents({
  channel,
  ipc,
}: ProxyOptions): [Observable<IpcSubscribeRequest>, Observable<CorrelationId>] {
  const { subscribe, unsubscribe } = ipcObservableChannels(channel);
  const subscribed = fromEvent<[IpcSubscriber, CorrelationId]>(
    ipc,
    subscribe,
    (event: IpcEvent, correlationId: string) => [event.sender, correlationId]
  );
  const unsubscribed = fromEvent(
    ipc,
    unsubscribe,
    ({}, correlationId: string) => correlationId
  );

  return [subscribed, unsubscribed];
}
