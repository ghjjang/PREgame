# Phaser 3 초보자 가이드

## 🎮 Phaser 3가 뭔가요?

Phaser는 HTML5 게임을 쉽게 만들 수 있는 **JavaScript 게임 프레임워크**입니다.
기존에 직접 Canvas API로 작성했던 복잡한 코드를 훨씬 간단하게 만들어줍니다.

## 📚 핵심 개념 (5분 설명)

### 1️⃣ Scene (씬) = 게임의 화면
Scene은 게임의 각 "장면"을 의미합니다. 메뉴 화면, 게임 화면, 게임오버 화면 등을 각각 Scene으로 만듭니다.

**우리 게임의 Scene:**
```
BootScene   → 로딩 화면 (이미지 불러오기)
GameScene   → 실제 게임 플레이
UIScene     → UI (체력바, 경험치바)
```

**Scene의 생명주기:**
```javascript
class MyScene extends Phaser.Scene {
    preload() {
        // 1. 이미지, 사운드 등을 미리 불러옴
        this.load.image('player', 'player.png');
    }
    
    create() {
        // 2. 게임 오브젝트 생성 (딱 한 번만 실행)
        this.player = this.add.sprite(100, 100, 'player');
    }
    
    update() {
        // 3. 매 프레임마다 실행 (초당 60번)
        this.player.x += 1; // 플레이어가 오른쪽으로 이동
    }
}
```

### 2️⃣ Sprite (스프라이트) = 게임 캐릭터/오브젝트
화면에 보이는 모든 것(플레이어, 적, 아이템)은 Sprite입니다.

**간단한 예시:**
```javascript
// 일반 스프라이트 생성
this.player = this.add.sprite(x, y, '이미지키');

// 물리 엔진이 적용된 스프라이트
this.player = this.physics.add.sprite(x, y, '이미지키');
this.player.setVelocity(100, 0); // 오른쪽으로 이동
```

### 3️⃣ Physics (물리 엔진) = 충돌, 중력 등 자동 처리
Arcade Physics를 사용하면 충돌, 속도, 가속도를 쉽게 다룰 수 있습니다.

**예시:**
```javascript
// 속도 설정
this.player.setVelocity(100, -200); // x축 100, y축 -200 속도

// 충돌 감지
this.physics.add.overlap(player, enemy, () => {
    console.log('플레이어가 적과 부딪혔다!');
});
```

### 4️⃣ Input (입력) = 키보드, 마우스
```javascript
// 키보드
this.cursors = this.input.keyboard.createCursorKeys();
if (this.cursors.left.isDown) {
    this.player.x -= 5;
}

// 특정 키
this.keys = this.input.keyboard.addKeys({
    W: 'W',
    SPACE: 'SPACE'
});
if (this.keys.W.isDown) { }

// 마우스 클릭
this.input.on('pointerdown', (pointer) => {
    console.log('클릭 위치:', pointer.x, pointer.y);
});
```

### 5️⃣ Animation (애니메이션) = 스프라이트 움직임
```javascript
// 애니메이션 생성 (create()에서 한 번만)
this.anims.create({
    key: 'walk',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1 // 무한 반복
});

// 애니메이션 재생
this.player.anims.play('walk');
```

## 🎯 우리 게임 코드 해석

### **src/main.js** - 게임 시작점
```javascript
const config = {
    type: Phaser.AUTO,          // WebGL 또는 Canvas 자동 선택
    width: window.innerWidth,   // 게임 너비
    height: window.innerHeight, // 게임 높이
    physics: {                  // 물리 엔진 설정
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }   // 중력 없음 (탑다운 게임)
        }
    },
    scene: [BootScene, GameScene, UIScene] // Scene 순서
};

const game = new Phaser.Game(config); // 게임 시작!
```

### **src/entities/Player.js** - 플레이어 클래스
```javascript
export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player'); // 부모 클래스 호출
        
        scene.add.existing(this);      // Scene에 추가
        scene.physics.add.existing(this); // 물리 적용
        
        this.setScale(5.5); // 크기 5.5배
        
        // 스탯
        this.stats = {
            hp: 100,
            maxHp: 100,
            speed: 200
        };
    }
    
    update(time, delta) {
        // 이동 로직
        if (this.keys.W.isDown) {
            this.setVelocityY(-this.stats.speed);
        }
    }
}
```

### **src/scenes/GameScene.js** - 게임 Scene
```javascript
export default class GameScene extends Phaser.Scene {
    create() {
        // 플레이어 생성
        this.player = new Player(this, 0, 0);
        
        // 카메라가 플레이어 따라가기
        this.cameras.main.startFollow(this.player);
        
        // 적 그룹
        this.enemies = this.physics.add.group();
        
        // 충돌 감지
        this.physics.add.overlap(
            this.player,    // 플레이어와
            this.enemies,   // 적들이
            this.hitEnemy,  // 부딪히면 이 함수 실행
            null,
            this
        );
    }
    
    update(time, delta) {
        this.player.update(time, delta); // 플레이어 업데이트
    }
    
    hitEnemy(player, enemy) {
        console.log('적과 충돌!');
    }
}
```

## 🛠️ 자주 쓰는 Phaser 함수들

### 오브젝트 생성
```javascript
// 이미지
this.add.image(x, y, '키');

// 스프라이트
this.add.sprite(x, y, '키');

// 물리 스프라이트
this.physics.add.sprite(x, y, '키');

// 텍스트
this.add.text(x, y, '안녕하세요', { fontSize: '32px', color: '#fff' });

// 도형
this.add.circle(x, y, 반지름, 색상);
this.add.rectangle(x, y, 너비, 높이, 색상);
```

### 속성 변경
```javascript
sprite.setPosition(x, y);      // 위치
sprite.setScale(2);            // 크기 2배
sprite.setAlpha(0.5);          // 투명도 50%
sprite.setTint(0xff0000);      // 빨간색으로 색칠
sprite.setVisible(false);      // 숨기기
sprite.destroy();              // 삭제
```

### 타이머
```javascript
// 1초 후 실행
this.time.delayedCall(1000, () => {
    console.log('1초 지났다!');
});

// 반복 실행
this.time.addEvent({
    delay: 1000,      // 1초마다
    callback: () => {
        console.log('1초마다 실행');
    },
    loop: true        // 무한 반복
});
```

## 📝 현재 게임에서 수정하려면?

### 플레이어 속도 바꾸기
**파일:** `src/entities/Player.js`
```javascript
// 24번째 줄 근처
this.stats = {
    speed: 200,     // 이 숫자를 바꾸면 됩니다 (200 → 300)
    dashSpeed: 400  // 대시 속도
};
```

### 적 스폰 간격 바꾸기
**파일:** `src/scenes/GameScene.js`
```javascript
// 46번째 줄 근처
this.spawnInterval = 3; // 3초마다 → 1초로 바꾸면 더 자주 스폰
```

### 공격 범위 바꾸기
**파일:** `src/entities/Player.js`
```javascript
// 172번째 줄 근처
attack(pointer) {
    const attackRange = this.scene.add.circle(this.x, this.y, 50, ...);
    //                                                          ↑
    //                                              이 숫자가 범위입니다
}
```

### 적 체력 바꾸기
**파일:** `src/scenes/GameScene.js`
```javascript
// 113번째 줄 근처
enemy.enemyData = {
    hp: 50,      // 적 체력 (50 → 100으로 바꾸면 더 강해짐)
    maxHp: 50,
    attack: 5,   // 적 공격력
    speed: 100   // 적 이동속도
};
```

## 🎓 Phaser 배우기

### 공식 튜토리얼 (추천!)
1. **Making your first game**: https://phaser.io/tutorials/making-your-first-phaser-3-game
2. **공식 예제**: https://phaser.io/examples (1000개 이상!)

### 자주 보게 될 문서
- **Sprite API**: https://photonstorm.github.io/phaser3-docs/Phaser.GameObjects.Sprite.html
- **Physics API**: https://photonstorm.github.io/phaser3-docs/Phaser.Physics.Arcade.Sprite.html
- **Scene API**: https://photonstorm.github.io/phaser3-docs/Phaser.Scene.html

## 💡 팁

1. **`this`가 헷갈리면**: Scene 안에서 `this`는 항상 Scene 자신을 가리킵니다
2. **좌표계**: (0, 0)이 왼쪽 위, x는 오른쪽, y는 아래
3. **에러 나면**: 브라우저 F12 → Console 탭에서 에러 메시지 확인
4. **변경 후**: 브라우저 새로고침 (Ctrl+R) 또는 Vite가 자동으로 반영

## 🚀 다음 단계

현재 게임은 **기본 동작이 모두 구현**되어 있습니다:
- ✅ 플레이어 이동/대시/공격
- ✅ 적 스폰/AI/충돌
- ✅ UI 업데이트

**당신이 할 일:**
1. 게임 플레이해보기 (WASD 이동, Shift 대시, 클릭 공격)
2. 숫자 몇 개 바꿔보기 (위의 예시 참고)
3. 원하는 기능 말씀해주시면 제가 코드로 보여드립니다!

**자주 원하는 것들:**
- 적 종류 추가하기
- 스킬 추가하기
- 아이템 시스템
- 타일맵 (예쁜 맵)
- 파티클 효과
- 사운드/음악

## ❓ 질문 예시

> "적이 총알을 쏘게 하고 싶어요"
> → 제가 Bullet 클래스 만들어드립니다

> "아이템을 먹으면 체력이 회복되게 하고 싶어요"
> → Item 클래스와 충돌 처리 만들어드립니다

> "맵에 나무를 심고 싶어요"
> → Tiled 맵 에디터 사용법 알려드립니다

뭐든 물어보세요! 😊
