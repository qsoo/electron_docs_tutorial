# Electron Tutorial

> [Electron Docs Tutorial](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)을 진행하면서 배운 내용을 정리한다.

## Prerequisites

[Electron Forge](https://www.electronforge.io/) like CRA

## Building your First App

Electron은 종속성 관리 시 devDependencies에 설치하는 이유

- Q. Production Code에서 Electron APIs를 사용하는데 왜?
  - packaging된 App은 Electron binary와 함께 Bundling된다.
- 배포 크기 감소
