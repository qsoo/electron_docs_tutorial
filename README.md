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

app이 window에 표시하는 각 웹 페이지는 `renderer process`하는 별도의 process에서 실행된다. Renderer에서는 일반적인 FE 개발에서 사용하는 JavaScript API 및 tooling에 access 가능하다.

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
