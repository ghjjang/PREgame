# 프로젝트 구조 및 파일 가이드

## 디렉토리 구조

```
/workspaces/ss/
│
├── index.html                  # 게임 진입점 HTML
├── package.json                # NPM 패키지 설정
├── README.md                   # 프로젝트 문서
├── STRUCTURE.md                # 이 파일 - 구조 설명
│
├── src/                        # 소스 코드
│   ├── game/                  # 게임 로직
│   │   ├── core/              # 핵심 게임 시스템
│   │   │   ├── Game.js        # 메인 게임 클래스 및 루프
│   │   │   ├── Camera.js      # 카메라 시스템 (TODO)
│   │   │   └── Input.js       # 입력 처리 시스템 (TODO)
│   │   │
│   │   ├── entities/          # 게임 개체
│   │   │   ├── Player.js      # 플레이어 엔티티 (TODO)
│   │   │   └── Enemy.js       # 적 엔티티 및 AI (TODO)
│   │   │
│   │   ├── systems/           # 게임 시스템
│   │   │   ├── Combat.js      # 전투 시스템 (TODO)
│   │   │   ├── Spawn.js       # 스폰 시스템 (TODO)
│   │   │   └── Skills.js      # 스킬 시스템 (완료)
│   │   │
│   │   └── utils/             # 유틸리티
│   │       └── helpers.js     # 헬퍼 함수 (TODO)
│   │
│   ├── ui/                    # UI 컴포넌트
│   │   ├── HUD.js             # HUD 시스템 (TODO)
│   │   ├── Inventory.js       # 인벤토리 UI (TODO)
│   │   ├── TargetInfo.js      # 타겟 정보 UI (TODO)
│   │   └── Minimap.js         # 미니맵 (TODO)
│   │
│   └── renderer/              # 렌더링
│       └── Renderer.js        # 캔버스 렌더링 (TODO)
│
├── assets/                    # 게임 에셋
│   ├── images/               # 이미지 파일
│   │   ├── player.png
│   │   ├── dash.png
│   │   └── ...
│   ├── sounds/               # 사운드 파일 (TODO)
│   └── fonts/                # 폰트 파일 (TODO)
│
├── styles/                   # CSS 스타일
│   ├── main.css             # 메인 스타일 (캐릭터 패널, 바 등)
│   ├── ui.css               # UI 컴포넌트 스타일
│   └── inventory.css        # 인벤토리 스타일
│
└── javascript/              # 레거시 파일 (참조용)
    ├── Canvas.js            # 원본 통합 파일
    ├── Canvas.html
    ├── Canvas.css
    └── skills.js
```

## 파일별 설명

### 엔트리 포인트

#### `index.html`
- 게임의 메인 HTML 파일
- 모든 UI 요소 정의
- ES6 모듈로 Game.js 로드

### 소스 코드 (src/)

#### `src/game/core/Game.js` ⭐ 현재 작업 파일
- 메인 게임 클래스
- 게임 루프 관리
- 모든 시스템 통합 관리
- 현재 상태: 기존 Canvas.js의 기능을 임시로 통합
- TODO: 각 기능을 개별 모듈로 분리

#### `src/game/core/Camera.js` (TODO)
**역할**: 카메라 시스템
```javascript
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.smoothness = 0.1;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
    }
    
    follow(target, canvasWidth, canvasHeight) {
        // 타겟 추적 로직
    }
    
    shake(duration, intensity) {
        // 화면 흔들림
    }
    
    update(dt) {
        // 카메라 업데이트
    }
}
```

#### `src/game/core/Input.js` (TODO)
**역할**: 입력 처리 시스템
```javascript
export class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };
    }
    
    setupEventListeners() {
        // 키보드/마우스 이벤트 등록
    }
    
    isKeyDown(key) {
        return this.keys[key] || false;
    }
}
```

#### `src/game/entities/Player.js` (TODO)
**역할**: 플레이어 엔티티
```javascript
export class Player {
    constructor() {
        this.worldX = 0;
        this.worldY = 0;
        this.hp = 100;
        this.maxHp = 100;
        this.level = 1;
        this.xp = 0;
        // ... 기타 속성
    }
    
    update(dt, input) {
        // 플레이어 업데이트 로직
    }
    
    move(dx, dy) {
        // 이동 처리
    }
    
    takeDamage(amount) {
        // 피격 처리
    }
    
    levelUp() {
        // 레벨업 처리
    }
}
```

#### `src/game/entities/Enemy.js` (TODO)
**역할**: 적 엔티티 및 AI
```javascript
export class Enemy {
    constructor(x, y, type) {
        this.worldX = x;
        this.worldY = y;
        this.type = type; // 'normal' or 'charger'
        this.aiState = 'chase';
        // ... 기타 속성
    }
    
    update(dt, player) {
        // AI 업데이트
        if (this.type === 'charger') {
            this.updateChargerAI(dt, player);
        } else {
            this.updateNormalAI(dt, player);
        }
    }
}
```

#### `src/game/systems/Combat.js` (TODO)
**역할**: 전투 시스템
```javascript
export class CombatSystem {
    static performAttack(attacker, targets, range) {
        // 공격 처리
    }
    
    static checkCollision(entity1, entity2) {
        // 충돌 검사
    }
    
    static applyKnockback(entity, direction, force) {
        // 넉백 효과
    }
}
```

#### `src/game/systems/Spawn.js` (TODO)
**역할**: 적 스폰 시스템
```javascript
export class SpawnSystem {
    constructor(config) {
        this.spawnRadius = config.spawnRadius;
        this.despawnRadius = config.despawnRadius;
        this.maxEnemies = config.maxEnemies;
        // ...
    }
    
    update(dt, player, enemies) {
        // 스폰/디스폰 로직
    }
    
    spawnEnemy(x, y, type) {
        // 적 생성
    }
}
```

#### `src/game/systems/Skills.js` ✅ 완료
**역할**: 스킬 시스템 (대시, 공격 등)
- ES6 모듈로 변환 완료
- export/import 사용

### UI 컴포넌트 (src/ui/) - 모두 TODO

#### `src/ui/HUD.js`
**역할**: 플레이어 상태 UI 관리
```javascript
export class HUD {
    updateHP(current, max) { }
    updateStamina(current, max) { }
    updateXP(current, next) { }
    updateLevel(level) { }
}
```

#### `src/ui/Inventory.js`
**역할**: 인벤토리 시스템
```javascript
export class Inventory {
    constructor() {
        this.items = [];
        this.equipment = {};
    }
    
    toggle() { }
    addItem(item) { }
    removeItem(item) { }
    equipItem(item, slot) { }
}
```

#### `src/ui/TargetInfo.js`
**역할**: 타겟 정보 표시
```javascript
export class TargetInfo {
    update(enemy) { }
    show() { }
    hide() { }
}
```

#### `src/ui/Minimap.js`
**역할**: 미니맵 렌더링
```javascript
export class Minimap {
    constructor(canvas, ctx) { }
    draw(player, enemies) { }
}
```

### 렌더링 (src/renderer/)

#### `src/renderer/Renderer.js` (TODO)
**역할**: 캔버스 렌더링 통합
```javascript
export class Renderer {
    constructor(canvas, ctx) { }
    
    drawGrid() { }
    drawPlayer(player, camera) { }
    drawEnemies(enemies, camera) { }
    drawParticles(particles) { }
    drawFloatTexts(texts) { }
}
```

### 스타일 (styles/)

#### `styles/main.css`
- body, canvas 기본 스타일
- 캐릭터 정보 패널
- HP/SP/XP 바 스타일

#### `styles/ui.css`
- 핫바 (퀵슬롯)
- 하단 스탯 버튼
- 타겟 정보 UI
- 미니맵

#### `styles/inventory.css`
- 인벤토리 오버레이
- 장비 슬롯
- 아이템 그리드

## 마이그레이션 계획

### Phase 1: 구조 정리 ✅
- [x] 디렉토리 구조 생성
- [x] CSS 분리 (main.css, ui.css, inventory.css)
- [x] Skills.js ES6 모듈 변환
- [x] 메인 HTML 생성 (index.html)
- [x] README 작성

### Phase 2: 핵심 시스템 분리 (진행 중)
- [x] Game.js 임시 통합 버전 생성
- [ ] Camera.js 분리
- [ ] Input.js 분리
- [ ] Player.js 분리
- [ ] Enemy.js 분리

### Phase 3: 시스템 모듈화
- [ ] CombatSystem 분리
- [ ] SpawnSystem 분리
- [ ] LevelSystem 분리
- [ ] EffectSystem (파티클 등) 분리

### Phase 4: UI 모듈화
- [ ] HUD 분리
- [ ] Inventory 분리
- [ ] TargetInfo 분리
- [ ] Minimap 분리

### Phase 5: 렌더링 최적화
- [ ] Renderer 클래스 생성
- [ ] 레이어 시스템 구현
- [ ] 최적화 (오프스크린 렌더링 등)

### Phase 6: 기능 확장
- [ ] 아이템 시스템
- [ ] 장비 시스템
- [ ] 스킬 트리
- [ ] 저장/불러오기

## 모듈 import/export 패턴

### ES6 모듈 사용
```javascript
// export
export class Player { }
export const CONFIG = { };
export function helper() { }
export default Game;

// import
import Game from './core/Game.js';
import { Player } from './entities/Player.js';
import { CONFIG, helper } from './utils/helpers.js';
```

### 주의사항
- 브라우저에서 ES6 모듈 사용 시 `<script type="module">` 필요
- 상대 경로 import 시 `.js` 확장자 명시
- CORS 정책으로 로컬 파일 시스템에서 직접 열기 불가
- HTTP 서버 필요 (개발 서버 사용)

## 개발 서버 실행

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000

# VS Code Live Server 확장 사용
```

## 코드 스타일 가이드

- 클래스명: PascalCase (Player, Enemy, CombatSystem)
- 변수/함수: camelCase (updatePlayer, gameLoop)
- 상수: UPPER_SNAKE_CASE (MAX_ENEMIES, SPAWN_RADIUS)
- 파일명: PascalCase.js (Game.js, Player.js)
- 주석: JSDoc 스타일 권장

## 다음 단계

1. **Camera.js 분리**: Game.js의 카메라 로직을 독립 클래스로
2. **Player.js 분리**: 플레이어 관련 모든 로직을 엔티티 클래스로
3. **Enemy.js 분리**: 적 AI 로직을 독립 클래스로
4. **Game.js 리팩토링**: 각 모듈을 import하여 통합 관리만 수행

## 참고사항

- 기존 javascript/ 폴더는 참조용으로 보존
- 점진적 마이그레이션 (한 번에 모든 것을 변경하지 않음)
- 각 단계마다 테스트하여 동작 확인
