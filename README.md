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
