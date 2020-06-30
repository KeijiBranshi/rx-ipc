import { Observable } from "rxjs/Observable";
import { proxify, ProxifyOptions } from "../..";

/**
 * RxJS v5 Syntax Operator for proxify
 */
function proxifyRxV5<T>(this: Observable<T>, options: ProxifyOptions<T>) {
  return proxify(options)(this);
}

declare module "rxjs/Observable" {
  interface Observable<T> {
    proxify: typeof proxifyRxV5;
  }
}
Observable.prototype.proxify = proxifyRxV5;
