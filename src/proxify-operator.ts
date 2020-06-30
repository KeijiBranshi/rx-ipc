import { IpcRendererEvent, IpcMainEvent } from "electron";
import { Observable } from "rxjs/Observable";
import { fromEvent } from "rxjs/observable/fromEvent";
import { Observer } from "rxjs/Observer";

import "rxjs/add/operator/filter";
import "rxjs/add/operator/do";
import "rxjs/add/operator/takeUntil";
import "rxjs/add/operator/take";
import "rxjs/add/operator/mergeMap";
import "rxjs/add/operator/map";
import "./proxy-report-operator";

import { PartialIpc, ProxifyOptions, ProxyReport } from "./types";
import { ipcObservableChannels, ipcObserverChannels } from "./utils";

type IpcEvent = IpcMainEvent | IpcRendererEvent;
type IpcSender = Pick<PartialIpc, "send">;
type ObserverId = string;

type ProxyObserver<T> = Observer<T> & {
  channel: string;
  unsubscribed: Observable<ObserverId>;
};

function onProxyObservers<T>({
  channel,
  ipc,
}: ProxifyOptions<T>): Observable<ProxyObserver<T>> {
  const { subscribe, unsubscribe } = ipcObservableChannels(channel);
  const unsubscribed = (targetId: string) =>
    fromEvent<ObserverId>(
      ipc,
      unsubscribe,
      (_event: unknown, observerId: string) => observerId
    )
      .filter((observerId) => observerId === targetId)
      .take(1);
  const subscribed = fromEvent<[ObserverId, IpcSender]>(
    ipc,
    subscribe,
    (event: IpcEvent, observerId: string) => [observerId, event.sender]
  );

  return subscribed.map(([observerId, sender]) => {
    const channels = ipcObserverChannels(channel, observerId);
    const observer: ProxyObserver<T> = {
      next: (next: T) => sender.send(channels.next, next),
      error: (e: Error) => sender.send(channels.error, e),
      complete: () => sender.send(channels.complete),
      unsubscribed: unsubscribed(observerId),
      channel: channels.next,
    };

    return observer;
  });
}

/**
 * Creates an RxJS operator to proxify an existing Observable on the current
 * process (main or renderer). Values emitted by the source observable
 * @param options
 *  @property {() => boolean} preRouteFilter Applies a filter on values emitted across the proxy channel
 *  @property {string} channel Determines the IPC Channel to use to route proxy emissions
 *  @property {() => void} uuid UUID Generator used to help track/sync subscriptions across processes
 *  @property {EventEmitter & Sender } ipc Arbiter for base electron communication (e.g. ipcRenderer, ipcMain + WebContents)
 */
export default function proxify<T>(options: ProxifyOptions<T>) {
  // Using a factory to make the transition to RxJS 6 syntax a little easier
  return function proxifyOperator(
    source: Observable<T>
  ): Observable<ProxyReport<T>> {
    const { preRouteFilter } = options;

    return onProxyObservers(options).mergeMap(
      (proxyObserver): Observable<ProxyReport<T>> => {
        // for each new proxyObserver
        return source
          .filter((next) =>
            typeof preRouteFilter === "function"
              ? preRouteFilter(proxyObserver.channel, next)
              : true
          )
          .do(proxyObserver) // route emissions over to proxy observer
          .mapToProxyReport()
          .takeUntil(proxyObserver.unsubscribed);
      }
    );
  };
}

export { proxify };
