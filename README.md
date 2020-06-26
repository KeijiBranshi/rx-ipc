# RxJS Utilities for Electron

## Modules

### Proxy Observables

Create an `Observable` in one process, and remotely observe it from another.

```javascript
/** In Renderer Process (nodeIntegration enabled) */
import "rx-electron/add/operator/proxify";
import { of } from "rxjs/observable/of";
import { v4 as uuid } from "node-uuid";
import { ipcRenderer as ipc } from "electron";

const channel = "some-identifier";
of("foo")
  .proxify({ ipc, channel, uuid })
  .subscribe(({ observer, payload }) => {
    // maps to a "proxy report"
    // `observer` = "next"; `payload` = "foo"
    console.log(`Routed { ${payload} } to { ${payload} } callback in main`);
  });

/** In Main Process */
import { createProxy } from "rx-electron";
import { ipcMain as ipc } from "electron";

const channel = "some-identifier"; // must match the channel of renderer
createProxy({ channel, ipc, uuid }).subscribe((message) => {
  // Will receive "payload" (from the report above)
  // `message` = "foo"
  console.log(`Message From Renderer: ${message}`);
});
```

## TODO

1. Upgrade to RxJS v6. At the moment, I'm consuming this in an app that requires RxJS v5.
