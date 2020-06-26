import { Observable } from "rxjs/Observable";
import operator from "../../proxy-report";

declare module "rxjs/Observable" {
  interface Observable<T> {
    mapToProxyReport: typeof operator;
  }
}
Observable.prototype.mapToProxyReport = operator;
