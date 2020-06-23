# RxJS Utilities for Electron

## Modules

### Proxy Observables

Create an `Observable` in one process, and remotely observe it from another.

```javascript
/** In Renderer Process (nodeIntegration enabled) */
import "rx-electron";
import { ipcRenderer as ipc } from "electron";

const channel = "some-identifier";
of("foo")
  .proxify({ ipc, channel })
  .subscribe((message) => console.log(`Routed { ${message} } to main`));

/** In Main Process */
import { createProxy } from "rx-electron";
import { ipcMain as ipc } from "electron";

const channel = "some-identifier"; // must match the channel of renderer
createProxy({ channel, ipc }).subscribe((message) => {
  console.log(`Message From Renderer: ${message}`);
});
```

## TODO

1. Upgrade to RxJS v6. At the moment, I'm consuming this in an app that requires RxJS v5.
