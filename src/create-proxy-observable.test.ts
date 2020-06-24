import { createProxy } from "./create-proxy-observable";

describe("createProxy Tests", () => {
  it("should return an Observable", () => {
    createProxy({ ipc: undefined, channel: "foo" });
  });
});
