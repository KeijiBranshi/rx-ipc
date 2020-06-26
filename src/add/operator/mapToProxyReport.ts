import { Observable } from "rxjs/Observable";
import { mapToProxyReport } from "../../proxy-report";

declare module "rxjs/Observable" {
  interface Observable<T> {
    mapToProxyReport: typeof mapToProxyReport;
  }
}
Observable.prototype.mapToProxyReport = mapToProxyReport;
