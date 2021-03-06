# RxJS Utility for Electron IPC

## Modules

### Proxy Observables

Create an `Observable` in one process, and remotely observe it from another.

#### In Renderer Process
```javascript
import "rx-ipc/add/operator/proxify";
import { of } from "rxjs/observable/of";
import { ipcRenderer as ipc } from "electron";

const channel = "some-identifier";
const proxiedEvents = of("foo").proxify({ ipc, channel });

proxiedEvents.subscribe(({ observer, payload }) => {
  // maps to a "proxy report"
  // `observer` = "next"; `payload` = "foo"
  console.log(`Routed { ${payload} } to { ${observer} } callback in main`);
});
```

#### In Main Process
```javascript
/** In Main Process */
import { createProxy } from "rx-ipc";
import { ipcMain as ipc } from "electron";

const channel = "some-identifier"; // must match the channel of renderer
createProxy({ channel, ipc }).subscribe((payload) => {
  // Will receive "payload" (from the report above)
  // `payload` = "foo"
  console.log(`Message From Renderer: ${message}`);
});
```

> Note: You could swap the MainProcess and RendererProcess code snippets above, and it would still work

## TODO

1. Upgrade to RxJS v6. At the moment, I'm consuming this in an app that requires RxJS v5.
