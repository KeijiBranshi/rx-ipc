import { v4 as uuid } from 'node-uuid';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { PartialIpc, ProxyOptions, ipcObserverChannels, ipcObservableChannels } from './utils';
import { IpcMark } from '../../renderer/ipcMonitor';

export function createProxy(options: ProxyOptions & { channel: 'ipc-monitor' }): Observable<IpcMark>;
export function createProxy<T>(options: ProxyOptions): Observable<T> {
  const { channel, ipc } = options;
  return Observable.create((observer: Observer<T>) => {
    const correlationId = uuid();
    const { subscribe, unsubscribe } = ipcObservableChannels(channel);
    const { next, error, complete } = ipcObserverChannels(channel, correlationId);

    const teardownNext = observe(ipc, next, ({}, value: T) => {
      try {
        observer.next(value);
      } catch (e) {
        observer.error(e);
      }
    });
    const teardownError = observe(ipc, error, ({}, error: Error) => observer.error(error));
    const teardownComplete = observe(ipc, complete, () => observer.complete());

    ipc.send(subscribe, correlationId);
    return () => {
      teardownNext();
      teardownError();
      teardownComplete();
      ipc.send(unsubscribe, correlationId);
    };
  });
}

function observe(ipc: Pick<PartialIpc, 'on' | 'off'>, channel: string, listener: (...args: any[]) => void) {
  ipc.on(channel, listener);
  return () => ipc.off(channel, listener);
}
