import { Observable } from "rxjs/Observable";
import { ProxifyOptions } from "../../types";
import { proxify } from "../../proxify-operator";

/**
 * For RxJS v5 syntax
 * @param this
 * @param options
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
