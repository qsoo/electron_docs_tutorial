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

type Versions = {
  node: () => string;
  chrome: () => string;
  electron: () => string;
};

type Commands = {
  ping: () => Promise<string>;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const versions: Versions = window.versions;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const commands: Commands = window.command;

const information = document.getElementById("info");

// Display the information in the HTML element
information.innerText = `Node.js: ${versions.node()}, Chrome: ${versions.chrome()}, Electron: ${versions.electron()}`;

async function pingFunc() {
  const response = await commands.ping();
  console.log("response:", response);
}

pingFunc();
