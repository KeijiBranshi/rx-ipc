import { Observable } from "rxjs/Observable";

import { createProxy } from "./create-proxy-observable";

describe("createProxy Tests", () => {
  it("should return an Observable", () => {
    const ipc = {
      on: jest.fn(),

      off: jest.fn(),

      send: jest.fn(),
    };

    const proxy = createProxy({ ipc, channel: "foo" });

    expect(proxy).toBeInstanceOf(Observable);
  });
});
