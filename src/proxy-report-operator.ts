import { Observable } from "rxjs/Observable";
import { of } from "rxjs/observable/of";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/map";
import "rxjs/add/operator/concat";

import { ProxyReport } from "./types";

function nextReport<T>(payload: T): ProxyReport<T> {
  return {
    observer: "next",
    payload,
  };
}
function errorReport<T>(payload: Error): ProxyReport<T> {
  return {
    observer: "error",
    payload,
  };
}
function completeReport<T>(): ProxyReport<T> {
  return {
    observer: "complete",
    payload: undefined,
  };
}

function mapToProxyReport<T>(this: Observable<T>): Observable<ProxyReport<T>> {
  return this.map((payload) => nextReport(payload)) // for routed "next" payloads
    .concat(of(completeReport())) // for routed "complete" signals
    .catch((e) => of(errorReport<T>(e))); // for routed "error" payloads
}

declare module "rxjs/Observable" {
  interface Observable<T> {
    mapToProxyReport: typeof mapToProxyReport;
  }
}
Observable.prototype.mapToProxyReport = mapToProxyReport;
