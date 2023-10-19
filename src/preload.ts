/* eslint-disable @typescript-eslint/no-explicit-any */
// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { IpcRendererEvent, contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNEL_NAMES } from "./const";

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

contextBridge.exposeInMainWorld("command", {
  ping: () => ipcRenderer.invoke(IPC_CHANNEL_NAMES.PING),
});

contextBridge.exposeInMainWorld("electronAPI", {
  setTitle: (title: string) =>
    ipcRenderer.send(IPC_CHANNEL_NAMES.SET_TITLE, title),
  openFile: () => ipcRenderer.invoke(IPC_CHANNEL_NAMES.DIALOG.OPEN_FILE),
  /**
   * Using ipcRenderer.send in two-way communication
   */
  ping: () => ipcRenderer.send(IPC_CHANNEL_NAMES.ASYNC_MSG, "ping"),

  onUpdateCounter: (callback: (event: IpcRendererEvent, val: number) => void) =>
    ipcRenderer.on(IPC_CHANNEL_NAMES.WEB_CONTENTS.UPDATE_COUNTER, callback),
});

// Using ipcRenderer.send (Renderer to main - two way)
// ipcRenderer.on(
//   IPC_CHANNEL_NAMES.ASYNC_REPLY,
//   (_event: IpcRendererEvent, arg: string) => {
//     console.log("arg:", arg, "in web contents");
//   }
//   );

// Using ipcRenderer.sendSync (Renderer to main - two way)
// const result = ipcRenderer.sendSync(IPC_CHANNEL_NAMES.SYNC_MSG, "ping");
// console.log("result:", result, "in web contents");
