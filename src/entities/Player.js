/**
 * Player.js
 * 플레이어 엔티티 클래스 (Phaser 3)
 */

import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player-idle');
        
        // Scene에 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스케일 설정 - 픽셀 퍼펙트를 위해 정수 배율 권장
        // original sprites were 16x16 scaled x6; new sheets are 48x48 scaled x2 to preserve size
        this.setScale(2);
        this.setOrigin(0.5, 0.5);

        // Physics 설정
        this.setCollideWorldBounds(false);
        this.body.setSize(12, 12);
        this.body.setOffset(2, 4);

        // 플레이어 속성
        this.stats = {
            level: 1,
            hp: 100,
            maxHp: 100,
            sp: 100,
            maxSp: 100,
            xp: 0,
            maxXp: 100,
            attack: 10, 
            attackSpeed: 1.2, // 초당 공격 횟수
            defense: 5,
            speed: 200,
            dashSpeed: 400
        };

        // 스킬 상태
        this.isDashing = false;
        this.isAttacking = false;
        this.invincible = false;
        
        this.dashCooldown = 0;
        this.attackCooldown = 0;
        this.dashDuration = 0;
        this.invincibleTimer = 0;

        // 방향
        this.direction = 'down';
        this.lastDirection = 'down';
        
        // UI 상태
        this.inventoryOpen = false;
        this.settingsOpen = false;

        // 입력 설정
        this.setupInput(scene);

        // 애니메이션 전환 시 앵커 보정 (공격/대시 등 여백 많은 시트 대비)
        this._setupAnimationAnchors();

        // 방향별 앵커 보정 강도 (필요 시 조정)
        this._anchorConfig = {
            default: { ox: 0.5, oy: 0.5 },
            padded: { dx: 0.02, oy: 0.6 }, // dash에만 적용
            dash: { forward: 12 } // 대시 시 실제 위치 전진(애니메이션 시작 시)
        };
    }

    setupInput(scene) {
        this.keys = scene.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            I: Phaser.Input.Keyboard.KeyCodes.I,
            ESC: Phaser.Input.Keyboard.KeyCodes.ESC
        });
        
        // 인벤토리 토글 (I 키)
        scene.input.keyboard.on('keydown-I', () => {
            this.toggleInventory();
        });

        // 히트박스 표시 (H 키)
        scene.input.keyboard.on('keydown-H', () => {
            scene.showHitboxes = !scene.showHitboxes;
            scene.physics.world.drawDebug = scene.showHitboxes;
            if (!scene.showHitboxes) {
                scene.physics.world.debugGraphic.clear();
            }
        });

        // 마우스 클릭 (공격)
        scene.input.on('pointerdown', (pointer) => {
            if (!this.isAttacking && this.attackCooldown <= 0 && !this.inventoryOpen && !this.settingsOpen) {
                this.attack(pointer);
            }
        });
    }

    update(time, delta) {
        const dt = delta / 1000;

        // 쿨다운 타이머 업데이트
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        
        // dashDuration logic removed as it is handled by delayedCall in dash()
        if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

        // 무적 종료
        if (this.invincible && this.invincibleTimer <= 0) {
            this.invincible = false;
            this.setAlpha(1);
        }

        // 무적 깜빡임
        if (this.invincible) {
            this.setAlpha((Math.sin(time * 0.02) + 1) / 2);
        }

        // 공격 입력 처리 (마우스 홀드 지원)
        if (this.scene.input.activePointer.isDown) {
             if (!this.isAttacking && this.attackCooldown <= 0 && !this.inventoryOpen && !this.settingsOpen) {
                this.attack(this.scene.input.activePointer);
            }
        }

        // 이동 처리
        this.handleMovement();
    }

    handleMovement() {
        // 인벤토리나 설정이 열려있으면 이동 불가
        if (this.inventoryOpen || this.settingsOpen) {
            this.setVelocity(0, 0);
            this.anims.play(`idle`, true);
            return;
        }

        // 대시 중이면 이동 입력 무시 (대시 속도 유지)
        if (this.isDashing) return;
        
        const speed = this.stats.speed;
        let velocityX = 0;
        let velocityY = 0;
        let moving = false;

        // WASD 입력
        if (this.keys.W.isDown) {
            velocityY = -speed;
            this.direction = 'up';
            moving = true;
        }
        if (this.keys.S.isDown) {
            velocityY = speed;
            this.direction = 'down';
            moving = true;
        }
        if (this.keys.A.isDown) {
            velocityX = -speed;
            this.direction = 'left';
            moving = true;
            if (!this.flipX) {
                this.setFlipX(true);
                this._updateAnchorForCurrentAnim();
            }
        }
        if (this.keys.D.isDown) {
            velocityX = speed;
            this.direction = 'right';
            moving = true;
            if (this.flipX) {
                this.setFlipX(false);
                this._updateAnchorForCurrentAnim();
            }
        }

        // 대각선 이동 속도 보정
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707;
            velocityY *= 0.707;
        }

        // 대시 스킬
        if (this.keys.SHIFT.isDown && !this.isDashing && this.dashCooldown <= 0 && this.stats.sp >= 20) {
            this.dash();
        }

        // 속도 적용
        this.setVelocity(velocityX, velocityY);

        // 애니메이션
        if (this.isDashing) {
            // 대시 중에는 대시 애니메이션 유지 (dash()에서 재생됨)
        } else if (moving && !this.isAttacking) {
            this.anims.play(`walk`, true);
            this.lastDirection = this.direction;
        } else if (!this.isAttacking) {
            this.anims.play(`idle`, true);
        }
    }

    dash() {
        if (this.isDashing) return;
        
        // 자원 소모 및 쿨다운
        this.dashCooldown = 2; 
        this.stats.sp -= 20;
        this.scene.events.emit('playerDash', this);

        this.isDashing = true;

        const dashDistance = 300;   // 전진 거리
        const dashDuration = 300;   // 대시 지속 시간(ms)
        
        // 방향에 따라 전진 오프셋 계산
        let dx = 0, dy = 0;
        if (this.direction === 'right')  dx = dashDistance;
        else if (this.direction === 'left')   dx = -dashDistance;
        else if (this.direction === 'up')     dy = -dashDistance;
        else if (this.direction === 'down')   dy = dashDistance;
        else dy = dashDistance; // 기본값

        try { this.anims.play('dash', true); } catch (e) {}

        // 대시 애니메이션과 함께 실제 위치 이동 (트윈 사용)
        this.scene.tweens.add({
            targets: this,
            x: this.x + dx,
            y: this.y + dy,
            duration: dashDuration,
            ease: 'Power2',
            onComplete: () => {
                this.isDashing = false;
                try { this.anims.play('idle', true); } catch (e) {}
            }
        });
    }

    attack(pointer) {
        this.isAttacking = true;
        
        // 공격 속도에 따른 쿨다운 설정 (초 단위)
        this.attackCooldown = 1 / this.stats.attackSpeed;

        try { 
            this.anims.play('attack', true); 
            const currentAnim = this.anims.currentAnim;
            
            // 애니메이션 속도 조절 (공격 속도에 맞춤, 기본 1배)
            // 만약 공격 속도가 매우 빠르면 애니메이션도 빨라져야 함
            // 기본 애니메이션 지속시간이 쿨다운보다 길면 애니메이션 속도를 높임
            
            if (currentAnim) {
                // 현재 애니메이션의 총 프레임 수와 프레임 레이트 가져오기
                const totalFrames = currentAnim.frames.length;
                const defaultFrameRate = currentAnim.frameRate || 12;
                const defaultDuration = totalFrames / defaultFrameRate; // 초 단위

                // 공격 속도에 비례하여 애니메이션 속도 증가
                // 기본적으로 attackSpeed 배율을 따르되, 
                // 애니메이션 길이가 쿨다운보다 길어지는 경우(매우 긴 애니메이션)에는 쿨다운에 맞춰 더 빠르게 재생
                
                // 최소 요구 속도 (쿨다운 내에 재생 완료)
                const minTimeScale = defaultDuration / this.attackCooldown;
                
                // 공격 속도에 비례한 속도 (기본 1.0 * attackSpeed)
                const proportionalTimeScale = this.stats.attackSpeed;

                this.anims.timeScale = Math.max(proportionalTimeScale, minTimeScale);
            }

        } catch (e) {
            console.warn('Attack animation failed:', e);
        }

        // 공격 효과음 재생
        try {
            this.scene.sound.play('attackSound', { volume: 0.5 });
        } catch (e) {
            console.warn('Failed to play attack sound:', e);
        }

        // 캐릭터가 바라보는 방향으로 공격 (lastDirection 사용)
        let angle;
        switch(this.lastDirection) {
            case 'up':
                angle = -Math.PI / 2; // 위쪽
                break;
            case 'down':
                angle = Math.PI / 2; // 아래쪽
                break;
            case 'left':
                angle = Math.PI; // 왼쪽
                break;
            case 'right':
                angle = 0; // 오른쪽
                break;
            default:
                angle = Math.PI / 2; // 기본값: 아래
        }

        // 현재 위치 저장
        const startX = this.x;
        const startY = this.y;
      
        
        // 공격 판정
        this.scene.events.emit('playerAttack', {
            x: this.x,
            y: this.y,
            range: 100,
            damage: this.stats.attack,
            angle: angle
        });

        // 공격 애니메이션 종료
        this.once('animationcomplete-attack', () => {
            this.isAttacking = false;
            // 애니메이션 timeScale 초기화
            this.anims.timeScale = 1;
        });

        // Fallback: 애니메이션 이벤트가 발생하지 않을 경우를 대비한 안전장치
        // 쿨다운 + 0.1초로 넉넉하게 설정
        this.scene.time.delayedCall(this.attackCooldown * 1000 + 100, () => {
            if (this.isAttacking) {
                this.isAttacking = false;
                this.anims.timeScale = 1;
            }
        });
    }

    takeDamage(damage) {
        if (this.invincible) return;

        const actualDamage = Math.max(1, damage - this.stats.defense);
        this.stats.hp -= actualDamage;

        // 무적 시간
        this.invincible = true;
        this.invincibleTimer = 1; // 1초

        // 피격 이펙트
        this.scene.cameras.main.shake(100, 0.01);
        try { this.anims.play('hit', true); } catch (e) {}

        // 사망 체크
        if (this.stats.hp <= 0) {
            this.die();
        }

        // UI 업데이트 이벤트
        this.scene.events.emit('playerDamaged', this.stats);

        this.lastDamageTime = this.scene.time.now; // 현재 시간 기록
    }

    die() {
        this.stats.hp = 0;
        this.scene.events.emit('playerDied');
        
        try { this.anims.play('death', true); } catch (e) {}
        // 스폰 지점으로 리스폰
        this.scene.time.delayedCall(2000, () => {
            this.respawn();
        });
    }
    // 리스폰 처리
    respawn() {
        this.x = 0;
        this.y = 0;
        this.stats.hp = this.stats.maxHp;
        this.stats.sp = this.stats.maxSp;
        this.invincible = true;
        this.invincibleTimer = 3; // 3초 무적

        this.scene.events.emit('playerRespawned', this.stats);
        // 카메라 페이드인
        this.scene.cameras.main.fadeIn(1000);
        // 체력, 스태미나 완전 회복
        this.scene.events.emit('playerStatsChanged', this.stats);
        
    }
    // 경험치 획득
    gainXP(amount) {
        this.stats.xp += amount;

        if (this.stats.xp >= this.stats.maxXp) {
            this.levelUp();
        }

        this.scene.events.emit('playerXPGained', this.stats);
    }
    // 레벨업 처리
    levelUp() {
        this.stats.level += 1;
        this.stats.xp -= this.stats.maxXp;
        this.stats.maxXp = Math.floor(this.stats.maxXp * 1.5);

        // 스탯 증가
        this.stats.maxHp += 20;
        this.stats.maxSp += 10;
        this.stats.attack += 2;
        this.stats.defense += 1;

        // 체력 회복
        this.stats.hp = this.stats.maxHp;
        this.stats.sp = this.stats.maxSp;

        this.scene.events.emit('playerLevelUp', this.stats);
    }

    regenerate(dt) {
        // 스태미나 자동 회복
        if (this.stats.sp < this.stats.maxSp && !this.isDashing && !this.isAttacking) {
            this.stats.sp = Math.min(this.stats.maxSp, this.stats.sp + 5 * dt);
            this.scene.events.emit('playerStatsChanged', this.stats);
        }
    }
    // 체력 자동 회복
    regenerateHealth(dt) {
        // 마지막 피격으로부터 5초(5000ms)가 지났는지 확인
        const timeSinceLastDamage = this.scene.time.now - (this.lastDamageTime || 0);
        
        if (timeSinceLastDamage >= 5000 && this.stats.hp < this.stats.maxHp) {
            this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 2 * dt);
            this.scene.events.emit('playerStatsChanged', this.stats);
        }
    }
    // 인벤토리 토글
    toggleInventory() {
        this.inventoryOpen = !this.inventoryOpen;
        this.scene.events.emit('inventoryToggled', this.inventoryOpen);
        console.log('인벤토리:', this.inventoryOpen ? '열림' : '닫힘');
    }

    _setupAnimationAnchors() {
        // 애니메이션 시작/종료 시 원점 및 위치 보정
        const self = this;
        this.on('animationstart', (anim) => {
            const key = anim.key;
            self._applyAnchorForAnim(key);
            
            // 공격: 스프라이트 표시만 앞으로 이동 (world 위치는 유지, 시각적 오프셋만)
            
            // 대시: 위치 오프셋 제거 (애니메이션만 재생)
        });

        this.on('animationcomplete', (anim) => {
            const key = anim.key;
            if (key === 'attack' || key === 'dash') {
                // 기본 원점 복귀
                self.setOrigin(0.5, 0.5);
            }
            
            // 공격 종료: 스프라이트 위치 원복
            
            // 대시 종료: 시작 offset 복귀(트윈이 위치 제어하므로 추가 처리 불필요)
            if (key === 'dash' && self._dashStartOffset) {
                self._dashStartOffset = null;
            }
        });
    }

    _applyAnchorForAnim(key) {
        const isPadded = (key === 'dash');
        if (!isPadded) {
            this.setOrigin(this._anchorConfig.default.ox, this._anchorConfig.default.oy);
            return;
        }
        const dx = this._anchorConfig.padded.dx || 0;
        const oy = this._anchorConfig.padded.oy || 0.6;
        const ox = 0.5 + (this.flipX ? +dx : -dx);
        this.setOrigin(ox, oy);
        // 수평 위치 보정 제거: 공격은 forward offset으로 처리
    }

    _updateAnchorForCurrentAnim() {
        const current = this.anims && this.anims.currentAnim ? this.anims.currentAnim.key : null;
        if (current) {
            this._applyAnchorForAnim(current);
        }
    }
}
