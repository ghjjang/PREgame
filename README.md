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
│   │   ├── BootScene.js   # 에셋 로딩
│   │   ├── GameScene.js   # 메인 게임플레이
│   │   └── UIScene.js     # UI 오버레이
│   ├── entities/          # 게임 엔티티
│   │   └── Player.js      # 플레이어 클래스
│   └── systems/           # 게임 시스템
│
├── public/
│   └── assets/
│       └── images/        # 게임 이미지 에셋
│
└── legacy/                # 기존 Vanilla JS 코드 (참고용)
```

## 🚀 실행 방법

### 개발 모드
```bash
npm run dev
```
브라우저가 자동으로 http://localhost:8000 열림

### 빌드
```bash
npm run build
```
`dist/` 폴더에 프로덕션 빌드 생성

## 🎯 주요 기능

### Phaser 3 엔진 기능
- ✅ **Physics Engine**: Arcade Physics로 자동 충돌 처리
- ✅ **애니메이션 시스템**: 플레이어 4방향 걷기/정지 애니메이션
- ✅ **Scene 관리**: Boot → Game → UI 계층 구조
- ✅ **카메라 시스템**: 부드러운 플레이어 추적
- ✅ **이벤트 시스템**: Scene 간 통신

### 게임 시스템
- ✅ **플레이어**: 
  - 8방향 이동 (WASD)
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

## ModeManager 및 모드 전환

게임 모드는 이제 `ModeManager` 싱글톤으로 메모리 내에서 관리됩니다. 이는 URL 기반 리다이렉트 대신, 앱 내에서 즉시 씬 전환 및 UI 반영을 가능하게 합니다.

주요 기능:
- URL 기반 초기화와 브라우저 주소창 동기화(pushState)
- `ModeManager.on('modeChanged')` 이벤트로 씬/시스템 간 모드 전파
- `ModeManager.enableUrlSync({pushHistory: true})`로 주소 바 동기화 켜기

팁: 훈련/일반 모드 전환 버튼을 클릭할 때 Shift 키를 함께 누르면 "초기화 옵션"(resetPlayerState)을 활성화하여 플레이어 상태를 초기화한 뒤 훈련 모드로 들어가고, 돌아올 때 원래 상태로 복원합니다.

자세한 사용법은 `docs/MODE_MANAGER.md`를 참고하세요.

## 📄 라이선스

MIT License
