import { zip } from "lodash";
import { marbles } from "rxjs-marbles";
import { Observable } from "rxjs";
import "rxjs/add/operator/pluck";
import { fromEvent } from "rxjs/observable/fromEvent";
import { PartialIpc } from "./types";
import "./add/operator/proxify";

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
  const subscriberValues = {
    a: ["a", sender],
    b: ["b", sender],
    c: ["c", sender],
  };

  const mockFromEvent = (
    ipcSubs: Observable<unknown>,
    ipcUnsubs: Observable<unknown>,
    fallback: Observable<unknown>
  ) => {
    const fromEventImpl = (_target: unknown, actualChannel: string) =>
      actualChannel.includes("-subscribed")
        ? ipcSubs
        : actualChannel.includes("-unsubscribed")
        ? ipcUnsubs
        : fallback;
    (fromEvent as jest.Mock).mockImplementation(fromEventImpl);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it(
    "should subscribe to source on subscription request from proxy observer",
    marbles((m) => {
      const source = m.cold("-");
      const expectedSubs = ["^", "---^", "------^"];
      const mockIpcSubs = m.cold("a--b--c", subscriberValues);
      const mockNever = m.cold("-");

      (fromEvent as jest.Mock).mockImplementation(
        (_target: unknown, actualChannel: string) => {
          if (
            actualChannel.includes("-subscribed") &&
            actualChannel.includes(channel)
          ) {
            return mockIpcSubs;
          }
          return mockNever;
        }
      );

      const destination = source.proxify({ ipc, uuid, channel });

      m.expect(destination).toBeObservable(mockNever);
      m.expect(source).toHaveSubscriptions(expectedSubs);
    })
  );

  it(
    "should unsubscribe from source if proxy observer unsubscribes",
    marbles((m) => {
      const source = m.cold("--------------");
      // note: in RxJS 6, whitespaces dont count towards subscription time frames
      const subA = "-^------!-----";
      const subB = "----^-------!-";
      const subC = "-------^--!---";
      const mockIpcSubs = m.hot("  ^a--b--c------", subscriberValues);
      const mockIpcUnsubs = m.hot("^-------a-c-b-");
      const mockNever = m.cold("-");

      (fromEvent as jest.Mock).mockImplementation(
        (_target: unknown, actualChannel: string) => {
          if (
            actualChannel.includes("-subscribed") &&
            actualChannel.includes(channel)
          ) {
            return mockIpcSubs;
          }
          if (
            actualChannel.includes("-unsubscribed") &&
            actualChannel.includes(channel)
          ) {
            return mockIpcUnsubs;
          }
          return mockNever;
        }
      );

      const destination = source
        .proxify({ ipc, uuid, channel })
        .pluck("payload");

      m.expect(destination).toBeObservable(source);
      m.expect(source).toHaveSubscriptions([subA, subB, subC]);
    })
  );

  it(
    "should emit next reports from the source",
    marbles((m) => {
      const source = m.hot("---a-b-");
      const expected = m.cold("---a-b-", {
        a: {
          observer: "next",
          payload: "a",
        },
        b: {
          observer: "next",
          payload: "b",
        },
      });

      mockFromEvent(m.cold("-a-", subscriberValues), m.hot("-"), m.cold("-"));

      const dest = source.proxify({ ipc, channel, uuid });
      m.expect(dest).toBeObservable(expected);
    })
  );

  it(
    "should emit error reports from source",
    marbles((m) => {
      const source = m.hot("---a-#-");
      const expected = m.cold("---a-b-", {
        a: {
          observer: "next",
          payload: "a",
        },
        b: {
          observer: "error",
          payload: "error",
        },
      });

      mockFromEvent(m.cold("-a-", subscriberValues), m.hot("-"), m.cold("-"));

      const dest = source.proxify({ ipc, channel, uuid });
      m.expect(dest).toBeObservable(expected);
    })
  );

  it(
    "should emit complete reports from source",
    marbles((m) => {
      const source = m.hot("---a-|");
      const expected = m.cold("---a-b", {
        a: {
          observer: "next",
          payload: "a",
        },
        b: {
          observer: "complete",
          payload: undefined,
        },
      });

      mockFromEvent(m.cold("-a-", subscriberValues), m.hot("-"), m.cold("-"));

      const dest = source.proxify({ ipc, channel, uuid });
      m.expect(dest).toBeObservable(expected);
    })
  );

  it(
    "should emit once per subscriber (on each emission from source)",
    marbles((m) => {
      const source = m.cold("     --------a-----b-----c---");
      const expected = "          ---a-a-a-b-b-b-c-c-c";
      const mockSubs = m.cold("a-b-c", subscriberValues);
      const mockUnsubs = m.cold("-");
      const mockEmpty = m.cold("|");

      (fromEvent as jest.Mock).mockImplementation(
        (_target: unknown, ch: string) => {
          if (ch.includes("-unsubscribed")) {
            return mockUnsubs;
          }
          if (ch.includes("-subscribed")) {
            return mockSubs;
          }
          return mockEmpty;
        }
      );

      const destination = source
        .proxify({ ipc, uuid, channel })
        .pluck("payload");

      m.expect(destination).toBeObservable(expected);
    })
  );

  it(
    "should not emit for unsubscribed subscribers",
    marbles((m) => {
      const source = m.hot("--------0-----1-----2---");
      const expected = "--------(000)-(11)--(22)-";
      const ipcSubs = m.cold("---a-bc------", subscriberValues);
      const ipcUnsubs = m.hot("------------b---");

      const fromEventImpl = (_target: unknown, ch: string) => {
        if (ch.includes("-unsubscribed")) {
          return ipcUnsubs;
        }
        if (ch.includes("-subscribed")) {
          return ipcSubs;
        }
        return m.cold("|");
      };
      (fromEvent as jest.Mock).mockImplementation(fromEventImpl);

      const destination = source
        .proxify({ ipc, uuid, channel })
        .pluck("payload");

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

  it(
    "should emit if no preRouteFilter provided",
    marbles((m) => {
      const source = m.cold("---a---");
      const mockIpcs = m.hot("a", subscriberValues);
      const mockNever = m.cold("-");

      (fromEvent as jest.Mock).mockImplementation(
        (_target: unknown, actualChannel: string) => {
          if (
            actualChannel.includes("-subscribed") &&
            actualChannel.includes(channel)
          ) {
            return mockIpcs;
          }
          return mockNever;
        }
      );

      const destination = source
        .proxify({ ipc, uuid, channel })
        .pluck("payload");
      m.expect(destination).toBeObservable(source);
    })
  );

  it(
    "should emit if preRouteFilter returns true",
    marbles((m) => {
      const source = m.cold("---a---");
      const ipcSubs = m.hot("a", subscriberValues);
      const never = m.cold("-");

      (fromEvent as jest.Mock).mockImplementation(
        (_target: unknown, actualChannel: string) => {
          if (
            actualChannel.includes("-subscribed") &&
            actualChannel.includes(channel)
          ) {
            return ipcSubs;
          }
          return never;
        }
      );

      const destination = source
        .proxify({
          ipc,
          uuid,
          channel,
          preRouteFilter: () => true,
        })
        .pluck("payload");
      m.expect(destination).toBeObservable(source);
    })
  );

  it(
    "should not emit if preRouteObservable returns false",
    marbles((m) => {
      const source = m.cold("---a---");
      const ipcSubs = m.hot("a", subscriberValues);
      const never = m.cold("-");

      const fromEventImpl = (_target: unknown, actualChannel: string) => {
        if (
          actualChannel.includes("-subscribed") &&
          actualChannel.includes(channel)
        ) {
          return ipcSubs;
        }
        return never;
      };
      (fromEvent as jest.Mock).mockImplementation(fromEventImpl);

      const destination = source.proxify({
        ipc,
        uuid,
        channel,
        preRouteFilter: () => false,
      });
      m.expect(destination).toBeObservable(never);
    })
  );

  it(
    "should have sent destination values over ipc",
    marbles((m) => {
      const source = m.hot("-x-----y-");
      // a subscribes, sends over x
      // b subscribes, both a and b send over y
      const subs = m.cold("a----b---", subscriberValues);
      const fromEventImpl = (_target: unknown, actualChannel: string) =>
        actualChannel.includes("-subscribed") ? subs : m.cold("-");
      (fromEvent as jest.Mock).mockImplementation(fromEventImpl);

      const destination = source
        .proxify({ ipc, channel, uuid })
        .pluck("payload");

      m.expect(destination).toBeObservable("-x-----(yy)");
      m.flush();

      expect(sender.send).toHaveBeenCalledWith(`${channel}-${"a"}-next`, "x");
      expect(sender.send).toHaveBeenCalledTimes(3);

      const expectedCalls: [string, string][] = [
        [`${channel}-${"a"}-next`, "x"],
        [`${channel}-${"a"}-next`, "y"],
        [`${channel}-${"b"}-next`, "y"],
      ];
      const actualCalls = sender.send.mock.calls;

      zip<[string, string], [string, string]>(
        actualCalls,
        expectedCalls
      ).forEach(([actualArgs, expectedArgs]) => {
        if (!(actualArgs && expectedArgs)) {
          fail(
            "Expected number of calls does not align with actual number of calls"
          );
        }
        const [actualChannel, actualPayload] = actualArgs;
        const [expectedChannel, expectedPayload] = expectedArgs;

        expect(actualChannel).toEqual(expectedChannel);
        expect(actualPayload).toEqual(expectedPayload);
      });
    })
  );

  it(
    "should have sent destination error over ipc",
    marbles((m) => {
      const source = m.hot("---x-#-");
      const expected = m.cold("---a-b-", {
        a: {
          observer: "next",
          payload: "x",
        },
        b: {
          observer: "error",
          payload: "error",
        },
      });

      mockFromEvent(m.cold("-a-", subscriberValues), m.hot("-"), m.cold("-"));

      const dest = source.proxify({ ipc, channel, uuid });
      m.expect(dest).toBeObservable(expected);
      m.flush();

      expect(sender.send).toHaveBeenCalledTimes(2);
      const expectedCalls: [string, string][] = [
        [`${channel}-${"a"}-next`, "x"],
        [`${channel}-${"a"}-error`, "error"],
      ];
      const actualCalls = sender.send.mock.calls;
      zip<[string, string], [string, string]>(
        actualCalls,
        expectedCalls
      ).forEach(([actualArgs, expectedArgs]) => {
        if (!(actualArgs && expectedArgs)) {
          fail(
            "Expected number of calls does not align with actual number of calls"
          );
        }
        const [actualChannel, actualPayload] = actualArgs;
        const [expectedChannel, expectedPayload] = expectedArgs;

        expect(actualChannel).toEqual(expectedChannel);
        expect(actualPayload).toEqual(expectedPayload);
      });
    })
  );

  it(
    "should have sent destination complete over ipc",
    marbles((m) => {
      const source = m.hot("---x-|-");
      const expected = m.cold("---a-b-", {
        a: {
          observer: "next",
          payload: "x",
        },
        b: {
          observer: "complete",
          payload: undefined,
        },
      });

      mockFromEvent(m.cold("-a-", subscriberValues), m.hot("-"), m.cold("-"));

      const dest = source.proxify({ ipc, channel, uuid });
      m.expect(dest).toBeObservable(expected);
      m.flush();

      expect(sender.send).toHaveBeenCalledTimes(2);
      const expectedCalls: [string, string | undefined][] = [
        [`${channel}-${"a"}-next`, "x"],
        [`${channel}-${"a"}-complete`, undefined],
      ];
      const actualCalls = sender.send.mock.calls;
      zip<[string, string | undefined], [string, string | undefined]>(
        actualCalls,
        expectedCalls
      ).forEach(([actualArgs, expectedArgs]) => {
        if (!(actualArgs && expectedArgs)) {
          fail(
            "Expected number of calls does not align with actual number of calls"
          );
        }
        const [actualChannel, actualPayload] = actualArgs;
        const [expectedChannel, expectedPayload] = expectedArgs;

        expect(actualChannel).toEqual(expectedChannel);
        expect(actualPayload).toEqual(expectedPayload);
      });
    })
  );
});
