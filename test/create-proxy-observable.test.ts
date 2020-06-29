import { Observable } from "rxjs/Observable";
import { createProxy } from "../src/create-proxy-observable";

describe("createProxy Tests", () => {
  const channel = "foo";
  const mockSubscriptionId = "mock-id";
  const ipc = {
    on: jest.fn(),
    off: jest.fn(),
    send: jest.fn(),
  };
  const uuid = jest.fn();

  beforeEach(() => {
    uuid.mockReturnValue(mockSubscriptionId);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return an Observable", () => {
    const proxy = createProxy({ ipc, channel: "foo", uuid });
    expect(proxy).toBeInstanceOf(Observable);
  });

  it("should send subscription request on subscribe", () => {
    uuid.mockReturnValue(mockSubscriptionId);

    const proxy = createProxy({ ipc, channel, uuid });
    const subscription = proxy.subscribe();

    expect(ipc.send).toHaveBeenCalledWith(
      `${channel}-subscribed`,
      mockSubscriptionId
    );
    subscription.unsubscribe();
  });

  it("should send unsubscribe request on unsubscribe", () => {
    const proxy = createProxy({ ipc, channel, uuid });
    proxy.subscribe().unsubscribe();

    expect(ipc.send).toHaveBeenCalledWith(
      `${channel}-unsubscribed`,
      mockSubscriptionId
    );
  });

  ["next", "error", "complete"].forEach(
    (type: "next" | "error" | "complete") => {
      const expectedIpcChannel = `${channel}-${mockSubscriptionId}-${type}`;
      it(`should call observer.${type} when ${type} signal comes through ipc`, () => {
        expect.assertions(1);
        const mockValue = "value";

        const sub = createProxy({ ipc, channel, uuid }).subscribe({
          next: (value) => expect(value).toEqual(mockValue),
          error: (err) => expect(err).toEqual(mockValue),
          complete: () => expect(true).toEqual(true),
        });

        const {
          on: {
            mock: { calls },
          },
        } = ipc;
        calls.forEach(([observedChannel, callback]) => {
          if (observedChannel === expectedIpcChannel) {
            callback({}, mockValue);
          }
        });

        sub.unsubscribe();
      });

      it(`should remove ${type} listener on unsubscribe`, () => {
        expect.assertions(1);

        const sub = createProxy({ ipc, channel, uuid }).subscribe();

        const {
          on: {
            mock: { calls: onCalls },
          },
        } = ipc;

        const [, registeredCallback] = onCalls.find(
          ([observedChannel]) => observedChannel === expectedIpcChannel
        );

        sub.unsubscribe();
        const {
          off: {
            mock: { calls: offCalls },
          },
        } = ipc;
        const teardownCall = offCalls.find(
          ([observedChannel, callback]) =>
            observedChannel === expectedIpcChannel &&
            callback === registeredCallback
        );

        expect(teardownCall).toBeDefined();
      });
    }
  );
});
