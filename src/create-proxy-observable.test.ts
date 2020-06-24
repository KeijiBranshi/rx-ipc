import { Observable } from "rxjs/Observable";
import { createProxy } from "./create-proxy-observable";

describe("createProxy Tests", () => {
  it("should return an Observable", () => {
    const proxy = createProxy({ ipc: undefined, channel: "foo" });
    expect(proxy).toBeInstanceOf(Observable);
  });
});
