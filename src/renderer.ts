/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */
import { IpcRendererEvent } from "electron";
import { IPC_CHANNEL_NAMES } from "./const";

type Versions = {
  node: () => string;
  chrome: () => string;
  electron: () => string;
};

type Commands = {
  ping: () => Promise<string>;
};

type ElectronAPIs = {
  setTitle: (title: string) => Promise<void>;
  openFile: () => Promise<string>;
  ping: () => void;
  onUpdateCounter: (
    callback: (event: IpcRendererEvent, value: number) => unknown
  ) => unknown;
};

// @ts-expect-error
const versions: Versions = window.versions;
// @ts-expect-error
const commands: Commands = window.command;
// @ts-expect-error
const electronAPI: ElectronAPIs = window.electronAPI;

const information = document.getElementById("info");

// Display the information in the HTML element
information.innerText = `Node.js: ${versions.node()}, Chrome: ${versions.chrome()}, Electron: ${versions.electron()}`;

async function pingFunc() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const response = await commands.ping();
  // console.log("response:", response);
}

pingFunc();

// pattern-1-renderer-to-main-one-way
const setBtn = document.getElementById("btn-title");
const titleInput = document.getElementById("title");

setBtn.addEventListener("click", () => {
  const title = (titleInput as HTMLInputElement).value;
  electronAPI.setTitle(title);
});

// pattern-2-renderer-to-main-two-way
const openFileBtn = document.getElementById("btn-file");
const filePathEl = document.getElementById("file-path");

openFileBtn.addEventListener("click", async () => {
  const filePath = await electronAPI.openFile();
  filePathEl.innerText = filePath;
});

electronAPI.ping();

// Pattern 3: Main to renderer
const counter = document.getElementById("counter");

electronAPI.onUpdateCounter((event: IpcRendererEvent, value: number) => {
  const oldVal = Number(counter.innerText);
  const newVal = oldVal + value;

  counter.innerText = newVal.toString();
  // Returing a reply
  event.sender.send(IPC_CHANNEL_NAMES.WEB_CONTENTS.COUNTER_VALUE, newVal);
});
