/**
 * TrainingScene.js
 * 훈련 모드: 허수아비 봇으로 테스트하는 전용 씬
 */

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import ModeManager from '../state/ModeManager.js';

export default class TrainingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TrainingScene' });
    }

    preload() {
        // 플레이어 스프라이트 (16x16, 4행 4열)
        this.load.spritesheet('player', '/assets/images/player.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // 대시 이펙트
        this.load.image('dash', '/assets/images/dash.png');

        // 타일맵 이미지
        this.load.image('grass', '/assets/images/Grass 12  .png');
        this.load.image('tree', '/assets/images/summer_pine_tree_tiles.png');
    }

    create() {
        console.log('[TrainingScene] create() started');
        
        // 애니메이션 생성
        this.createAnimations();
        // 월드 크기
        this.physics.world.setBounds(-5000, -5000, 10000, 10000);

        // 배경
        this.createBackground();

        // 플레이어
        this.player = new Player(this, 0, 0);

        // 카메라
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.cameras.main.roundPixels = true;

        // 적 그룹 (훈련용 봇도 이 그룹 활용)
        this.enemies = this.physics.add.group();

        // 충돌/피격
        this.physics.add.overlap(this.player, this.enemies, this.playerEnemyCollision, null, this);

        // 이벤트 리스너
        this.events.on('playerAttack', this.handlePlayerAttack, this);

        // 타겟팅
        this.currentTarget = null;
        this.input.on('pointermove', this.updateTargeting, this);

        // 디버그
        this.input.keyboard.on('keydown-F3', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        });

        // 초기 허수아비 1개만 배치
        this.trainingBot = null;
        this.spawnPracticeBot(200, 0);

        // If ModeManager has a preserved player snapshot, apply it to this player
        try {
            const snapshot = ModeManager.getPlayerSnapshot();
            if (snapshot && snapshot.preserve && this.player && this.player.stats) {
                Object.assign(this.player.stats, snapshot.stats);
                if (snapshot.x !== undefined && snapshot.y !== undefined) {
                    this.player.x = snapshot.x;
                    this.player.y = snapshot.y;
                }
                this.events.emit('playerStatsChanged', this.player.stats);
            }
        } catch (e) { console.warn('[TrainingScene] Failed to apply player snapshot:', e); }

        this.isTrainingMode = ModeManager.isTraining();
        ModeManager.subscribeModeChange(this.onModeChanged, this);
        this.events.on('shutdown', () => ModeManager.off('modeChanged', this.onModeChanged, this));

        // 데미지 텍스트 그룹
        this.damageTexts = [];

        // 스탯 조절 UI
        this.setupStatEditor();
    }

    createBackground() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xC0C0C0, 1);
        graphics.fillRect(-5000, -5000, 10000, 10000);
    }

    createAnimations() {
        // 애니메이션이 이미 존재하면 건너뛰기
        if (this.anims.exists('walk-down')) return;

        // 아래 방향 (row 0)
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        // 위 방향 (row 1)
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 8,
            repeat: -1
        });

        // 오른쪽 방향 (row 2)
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 8,
            repeat: -1
        });

        // 왼쪽 방향 (row 3)
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 8,
            repeat: -1
        });

        // 정지 프레임
        this.anims.create({
            key: 'idle-down',
            frames: [{ key: 'player', frame: 0 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'idle-up',
            frames: [{ key: 'player', frame: 4 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'idle-right',
            frames: [{ key: 'player', frame: 8 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'idle-left',
            frames: [{ key: 'player', frame: 12 }],
            frameRate: 1
        });
    }

    update(time, delta) {
        const dt = delta / 1000;
        if (this.player && this.player.active) {
            if (this.player.update) this.player.update(time, delta);
            if (this.player.regenerate) this.player.regenerate(dt);
            if (this.player.regenerateHealth) this.player.regenerateHealth(dt);
        }

        // 훈련 모드는 적 자동 스폰 없음

        // 타겟 HP UI 유지/거리 체크는 GameScene과 동일 동작이므로 간단화
        if (this.enemies && this.enemies.children) {
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy || !enemy.active || !this.player || !this.player.active) return;
                if (this.currentTarget === enemy) {
                    this.events.emit('enemyTargeted', enemy);
                }
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist > 2000) {
                    if (this.currentTarget === enemy) {
                        this.currentTarget = null;
                        this.events.emit('targetChanged', null);
                        this.events.emit('enemyTargeted', null);
                    }
                    enemy.destroy();
                }
            });
        }
    }

    updateTargeting(pointer) {
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        let closestEnemy = null;
        let closestDist = 100;
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            const d = Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y);
            if (d < closestDist) { closestDist = d; closestEnemy = enemy; }
        });
        if (this.currentTarget !== closestEnemy) {
            this.currentTarget = closestEnemy;
            if (closestEnemy) {
                this.events.emit('targetChanged', {
                    level: closestEnemy.enemyData.level,
                    hp: closestEnemy.enemyData.hp,
                    maxHp: closestEnemy.enemyData.maxHp
                });
                this.events.emit('enemyTargeted', closestEnemy);
            } else {
                this.events.emit('targetChanged', null);
                this.events.emit('enemyTargeted', null);
            }
        }
    }

    // 플레이어-적 접촉
    playerEnemyCollision(player, enemy) {
        if (!player || !player.active || !enemy || !enemy.active) return;
        // 대시 중 봇에게 데미지
        if (player.isDashing && player.stats) {
            this.damageEnemy(enemy, player.stats.attack);
        }
        // 훈련 모드: 봇이 플레이어를 공격하지 않음
    }

    handlePlayerAttack(attackData) {
        if (!this.enemies || !this.enemies.children) return;
        let hitEnemies = [];
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy || !enemy.active) return;
            const distance = Phaser.Math.Distance.Between(attackData.x, attackData.y, enemy.x, enemy.y);
            if (distance < attackData.range) {
                this.damageEnemy(enemy, attackData.damage);
                hitEnemies.push(enemy);
            }
        });
        if (hitEnemies.length > 0) {
            let closestEnemy = hitEnemies[0];
            let closestDist = Phaser.Math.Distance.Between(attackData.x, attackData.y, closestEnemy.x, closestEnemy.y);
            hitEnemies.forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(attackData.x, attackData.y, enemy.x, enemy.y);
                if (dist < closestDist) { closestDist = dist; closestEnemy = enemy; }
            });
            this.currentTarget = closestEnemy;
            this.events.emit('enemyTargeted', closestEnemy);
        }
    }

    damageEnemy(enemy, damage) {
        if (!enemy || !enemy.active) return;
        
        // 데미지 표시
        this.showDamageText(enemy.x, enemy.y - 30, damage);
        
        enemy.enemyData.hp -= damage;
        if (enemy.enemyData.hp <= 0) {
            enemy.enemyData.hp = 0;
            this.killEnemy(enemy);
            return;
        }
        if (this.currentTarget === enemy) {
            this.events.emit('enemyTargeted', enemy);
        }
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => { if (enemy.active) enemy.setTint(enemy.enemyData.tint || 0x0088ff); });
    }

    showDamageText(x, y, damage) {
        const damageText = this.add.text(x, y, `-${Math.floor(damage)}`, {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ff6666',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4
        });
        damageText.setOrigin(0.5, 0.5);
        
        this.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => damageText.destroy()
        });
    }

    killEnemy(enemy) {
        if (!enemy || !enemy.active) return;
        if (this.currentTarget === enemy) {
            this.currentTarget = null;
            this.events.emit('targetChanged', null);
            this.events.emit('enemyTargeted', null);
        }
        const enemyX = enemy.x; const enemyY = enemy.y;
        
        // 봇 제거
        if (this.trainingBot === enemy) {
            this.trainingBot = null;
        }
        enemy.destroy();
        
        // 파티클 효과
        try {
            const particles = this.add.particles(enemyX, enemyY, 'player', {
                speed: { min: 50, max: 100 },
                scale: { start: 1, end: 0 },
                alpha: { start: 0.5, end: 0 },
                tint: 0x0088ff,
                lifespan: 500,
                quantity: 5,
                emitting: false
            });
            particles?.explode?.();
            this.time.delayedCall(600, () => { particles?.active && particles?.destroy?.(); });
        } catch (e) {
            console.warn('Failed to create training particles:', e);
        }
        
        // 즉시 재생성
        this.time.delayedCall(500, () => {
            this.spawnPracticeBot(200, 0);
        });
    }

    // 훈련용 허수아비 봇 생성 (정지 대상, 단일)
    spawnPracticeBot(x, y) {
        if (!this.player || !this.player.active) return;
        if (!this.enemies || !this.enemies.children) return;
        
        // 이미 봇이 있으면 생성 안 함
        if (this.trainingBot && this.trainingBot.active) return;
        
        if (x === undefined || y === undefined) {
            x = 200;
            y = 0;
        }
        const bot = this.physics.add.sprite(x, y, 'player');
        bot.setTint(0x0088ff);
        bot.setScale(4);
        bot.enemyData = {
            hp: 100,
            maxHp: 100,
            attack: 0,
            speed: 0,
            type: 'practice',
            state: 'idle',
            level: 1,
            skillCooldown: 999999,
            skillInterval: 999999,
            tint: 0x0088ff
        };
        bot.update = () => {};
        bot.setInteractive(); // 클릭 가능하게
        this.enemies.add(bot);
        this.trainingBot = bot;
        console.log(`훈련 봇 소환 (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }

    setupStatEditor() {
        // 플레이어 클릭 이벤트
        if (this.player) {
            this.player.setInteractive();
            this.player.on('pointerdown', () => {
                this.events.emit('openStatEditor', 'player', this.player);
            });
        }

        // 봇 클릭은 spawnPracticeBot에서 이미 setInteractive 설정됨
        // 봇 클릭 이벤트는 input.on('gameobjectdown')으로 처리
        this.input.on('gameobjectdown', (pointer, gameObject) => {
            if (gameObject === this.trainingBot) {
                this.events.emit('openStatEditor', 'bot', this.trainingBot);
            }
        });
    }

    onModeChanged(mode, prev, options = {}) {
        this.isTrainingMode = (mode === 'training');
        console.log('[TrainingScene] modeChanged ->', mode);
        if (!this.isTrainingMode) {
            // training 씬이 비활성화될 예정이라면, 훈련 봇 정리
            if (this.trainingBot && this.trainingBot.active) {
                try { this.trainingBot.destroy(); } catch (e) { /* ignore */ }
                this.trainingBot = null;
            }
            // If preserve snapshot existed, write back current player stats so GameScene can restore
            try {
                const snap = ModeManager.getPlayerSnapshot();
                if (snap && snap.preserve && this.player && this.player.stats) {
                    const updated = {
                        stats: JSON.parse(JSON.stringify(this.player.stats)),
                        x: this.player.x,
                        y: this.player.y,
                        preserve: true
                    };
                    ModeManager.setPlayerSnapshot(updated);
                }
            } catch (e) { console.warn('[TrainingScene] Failed to write back preserved snapshot:', e); }
        }
    }

    onModeChanged(mode, prev) {
        this.isTrainingMode = (mode === 'training');
        console.log('[TrainingScene] modeChanged ->', mode);
        if (!this.isTrainingMode) {
            // training 씬이 비활성화될 예정이라면, 훈련 봇 정리
            if (this.trainingBot && this.trainingBot.active) {
                try { this.trainingBot.destroy(); } catch (e) { /* ignore */ }
                this.trainingBot = null;
            }
        }
    }
}
