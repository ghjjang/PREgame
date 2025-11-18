/**
 * Player.js
 * 플레이어 엔티티 클래스 (Phaser 3)
 */

import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        
        // Scene에 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 스케일 설정 - 픽셀 퍼펙트를 위해 정수 배율 권장
        this.setScale(6);

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
            defense: 5,
            speed: 200,
            dashSpeed: 400
        };

        // 스킬 상태
        this.isDashing = false;
        this.isAttacking = false;
        this.invincible = false;
        
        this.dashCooldown = 0;
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
            if (!this.isAttacking && !this.inventoryOpen && !this.settingsOpen) {
                this.attack(pointer);
            }
        });
    }

    update(time, delta) {
        const dt = delta / 1000;

        // 쿨다운 타이머 업데이트
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.dashDuration > 0) this.dashDuration -= dt;
        if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

        // 대시 종료
        if (this.isDashing && this.dashDuration <= 0) {
            this.isDashing = false;
        }

        // 무적 종료
        if (this.invincible && this.invincibleTimer <= 0) {
            this.invincible = false;
            this.setAlpha(1);
        }

        // 무적 깜빡임
        if (this.invincible) {
            this.setAlpha((Math.sin(time * 0.02) + 1) / 2);
        }

        // 이동 처리
        this.handleMovement();
    }

    handleMovement() {
        // 인벤토리나 설정이 열려있으면 이동 불가
        if (this.inventoryOpen || this.settingsOpen) {
            this.setVelocity(0, 0);
            this.anims.play(`idle-${this.lastDirection}`, true);
            return;
        }
        
        const speed = this.isDashing ? this.stats.dashSpeed : this.stats.speed;
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
        }
        if (this.keys.D.isDown) {
            velocityX = speed;
            this.direction = 'right';
            moving = true;
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
        if (moving && !this.isAttacking) {
            this.anims.play(`walk-${this.direction}`, true);
            this.lastDirection = this.direction;
        } else if (!this.isAttacking) {
            this.anims.play(`idle-${this.lastDirection}`, true);
        }
    }

    dash() {
        this.isDashing = true;
        this.dashDuration = 0.3; // 300ms
        this.dashCooldown = 2; // 2초
        this.stats.sp -= 20;

        // 대시 잔상 이펙트 (플레이어 따라다니지 않음)
        const startX = this.x;
        const startY = this.y;
        const dashEffect = this.scene.add.sprite(startX, startY, 'player', this.anims.currentFrame?.index || 0)
            .setScale(6)
            .setAlpha(0.5)
            .setTint(0x00ddff);
        
        // 페이드아웃 애니메이션
        this.scene.tweens.add({
            targets: dashEffect,
            alpha: 0,
            duration: 200,
            onComplete: () => dashEffect.destroy()
        });

        // 이벤트 발생
        this.scene.events.emit('playerDash', this);
    }

    attack(pointer) {
        this.isAttacking = true;

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

        // 공격 모션 - 공격 방향으로 빠르게 돌진
        const moveDistance = 40;
        const targetX = this.x + Math.cos(angle) * moveDistance;
        const targetY = this.y + Math.sin(angle) * moveDistance;
        
        // 돌진 모션
        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            
            duration: 80,
            ease: 'Quad.easeOut',
            onComplete: () => {
                // 복귀 모션
                this.scene.tweens.add({
                    targets: this,
                    x: startX,
                    y: startY,
                    scaleX: 6,
                    scaleY: 6,
                    duration: 120,
                    ease: 'Quad.easeIn'
                });
            }
        });

      
        
        // 공격 판정
        this.scene.events.emit('playerAttack', {
            x: this.x,
            y: this.y,
            range: 100,
            damage: this.stats.attack,
            angle: angle

        });

        // 공격 애니메이션 종료
        this.scene.time.delayedCall(200, () => {
            this.isAttacking = false;
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
}
