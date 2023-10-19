# Electron Tutorial

## Table of Contents

- [Electron Tutorial](#electron-tutorial)
  - [Table of Contents](#table-of-contents)
  - [Tutorial](#tutorial)
    - [Prerequisites](#prerequisites)
    - [Building your First App](#building-your-first-app)
      - [Loading a web page into a BrowserWindow](#loading-a-web-page-into-a-browserwindow)
      - [Managing your app's window lifecycle](#managing-your-apps-window-lifecycle)
    - [Using Preload Scripts](#using-preload-scripts)
      - [What is prelaod script?](#what-is-prelaod-script)
      - [Augmenting the renderer with a preload script](#augmenting-the-renderer-with-a-preload-script)
      - [Communicating between processes](#communicating-between-processes)
    - [Adding Features](#adding-features)
    - [Packaging Your Application](#packaging-your-application)
    - [Publishing and Updating](#publishing-and-updating)
  - [Processes in Electron](#processes-in-electron)
    - [Process Model](#process-model)
      - [Why not a single process?](#why-not-a-single-process)
      - [The multi-process model](#the-multi-process-model)
      - [The main process](#the-main-process)
        - [Window management](#window-management)
        - [Application lifecycle](#application-lifecycle)
        - [Native APIs](#native-apis)
      - [The renderer process](#the-renderer-process)
      - [Preload scripts](#preload-scripts)
      - [The utility process](#the-utility-process)
      - [Process-specific module aliases (TypeScript)](#process-specific-module-aliases-typescript)
    - [Context Isolation](#context-isolation)
      - [What is it?](#what-is-it)
      - [Migration](#migration)
        - [Before: context isolation disabled](#before-context-isolation-disabled)
        - [After: context isolation enabled](#after-context-isolation-enabled)
      - [Security considerations](#security-considerations)
      - [Usage with TypeScript](#usage-with-typescript)
    - [Inter-Process Communication](#inter-process-communication)
      - [IPC channels](#ipc-channels)
      - [Understanding context-isolated processes](#understanding-context-isolated-processes)
      - [Pattern 1: Renderer to main (one-way)](#pattern-1-renderer-to-main-one-way)
      - [Pattern 2: Renderer to main (two-way)](#pattern-2-renderer-to-main-two-way)
        - [Note: legacy approaches](#note-legacy-approaches)
          - [Using `ipcRenderer.send`](#using-ipcrenderersend)
          - [Using `ipcRenderer.sendSync`](#using-ipcrenderersendsync)
      - [Pattern 3: Main to renderer](#pattern-3-main-to-renderer)
        - [Optional: returning a reply](#optional-returning-a-reply)
      - [Pattern 4: Renderer to renderer](#pattern-4-renderer-to-renderer)
      - [Object serialization](#object-serialization)
    - [Process Sandboxing](#process-sandboxing)
      - [Sandbox behaviour in Electron](#sandbox-behaviour-in-electron)
        - [Renderer processes](#renderer-processes)
        - [Preload scripts's environment](#preload-scriptss-environment)
      - [Configuring the sandbox](#configuring-the-sandbox)
        - [Disabling the sandbox for a single process](#disabling-the-sandbox-for-a-single-process)
        - [Enabling the sandbox globally](#enabling-the-sandbox-globally)
        - [Disabling Chromium's sandbox (testing only)](#disabling-chromiums-sandbox-testing-only)
      - [A note on rendering untrusted content](#a-note-on-rendering-untrusted-content)

## [Tutorial](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)

### Prerequisites

---

[Electron Forge](https://www.electronforge.io/) like CRA

### Building your First App

---

Electron은 종속성 관리 시 devDependencies에 설치하는 이유

- Q. Production Code에서 Electron APIs를 사용하는데 왜?
  - **packaging된 App은 Electron binary와 함께 Bundling된다.**
- 배포 크기 감소

package.json에 정의한 `main` script는 모든 Electron App의 entry point이다.

- main process를 control
- Node.js 환경에서 실행
- App의 lifecycle 제어
- native interface 표시
- 권한있는 작업 수행
- renderer processes 관리

#### Loading a web page into a BrowserWindow

\*barbones: 기초의, 뼈대의

```typescript
import { app, BrowserWindow } from "electron";
```

- app: app의 event lifecycle 제어
- BrowserWindow: app windows를 생성하고 관리
- ES Module은 Electron에서 자체적으로 지원하지 않음
  - Refer to: [#21457: Support Node's ES Modules, electron](https://github.com/electron/electron/issues/21457)

Module capitalization conventions

> Electron은 일반적인 JavaScript convention을 따름  
> PascalCase(instantiable) vs camelCase(Not instantiable)

Calling your function when the app is ready

```typescript
// Recommended
app.whenReady().then(() => {
  createWindow();
});
// Not recommended.
app.on("ready").then(() => {
  createWindow();
});
```

Electron에서는 app module의 ready event가 실행된 이후에만 BrowserWindows를 생성할 수 있다.

> emitter의 `on` function보다 whenReady API를 호출하는 이유는 다음과 같다.
>
> - edge case 방지
> - 다시 발생하지 않는 event를 listener에 남기지 않기 위해

**Electron의 core Modules 중 다수는 Node.js의 event emitter이다.**

- Node의 asynchromouse event-driven 구조를 준수한다.
- app module도 그러하다.

app이 window에 표시하는 각 웹 페이지는 `renderer process`라는 별도의 process에서 실행된다. Renderer에서는 일반적인 FE 개발에서 사용하는 JavaScript API 및 tooling에 access 가능하다.

#### Managing your app's window lifecycle

Application window는 OS별로 다르게 작동한다. Electron은 사용자가 원할 시 app code에서 규칙을 구현할 수 있는 선택권을 제공한다(app, BrowserWindow modules에서 emitted되는 event를 수신).

- PROCESS-SPECIFIC CONTROL FLOW: use [process.platform](https://nodejs.org/api/process.html#process_process_platform)

### Using Preload Scripts

---

#### What is prelaod script?

Electron의 main process는 전체 OS에 접근이 가능하다.

- e.g. Node.js built-ins, installed packages...
  이에 반해 renderer process의 경우 보안상의 이유로 기본적으로 Node.js를 실행하지 않는다.

따라서 서로 다른 process 유형을 연결하기 위해 `preload`라는 special script를 사용해야 한다.

#### Augmenting the renderer with a preload script

BrowserWindow의 preload script는 HTML DOM과 제한된 Node.js 및 Electron API에 접근할 수 있는 context에서 실행된다.  
\*process context: process의 현 상태를 나타내는데 필요한 모든 요소

- PRELOAD SCRIPT SANDBOXING
  - Electron 20 ↑에선 preload scripts가 sandboxed되었다.
    - Node.js 환경에 full access가 불가하다.
    - 제한된 API 집합에만 access할 수 있다.

\*sandbox: 외부로부터 들어온 프로그램이 보호된 영역에서 동작해 시스템이 부정하게 조작되는 것을 막는 보안 형태

|   Available API    | Details                                       |
| :----------------: | --------------------------------------------- |
|  Electron modules  | Renderer process modules                      |
|  Node.js modules   | events, timers, url                           |
| Polyfilled globals | Buffer, process, clearImmediate, setImmediate |

Preload scripts는 renderer에 web page가 load되기 전에 삽입된다.

#### Communicating between processes

Main과 Renderer process는 서로 다른 책임을 가지며 상호 교환이 불가하다.

- Renderer: Node.js API에 접근 불가
- Main: HTML DOM(Document Object Model)에 접근 불가

이 문제를 해결하고 IPC(inter-process communication)를 위해 **ipcMain과 ipcRenderer** modules를 사용

### Adding Features

---

이상으로 진행한 tutorial에서 두 가지 방향으로 개발을 진행할 수 있다.

- Renderer process의 Web App code를 추가
- OS 그리고 Node.js와 더 깊은 통합
  - tray icon 생성, global shortcuts 추가, 기본 메뉴 표시...
  - Main process에서 Node.js 환경의 모든 기능...
  - **이러한 기능은 Browser환경에서 website 실행하는 것과 Electron App을 구분해주는 핵심 기능이다**.

### Packaging Your Application

---

### Publishing and Updating

---

TODO

## [Processes in Electron](https://www.electronjs.org/docs/latest/tutorial/process-model)

### Process Model

---

Electron은 Chromium의 multi-process 구조를 물려 받아 구조적으로 최신 웹 브라우저와 매우 유사하다.

#### Why not a single process?

브라우저는 웹 콘텐츠를 보여주는 기본 기능 외에도 여러 windows(or tabs)을 관리하고 타사 확장 프로그램을 load하는 등의 부차적인 책임이 있다.

- 초기에는 single process을 사용
  - 열려 있는 각 tab에 대한 less overhead
  - 하나의 웹 사이트가 전체 브라우저에 영향

#### The multi-process model

![Chrome multi process architecture](/assets/images/chrome_multi_process_arch.png)

#### The main process

- Electron application에는 app의 entry point 역할을 하는 single main process가 존재한다.
- Node.js 환경에서 실행(Node.js API 사용 가능)

##### Window management

- Main process의 주요 목적은 BrowserWindow 모듈로 window를 생성하고 관리하는 것이다.
- BrowserWindow class의 각 instance는 별도의 renderer process를 통해 웹 페이지를 load하는 application window를 생성한다.
- main process에서 이 웹 콘텐츠와 상호작용하기 위해선 window의 `webContents` 객체를 이용한다.

```typescript
// main.ts
import { BrowserWindow } from "electron";

const win = new BrowserWindow({ width: 800, height: 1500 });
win.loadURL("https://github.com");

const contents = win.webContents;
console.log(contents);
```

BrowserWindow instance가 destroyed되면 이에 해당하는 renderer process도 종료된다.

##### Application lifecycle

Main process는 `app` module을 통해 application의 lifecycle을 제어한다.

##### Native APIs

Main process에는 사용자의 OS와 상호작용하는 custom API도 있다.

- Chromium wrapper for web contents 넘어서는 Electron 기능 확장을 위해
- native desktop 기능 제어(e.g. menus, dialogs, tray icons)

#### The renderer process

Electron App은 Open되어 있는 `BrowserWindow`(and each web embed)에 대해 별도의 renderer process를 생성한다.  
\*spawn: 새로운 child process를 load 또는 execute하는 기능

- 웹 콘텐츠의 rendering 담당
- 따라서 renderer process에서 실행되는 코드는 웹 표준을 준수해야 한다.
- Node.js APIs에 직접 접근 불가 → Bundler toolchains을 사용해야 한다(e.g. webpack).
  - Node.js 환경에서 spawn 가능(`nodeIntegration: true`)
    - default(false): 보안상의 이유

그렇다면 Renderer process는 어떻게 Node.js와 Electron's native desktop 기능과 상호 작용을 하는가? 실은 직접 Electron의 content scripts를 가져올 방법은 없다.

#### Preload scripts

`Preload scripts`에는 renderer process가 web content를 load하기 전에 실행되는 코드가 있다. 이 scripts는 renderer context 내에서 실행되지만 Node.js API에 대한 엑세스 권한을 통해 더 많은 권한이 부여된다. BrowserWindow 생성자의 `webPreferences` 옵션을 통해 main process에 첨부할 수 있다.

Preload script는 global `Window` 인터페이스를 renderers와 공유하고 Node.js APIs에 접근할 수 있게한다.

다만 직접 연결하지 않고(Context Isolation) ContextBridge module을 통해 안전하게 연결한다.

- `Context Isolation`: privileged APIs가 web content's code에 유출됨을 방지하기 위해 renderer's main world와 preload scripts를 분리한다.

```typescript
// preload.ts
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("myAPI", {
  desktop: true,
});

// renderer.ts
console.log(window.myAPI); // { desktop: true };
```

이 기능은 아래 2가지 목적에 유용하다.

> - ipcRenderer helper를 renderer에 노출하면 IPC를 사용하여 main ↔ renderer 상호 간의 task를 trigger할 수 있다.
> - remote URL에서 hosting되는 web app의 Electron wrapper를 개발하는 경우 client's side에서 desktop 전용 logic에 사용할 수 있는 custom properties를 renderer `window` global에 정의 가능

#### The utility process

Main process에서 여러 child processes를 생성할 때 `UtilityProcess API`를 사용할 수 있다(utility process는 Node.js 환경에서 실행).

사용 예시

- 신뢰할 수 없는 service hosting
- CPU 집약적인 작업
- 충돌이 발생하기 쉬운 구성 요소

Node.js의 child_process module에 의해 생성된 process와의 차이점은 utility process는 `MessagePorts`를 통해 renderer와 communication channel을 설정할 수 있다.

#### Process-specific module aliases (TypeScript)

- `electron/main`: all main process modules type
- `electron/renderer`: all renderer process modules type
- `electron/common`: main 및 renderer process에서 실행할 수 있는 module의 type

### Context Isolation

---

#### What is it?

Preload script와 electron 내부 logic을 webContents에서 load하는 website와 분리된 context에서 실행하는 기능을 말한다. 보안상의 이유로 website가 electron 내부 또는 preload script가 접근할 수 있는 powerful APIs를 방지한다.

#### Migration

##### Before: context isolation disabled

Preload script와 renderer process가 `window` 객체를 공유하여 사용

##### After: context isolation enabled

`contextBridge`를 사용하여 APIs를 안전하게 노출할 수 있다.

#### Security considerations

```typescript
// Bad
contextBridge.exposeInMainWorld("myAPI", {
  send: ipcRenderer.send,
});

// Good
contextBridge.exposeInMainWorld("myAPI", {
  loadPreferences: () => ipcRenderer.invoke("load-prefs"),
});
```

#### Usage with TypeScript

declaration file을 통해 type을 확장해야 한다.

```typescript
// renderer.d.ts
export interface IElectronAPI {
  loadPreferences: () => Promise<void>;
}

declare global {
  interface Window {
    myAPI: IElectronAPI;
  }
}
```

### Inter-Process Communication

---

IPC를 통해 main ↔ renderer 연결이 가능하므로 여러 가지 일반적인 작업을 수행하는 유일한 방법이기에 핵심 기능이다.

#### IPC channels

Electron에서 process는 개발자가 정의한 `channels`을 통해 메세지를 전달하여 ipcMain 및 ipcRenderer modules와 통신한다.

- arbitrary: you can name them anything you want
- bidirectional: yon can use the same channel name for both modules

#### Understanding context-isolated processes

#### Pattern 1: Renderer to main (one-way)

주로 web contents에서 main process API를 호출할 때 사용한다.

- `ipcRenderer.send`: send a message
- `ipcMain.on`: received

1. Listen for events with `ipcMain.on`

2. Expose `ipcRenderer.send` via preload

3. Build the renderer process UI

#### Pattern 2: Renderer to main (two-way)

renderer에서 main을 호출하고 응답을 기다리는 형태

- `ipcRenderer.invoke`
- `ipcMain.handle`

1. Listen for events with `ipcMain.handle`

2. Expose `ipcRenderer.invoke` via preload

3. Build the renderer process UI

##### Note: legacy approaches

`ipcRenderer.invoke` API는 Electron 7에서 양 방향 IPC를 처리하기 위해 추가되었다. 이 외에 대체 접근 방안이 있지만 가능하면 `ipcRenderer.invoke`를 사용하는 것이 좋다.

###### Using `ipcRenderer.send`

Electron 7 이 전 버전에서는 양 방향 통신 시 권장되는 방식이었다.

- 응답 처리를 위한 ipcRenderer.on listener를 설정해야 한다.
- message reply와 original message를 pairing할 수 있는 확실한 방법이 없다.

###### Using `ipcRenderer.sendSync`

Main process에 message를 보내고 응답을 synchromously하게 대기한다.
동기식이기 때문에 응답이 수신될 때까지 renderer process가 차단된다(성능상의 문제).

#### Pattern 3: Main to renderer

Main to renderer를 위해선 message를 수신할 renderer를 지정해야 한다. renderer로 message를 보내기 위해선 해당 `WebContents` instance를 통해야 한다. Webcontents instance는 `ipcRenderer.send`와 동일한 방식으로 사용할 수 있는 `send` method를 가지고 있다.

1. Send messages with the `webContents` module

2. Expose `ipcRenderer.on` via preload

3. Build the renderer process UI

##### Optional: returning a reply

Main to renderer에서 `ipcRenderer.invoke`에 해당하는 함수는 없다. 대신 `ipcRenderer.on` callback 내에서 main process로 다시 응답을 보낸다.

#### Pattern 4: Renderer to renderer

Render to render를 직접적으로 할 수 있는 방법은 없고 아래와 같은 대안이 있다.

- Main process를 renderer processes 사이의 message broker로 사용한다.
- Pass a `MessagePort`(initial setup 후 renderers 간 직접 통신 가능) from the main to renderers.

#### Object serialization

Electron IPC 구현은 HTML 표준 Structured Clone Algorithm을 사용하여 processes 간에 전달되는 객체를 직렬화 하므로 특정 유형의 객체만 IPC channels를 통해 전달할 수 있다. 예를 들면 DOM 객체, C++ class가 지원하는 Node.js 객체, C++ class가 지원하는 Electron 객체 등은 직렬화가 불가능하다.

### Process Sandboxing

---

Chromium의 주요 보안 기능 중 하나는 sandbox 내에서 processes를 실행하는 것이다. sandbox는 대부분의 시스템 리소스에 대한 접근을 제한하여 악성 코드로 인한 피해를 막는다. sandbox가 적용된 processes는 CPU 사이클과 메모리만 자유롭게 사용할 수 있다. 추가 권한이 필요할 작업을 수행하기 위해선 전용 통신 채널을 이용하여 더 많은 권한이 있는 process에 작업을 위임해야 한다.

Chromium에선 main process를 제외한 대부분의 process는 sandboxed

- 참고: Chromium's [Sandbox design document](https://chromium.googlesource.com/chromium/src/+/main/docs/design/sandbox.md)

Electron 20 이상에선 기본적으로 sandbox가 활성화되어 있고 비활성화할 수 있다.

#### Sandbox behaviour in Electron

대부분 Chromium과 동일하게 작동하지만 Node.js와 상호 작용하므로 고려해야 할 추가적인 개념이 있다.

##### Renderer processes

일반적인 Chrome renderer와 동일하게 작동한다. sandboxed된 renderer는 Node.js 환경이 초기화되지 않는다. 따라서 권한이 있는 작업은 IPC를 통해 main에 위임하여 수행한다.

##### Preload scripts's environment

Main과 통신할 수 있게 허용된 sandboxed renderer의 preload scripts엔 polyfilled된 Node.js APIs의 **하위 집합**을 사용할 수 있다.

require 함수는 기능이 제한된 polyfill이므로 preload script를 CommonJS modules를 사용하여 여러 개의 파일로 분리할 수 없다(bundler를 사용해야 한다).

Preload script의 환경은 sandboxed된 renderer보다 더 많은 권한을 가지므로 `contextIsolation`을 활성화하여 보안을 유지해야 한다.

#### Configuring the sandbox

##### Disabling the sandbox for a single process

Renderer sandboxing 비활성화 방법

- `BrowserWindow` 생성자에서 `sandbox: false` 옵션
- Node.js 통합을 활성화한다. BrowserWindow`생성자에서`nodeIntegration: true` 옵션

##### Enabling the sandbox globally

`app.enableSandbox` API를 사용하여 모든 renderer를 sandboxing한다.

- app's ready event 전에 호출되어야 한다.

```typescript
app.enableSandbox();
app.whenReady().then(() => {
  // do something
});
```

##### Disabling Chromium's sandbox (testing only)

`--no-sandbox` CLI flag를 사용한다. test 목적으로만 사용하길 권장한다. `sandbox: true` 옵션을 사용해도 renderer's Node.js 환경은 여전히 비활성화 상태이다.

#### A note on rendering untrusted content

Sandboxed된 contents의 보안 측면에서 최대한 Chrome과 같아지기 위해 개발진은 노력하고 있으나 몇 가지 근본적인 이유로 인해 어려움이 있다.

- (상대적으로) Chromium 전용 resource 부족
- Electron 목표에 반하는 중앙화된 권한과 전용 서버가 필요한 보안 기능들의 존재
- Chromium : Apps made by Electron = 1 : N이고 이로 인한 비정상적인 사용 사례가 존재
- 사용자에게 직접 보안 업데이트를 할 수 없음

이 전 Electron version에 Chromium의 보안 수정 사항을 backport하기 위해 노력하지만 latest stable version of electron을 사용하는 것이 최선이다.
\*backporting: 최신 버전에서 일부 가져와 이전 버전으로 이식
