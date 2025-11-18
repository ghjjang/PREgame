/**
 * GameScene.js
 * 메인 게임플레이 Scene
 */

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import ModeManager from '../state/ModeManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
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
        console.log('[GameScene] create() started');
        
        // 애니메이션 생성
        this.createAnimations();
        // 월드 크기 설정 (매우 큰 맵)
        this.physics.world.setBounds(-5000, -5000, 10000, 10000);

        // 배경 타일 생성
        this.createBackground();

        // 플레이어 생성
        this.player = new Player(this, 0, 0);

        // 카메라 설정
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1);
        this.cameras.main.roundPixels = true; // 픽셀 정렬

        // 적 그룹
        this.enemies = this.physics.add.group();

        // 충돌 설정
        this.physics.add.overlap(this.player, this.enemies, this.playerEnemyCollision, null, this);

        // 이벤트 리스너
        this.events.on('playerAttack', this.handlePlayerAttack, this);

        // 타겟팅
        this.currentTarget = null;
        this.input.on('pointermove', this.updateTargeting, this);

        // 히트박스 표시 상태
        this.showHitboxes = false;

        // 스폰 시스템
        this.spawnTimer = 0;
        this.spawnInterval = 3; // 3초마다 스폰 체크
        this.isTrainingMode = ModeManager.isTraining();
        this._savedPlayerState = null;
        // mode change 리스너 (ensure we receive current mode immediately)
        ModeManager.subscribeModeChange(this.onModeChanged, this);
        // cleanup on shutdown
        this.events.on('shutdown', () => {
            ModeManager.off('modeChanged', this.onModeChanged, this);
        });

        // If this GameScene was just started as part of a mode switch, a snapshot
        // may already be stored in ModeManager (either original or preserved).
        // Apply the snapshot immediately so that the returning player state is restored
        // even if the modeChanged event fired before this scene was created.
        try {
            const originalSnapshot = ModeManager.consumeOriginalPlayerSnapshot();
            if (originalSnapshot) {
                console.log('[GameScene] Restoring original player snapshot during create');
                if (this.player && originalSnapshot.stats) {
                    Object.assign(this.player.stats, originalSnapshot.stats);
                    if (originalSnapshot.x !== undefined && originalSnapshot.y !== undefined) {
                        this.player.x = originalSnapshot.x;
                        this.player.y = originalSnapshot.y;
                    }
                    this.events.emit('playerStatsChanged', this.player.stats);
                }
            } else {
                const preservedSnapshot = ModeManager.consumePlayerSnapshot();
                if (preservedSnapshot) {
                    console.log('[GameScene] Restoring preserved player snapshot during create');
                    if (this.player && preservedSnapshot.stats) {
                        Object.assign(this.player.stats, preservedSnapshot.stats);
                        if (preservedSnapshot.x !== undefined && preservedSnapshot.y !== undefined) {
                            this.player.x = preservedSnapshot.x;
                            this.player.y = preservedSnapshot.y;
                        }
                        this.events.emit('playerStatsChanged', this.player.stats);
                    }
                }
            }
        } catch (e) { console.warn('[GameScene] Failed to apply initial player snapshot:', e); }

        // 디버그 키
        this.input.keyboard.on('keydown-F3', () => {
            this.physics.world.drawDebug = !this.physics.world.drawDebug;
            this.physics.world.debugGraphic.clear();
        });
        
        console.log('[GameScene] create() completed');
    }

    createBackground() {
        // 단색 배경 (흰색)
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

        // 플레이어 업데이트
        if (this.player && this.player.active) {
            if (this.player.update) this.player.update(time, delta);

            // 스태미나 자동 회복
            if (this.player.regenerate) {
                this.player.regenerate(dt);
            }

            // 데미지를 받지 않은지 5초 후부터 체력 회복 시작
            if (this.player.regenerateHealth) {
                this.player.regenerateHealth(dt);
            }
        }

        // 적 스폰 시스템 (훈련모드에서는 스폰하지 않음)
        this.spawnTimer += dt;
        if (!this.isTrainingMode && this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.trySpawnEnemy();
        }

        // 적 업데이트 및 디스폰 체크
        if (this.enemies && this.enemies.children) {
            this.enemies.children.entries.forEach(enemy => {
                if (!enemy || !enemy.active || !this.player || !this.player.active) return;
                
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    enemy.x, enemy.y
                );

                // AI 및 스킬 업데이트
                if (enemy.update) {
                    enemy.update(time, delta);
                }

                // 타겟된 적 HP 표시
                if (this.currentTarget === enemy) {
                    this.events.emit('enemyTargeted', enemy);
                }

                // 너무 멀면 디스폰
                if (distance > 1500) {
                    if (this.currentTarget === enemy) {
                        this.currentTarget = null;
                        this.events.emit('targetChanged', null);
                        this.events.emit('enemyTargeted', null);
                    }
                    if (enemy.destroy) enemy.destroy();
                }
            });
        }
    }

    updateTargeting(pointer) {
        // 마우스 위치를 월드 좌표로 변환
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;
        
        let closestEnemy = null;
        let closestDist = 100; // 최대 타겟 거리

        this.enemies.children.entries.forEach(enemy => {
            // 살아있는 적만 타겟팅
            if (!enemy.active) return;
            
            const dist = Phaser.Math.Distance.Between(worldX, worldY, enemy.x, enemy.y);
            if (dist < closestDist) {
                closestDist = dist;
                closestEnemy = enemy;
            }
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


    trySpawnEnemy() {
        if (!this.player || !this.player.active) return;
        if (!this.enemies || !this.enemies.children) return;
        
        // 최대 10마리까지만 스폰
        if (this.enemies.children.size >= 10) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = Phaser.Math.Between(800, 1200);
        
        const x = this.player.x + Math.cos(angle) * distance;
        const y = this.player.y + Math.sin(angle) * distance;

        this.spawnEnemy(x, y);
    }

    spawnEnemy(x, y) {
        // 임시 적 스프라이트 (빨간 원)
        const enemy = this.physics.add.sprite(x, y, 'player');
        enemy.setTint(0xff0000);
        enemy.setScale(4);
        
        // 적 데이터
        enemy.enemyData = {
            hp: 50,
            maxHp: 50,
            attack: 5,
            speed: 100,
            type: Math.random() > 0.5 ? 'normal' : 'charger',
            state: 'idle',
            level: 1,
            skillCooldown: 0,
            skillInterval: 3 // 3초마다 스킬 사용
        };

        // 적 업데이트 함수
        enemy.update = (time, delta) => {
            if (!enemy.active) return;
            const dt = delta / 1000;
            
            if (enemy.enemyData.skillCooldown > 0) {
                enemy.enemyData.skillCooldown -= dt;
            }
        };

        this.enemies.add(enemy);

        // 복잡한 Ai
        this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                this.updateEnemyAI(enemy);
            }
        });
    }

    updateEnemyAI(enemy) {
        if (this.isTrainingMode) return; // 훈련모드에서는 AI 동작을 하지 않음
        if (!enemy || !enemy.active || !this.player || !this.player.active) return;

        const distance = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            enemy.x, enemy.y
        );

        // 스킬 사용 (범위 내에 있고 쿨다운이 끝났을 때)
        if (distance < 300 && enemy.enemyData.skillCooldown <= 0) {
            this.useEnemySkill(enemy);
            enemy.enemyData.skillCooldown = enemy.enemyData.skillInterval;
        }

        // 플레이어 추격
        if (distance < 500) {
            this.physics.moveToObject(enemy, this.player, enemy.enemyData.speed);
        } else {
            enemy.setVelocity(0, 0);
        }
    }

    onModeChanged(mode, prev, options = {}) {
        this.isTrainingMode = (mode === 'training');
        console.log('[GameScene] modeChanged ->', mode);
        // training mode에서는 스폰 및 AI를 중지
        if (this.isTrainingMode) {
            // optional: set existing enemies to passive
            if (this.enemies && this.enemies.children) {
                this.enemies.children.entries.forEach(e => { if (e && e.enemyData) { e.enemyData.speed = 0; e.enemyData.attack = 0; } });
            }
            // When entering training mode, save or reset player state depending on options
            try {
                if (this.player && this.player.stats) {
                    const snapshot = {
                        stats: JSON.parse(JSON.stringify(this.player.stats)),
                        x: this.player.x,
                        y: this.player.y,
                        preserve: !(options && options.resetPlayerState)
                    };
                    if (options && options.resetPlayerState) {
                        // Save original so we can restore after training
                        ModeManager.setOriginalPlayerSnapshot(snapshot);
                        // Do not preserve carried snapshot in this mode
                        ModeManager.setPlayerSnapshot(null);
                        // Reset current player for training defaults
                        this.player.x = 0;
                        this.player.y = 0;
                        this.player.stats.hp = this.player.stats.maxHp;
                        this.player.stats.sp = this.player.stats.maxSp;
                        this.player.stats.xp = 0;
                        this.events.emit('playerStatsChanged', this.player.stats);
                    } else {
                        // Preserve player state across scenes by setting player snapshot
                        ModeManager.setPlayerSnapshot(snapshot);
                    }
                }
            } catch (e) { console.warn('[GameScene] Failed to snapshot/modify player on mode change:', e); }
        } else {
            // restore default spawn interval
            this.spawnInterval = 3;
            // If there is an original player snapshot available in ModeManager (for reset), restore
            const originalSnapshot = ModeManager.consumeOriginalPlayerSnapshot();
            if (originalSnapshot) {
                try {
                    console.log('[GameScene] Restoring player state from original snapshot');
                    if (this.player && originalSnapshot.stats) {
                        Object.assign(this.player.stats, originalSnapshot.stats);
                        if (originalSnapshot.x !== undefined && originalSnapshot.y !== undefined) {
                            this.player.x = originalSnapshot.x;
                            this.player.y = originalSnapshot.y;
                        }
                        this.events.emit('playerStatsChanged', this.player.stats);
                    }
                } catch (e) { console.warn('Failed to restore player state:', e); }
            }
            else {
                // If no original snapshot, check for preserved snapshot from training
                const preservedSnapshot = ModeManager.consumePlayerSnapshot();
                if (preservedSnapshot) {
                    try {
                        console.log('[GameScene] Restoring player state from preserved snapshot');
                        if (this.player && preservedSnapshot.stats) {
                            Object.assign(this.player.stats, preservedSnapshot.stats);
                            if (preservedSnapshot.x !== undefined && preservedSnapshot.y !== undefined) {
                                this.player.x = preservedSnapshot.x;
                                this.player.y = preservedSnapshot.y;
                            }
                            this.events.emit('playerStatsChanged', this.player.stats);
                        }
                    } catch (e) { console.warn('Failed to restore player state from preserved snapshot:', e); }
                }
            }
        }
    }

    useEnemySkill(enemy) {
        // 적 스킬: 플레이어 방향으로 투사체 발사
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            this.player.x, this.player.y
        );

        const projectile = this.add.circle(enemy.x, enemy.y, 8, 0xff6600, 1);
        this.physics.add.existing(projectile);
        
        const speed = 200;
        projectile.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        // 투사체 충돌 체크
        const checkCollision = () => {
            if (!projectile || !projectile.active || !this.player || !this.player.active) return;

            const dist = Phaser.Math.Distance.Between(
                projectile.x, projectile.y,
                this.player.x, this.player.y
            );

            if (dist < 30) {
                this.player.takeDamage(enemy.enemyData.attack * 2); // 스킬은 2배 데미지
                projectile.destroy();
            } else if (Math.abs(projectile.x - enemy.x) > 600 || Math.abs(projectile.y - enemy.y) > 600) {
                // 너무 멀리 가면 제거
                projectile.destroy();
            } else {
                this.time.delayedCall(50, checkCollision);
            }
        };

        this.time.delayedCall(50, checkCollision);
    }

    playerEnemyCollision(player, enemy) {
        if (!player || !player.active || !enemy || !enemy.active) return;
        
        // 플레이어가 대시 중이면 적에게 데미지
        if (player.isDashing && player.stats) {
            this.damageEnemy(enemy, player.stats.attack);
        } else if (enemy.enemyData && player.takeDamage) {
            // 플레이어 피격
            player.takeDamage(enemy.enemyData.attack);
        }
    }

    handlePlayerAttack(attackData) {
        if (!this.enemies || !this.enemies.children) return;
        
        let hitEnemies = [];
        
        // 공격 범위 내 적 탐색
        this.enemies.children.entries.forEach(enemy => {
            if (!enemy || !enemy.active) return;
            
            const distance = Phaser.Math.Distance.Between(
                attackData.x, attackData.y,
                enemy.x, enemy.y
            );

            if (distance < attackData.range) {
                this.damageEnemy(enemy, attackData.damage);
                hitEnemies.push(enemy);
            }
        });
        
        // 공격한 적 중 가장 가까운 적을 타겟으로 설정
        if (hitEnemies.length > 0) {
            let closestEnemy = hitEnemies[0];
            let closestDist = Phaser.Math.Distance.Between(
                attackData.x, attackData.y,
                closestEnemy.x, closestEnemy.y
            );
            
            hitEnemies.forEach(enemy => {
                const dist = Phaser.Math.Distance.Between(
                    attackData.x, attackData.y,
                    enemy.x, enemy.y
                );
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = enemy;
                }
            });
            
            // 가장 가까운 적을 타겟으로 설정하고 HP UI 표시
            this.currentTarget = closestEnemy;
            this.events.emit('enemyTargeted', closestEnemy);
        }
    }

    damageEnemy(enemy, damage) {
        if (!enemy || !enemy.active) return;

        enemy.enemyData.hp -= damage;
        
        // HP를 0 이하로 내리지 않음
        if (enemy.enemyData.hp <= 0) {
            enemy.enemyData.hp = 0;
            // HP가 0이 되면 즉시 디스폰
            this.killEnemy(enemy);
            return;
        }

        // 현재 타겟된 적이면 HP UI 업데이트
        if (this.currentTarget === enemy) {
            this.events.emit('enemyTargeted', enemy);
        }

        // 피격 이펙트
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.setTint(0xff0000);
            }
        });
    }

    killEnemy(enemy) {
        if (!enemy || !enemy.active) return;
        
        // 타겟된 적이 죽으면 UI 숨기기
        if (this.currentTarget === enemy) {
            this.currentTarget = null;
            this.events.emit('targetChanged', null);
            this.events.emit('enemyTargeted', null);
        }

        // 경험치 획득
        if (this.player && this.player.gainXP) {
            this.player.gainXP(10);
        }

        // 적의 위치 저장 (파티클용)
        const enemyX = enemy.x;
        const enemyY = enemy.y;

        // 즉시 적 제거
        if (enemy.destroy) {
            enemy.destroy();
        }
        
        // 파티클 이펙트 (간단히)
        try {
            const particles = this.add.particles(enemyX, enemyY, 'player', {
                speed: { min: 50, max: 100 },
                scale: { start: 1, end: 0 },
                alpha: { start: 0.5, end: 0 },
                tint: 0xff0000,
                lifespan: 500,
                quantity: 5,
                emitting: false
            });
            if (particles && particles.explode) {
                particles.explode();
            }

            // 파티클 정리
            this.time.delayedCall(600, () => {
                if (particles && particles.active && particles.destroy) {
                    particles.destroy();
                }
            });
        } catch (e) {
            console.warn('Failed to create death particles:', e);
        }
    }
}
