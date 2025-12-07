# OpenWorld RPG - Phaser 3

> 2D 탑다운 오픈월드 RPG 게임 (Phaser 3 엔진)

## 🎮 프로젝트 구조

```
/workspaces/ss/
├── index.html              # 메인 HTML
├── vite.config.js          # Vite 번들러 설정
├── package.json            # NPM 의존성
│
├── src/
│   ├── main.js            # Phaser 게임 진입점
│   ├── scenes/            # Phaser Scene
│   └── systems/           # 게임 시스템
│
├── public/
│   └── assets/
```

## 🚀 실행 방법
npm run dev
```
브라우저가 자동으로 http://localhost:8000 열림

<!-- ModeManager and training mode removed -->
  - 대시 스킬 (Shift) - 스태미나 소모, 쿨다운
  - 공격 시스템 (마우스 클릭) - 범위 공격
  - 레벨/경험치/스탯 시스템
  - 피격/무적 시간/리스폰

- ✅ **적 AI**:
  - 동적 스폰/디스폰 시스템
  - 플레이어 추격 AI
  - 충돌 피격 처리

- ✅ **UI 시스템**:
  - HTML DOM 기반 UI (Phaser 외부)
  - HP/SP/XP 바 실시간 업데이트
  - 레벨 표시

## 🎮 조작법

| 키 | 기능 |
|---|---|
| **W A S D** | 8방향 이동 |
| **Shift** | 대시 (스태미나 20 소모, 3초 쿨다운) |
| **마우스 클릭** | 공격 (스태미나 10 소모) |
| **F3** | 디버그 모드 토글 |

## 🔧 기술 스택

- **Phaser 3.80.1**: 게임 엔진
- **Vite 5.0**: 모듈 번들러 & 개발 서버
- **ES6 Modules**: 모듈 시스템
- **Arcade Physics**: 물리 엔진
- **HTML/CSS**: UI 레이어

## 📝 Legacy 코드

기존 Vanilla JS Canvas 코드는 `/legacy` 폴더에 보존되어 있습니다:
- `legacy/javascript/Canvas.js` - 원본 게임 로직 (1474 lines)
- `legacy-src/` - 모듈화 시도했던 버전
- `legacy-index.html` - 원본 HTML

## 🎨 에셋

- 플레이어 스프라이트: 16x16 픽셀, 4방향 애니메이션
- 스케일: 5.5배 확대
- 타일맵: 무한 그리드 배경

## 🔮 향후 계획

- [ ] Enemy 클래스 분리 (현재 GameScene에 통합)
- [ ] 돌진형 적 AI 구현
- [ ] 타일맵 에디터 (Tiled) 통합
- [ ] 파티클 시스템 개선
- [ ] 인벤토리 UI (Phaser DOM 또는 React)
- [ ] 사운드/음악
- [ ] 세이브/로드 시스템
- [ ] 멀티플레이어 (Socket.io)

## 모드 전환 (현재)

이 저장소는 단일 GameScene 기반 SPA로 동작하도록 통합되었습니다.
훈련 모드(`training`)는 더 이상 지원되지 않으며, 앱은 `BootScene`에서 `GameScene`을 시작합니다.

참고: `src/state/ModeManager.js`는 하위 호환성을 위해 최소한의 API를 유지하지만, 훈련 모드 관련 로직 및 스냅샷 기능은 제거되었습니다.

## 📄 라이선스

MIT License
