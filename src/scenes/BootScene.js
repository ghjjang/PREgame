/**
 * BootScene.js
 * 게임 에셋 로딩 Scene
 */

import Phaser from 'phaser';
import ModeManager from '../state/ModeManager.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 로딩 바 생성
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        });
        percentText.setOrigin(0.5, 0.5);

        // 로딩 이벤트
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // 에셋 로딩
        this.loadAssets();
    }

    loadAssets() {
        // 플레이어 스프라이트 (16x16, 4행 4열)
        this.load.spritesheet('player', '/assets/images/player.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // 대시 이펙트
        this.load.image('dash', '/assets/images/dash.png');

        // 타일맵 이미지
        this.load.image('grass', 'public/assets/images/Grass 12  .png');
        this.load.image('tree', '/assets/images/summer_pine_tree_tiles.png');

        // TODO: 추가 에셋 로딩
    }

    create() {
        // 플레이어 애니메이션 생성
        this.createAnimations();
        // Ensure ModeManager is initialized. Prefer in-memory ModeManager value,
        // but fall back to URL param if not set. This allows BootScene to be used
        // even if main.js didn't call ModeManager.initFromUrl().
        ModeManager.initFromUrl('normal');
        const mode = ModeManager.getMode();
        const target = mode === 'training' ? 'TrainingScene' : 'GameScene';

        this.scene.start(target);
        this.scene.launch('UIScene');
    }

    createAnimations() {
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
}
