import { marbles } from "rxjs-marbles";
import { fromEvent } from "rxjs/observable/fromEvent";
import { PartialIpc } from "./utils";
import "./proxify-operator";

jest.mock("rxjs/observable/fromEvent");

describe("Proxify Operator Tests", () => {
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
  const marbleSubscribers = {
    a: ["a", sender],
    b: ["b", sender],
    c: ["c", sender],
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should listen for subscription requests on the provided channel", () => {});

  it(
    "should subscribe to source on subscription request from proxy observer",
    marbles((m) => {
      const source = m.cold("-");
      const expectedSubs = ["^", "---^", "------^"];
      const mockIpcSubs = m.cold("a--b--c", marbleSubscribers);
      const mockNever = m.cold("-");

      (fromEvent as jest.Mock).mockImplementation(({}, ch: string) => {
        if (ch.includes("-subscribed")) {
          return mockIpcSubs;
        }
        return mockNever;
      });

      const destination = source.proxify({ ipc, uuid, channel });

      m.expect(destination).toBeObservable(mockNever);
      console.log("PASSED");
      m.expect(source).toHaveSubscriptions(expectedSubs);
    })
  );

  it(
    "should emit once per subscriber (on each emission from source)",
    marbles((m) => {
      const source = m.cold("     --------a-----b-----c---");
      const expected = "          ---a-a-a-b-b-b-c-c-c";
      const mockSubs = m.cold("a-b-c", marbleSubscribers);
      const mockUnsubs = m.cold("-");
      const mockEmpty = m.cold("|");

      (fromEvent as jest.Mock).mockImplementation(({}, ch: string) => {
        if (ch.includes("-unsubscribed")) {
          return mockUnsubs;
        }
        if (ch.includes("-subscribed")) {
          return mockSubs;
        }
        return mockEmpty;
      });

      const destination = source.proxify({ ipc, uuid, channel });

      m.expect(destination).toBeObservable(expected);
    })
  );

  it(
    "should not emit for unsubscribed subscribers",
    marbles((m) => {
      const source = m.cold("     --------a-----b-----c---");
      const expected = "          --------a-a-a-------c-c-c";
      const mockSubs = m.cold("   --a--b--c--", marbleSubscribers);
      const mockUnsubs = m.cold(" -------b---");
      const mockEmpty = m.cold("|");

      (fromEvent as jest.Mock).mockImplementation(({}, ch: string) => {
        if (ch.includes("-unsubscribed")) {
          return mockUnsubs;
        }
        if (ch.includes("-subscribed")) {
          return mockSubs;
        }
        return mockEmpty;
      });

      const destination = source.proxify({ ipc, uuid, channel });

      m.expect(destination).toBeObservable(expected);
    })
  );

  it(
    "should not emit if there are no proxy subscribers",
    marbles((m) => {
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
