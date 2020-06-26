import { marbles } from "rxjs-marbles";
import { PartialIpc } from "./utils";
import { fromEvent } from "rxjs/observable/fromEvent";
import "./proxify-operator";

jest.mock("rxjs/observable/fromEvent");

describe("Proxify Operator Tests", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should listen for subscription requests on the provided channel", () => {});

  it(
    "should emit once per subscriber (on each emission from source)",
    marbles((m) => {
      const ipc: PartialIpc = {
        on: jest.fn(),
        off: jest.fn(),
        send: jest.fn(),
      };
      const uuid = jest.fn();
      const channel = "mock-channel";
      const sender = {
        send: jest.fn(),
      };
      const subscribers = {
        a: ["a", sender],
        b: ["b", sender],
        c: ["c", sender],
      };

      const source = m.cold("     --------a-----b-----c---");
      const expected = "          -------a-a-a-b-b-b-c-c-c";
      const mockSubs = m.cold("   -a-b-c----------------", subscribers);
      const mockUnsubs = m.cold(" ----------------------");
      const mockEmpty = m.cold("|");

      (fromEvent as jest.Mock).mockImplementation(({}, channel: string) => {
        if (channel.includes("-unsubscribed")) {
          return mockUnsubs;
        } else if (channel.includes("-subscribed")) {
          return mockSubs;
        } else {
          return mockEmpty;
        }
      });

      const destination = source.proxify({ ipc, uuid, channel });

      m.expect(destination).toBeObservable(expected);
    })
  );

  it(
    "should not emit if there are no proxy subscribers",
    marbles((m) => {
      const ipc: PartialIpc = {
        on: jest.fn(),
        off: jest.fn(),
        send: jest.fn(),
      };
      const uuid = jest.fn();
      const channel = "mock-channel";

      const source = m.cold("---a-b-c-|");
      const expected = "     ----------";
      const destination = source.proxify({ ipc, uuid, channel });

      m.expect(destination).toBeObservable(expected);
    })
  );

  it(`should have sent ${"placeholder"} over subscriber-correlated ipc channel if result observable emits`, () => {});

  it("should emit if no preRouteFilter provided", () => {});

  it("should emit if preRouteFilter returns true", () => {});

  it("should not emit if preRouteObservable returns false", () => {});
});
