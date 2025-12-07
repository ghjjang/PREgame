/**
 * BootScene.js
 * 게임 에셋 로딩 Scene
 */

import Phaser from 'phaser';

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

        // New (48x48 base) character sheets (filenames start with numbers)
        // Notice the filenames contain spaces/periods — they are valid paths.
        // Vertical stacked sheets (actual dimensions: idle 112x336, run 112x448)
        // FrameHeight = 56 (336/6, 448/12), FrameWidth = 112 for both
        this.load.spritesheet('player-idle', 'assets/images/1. idle 264 x 56.png', { frameWidth: 112, frameHeight: 56 });
        this.load.spritesheet('player-run', 'assets/images/2. Run 408 x 56.png', { frameWidth: 112, frameHeight: 56 });
        
        
        this.load.spritesheet('player-attack', '/assets/images/5. Attack 131 x 56.png', { frameWidth: 112, frameHeight: 56 });
        this.load.spritesheet('player-dash', '/assets/images/6. Dash 112 x 56 .png', { frameWidth: 112, frameHeight: 56 });
        
        

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
        // BootScene now always starts the main GameScene (training mode removed)
        const target = 'GameScene';

        this.scene.start(target);
        this.scene.launch('UIScene');
    }

    createAnimations() {
        // 재정의를 위해 기존 키 제거 (개발 중 핫리로드 대비)
        ['idle','walk','attack','dash','hit','death'].forEach(k => {
            if (this.anims.exists(k)) this.anims.remove(k);
        });
        // Setup simple, direction-agnostic animations using the new 48x48 spritesheets
        const createAnimationFromSheet = (key, animKey, config = {}) => {
            try {
                if (!this.textures.exists(key)) return;
                const total = this.textures.get(key).frameTotal || 1;
                const end = Math.max(0, total - 1);
                const frames = this.anims.generateFrameNumbers(key, { start: 0, end: end });
                this.anims.create(Object.assign({ key: animKey, frames, frameRate: 8, repeat: -1 }, config));
            } catch (e) {
                console.warn('[BootScene] Failed to create animation from', key, e);
            }
        };

        // 조금 더 자연스러운 속도
        createAnimationFromSheet('player-idle', 'idle', { frameRate: 6 });
        createAnimationFromSheet('player-run', 'walk', { frameRate: 8 });
        
        // Attack animation
        try {
            if (this.textures.exists('player-attack')) {
                const total = this.textures.get('player-attack').frameTotal || 1;
                const frames = this.anims.generateFrameNumbers('player-attack', { start: 0, end: total - 1 });
                
                this.anims.create({
                    key: 'attack',
                    frames: frames,
                    frameRate: 12,
                    repeat: 0
                });
            }
        } catch (e) {
            console.warn('[BootScene] Failed to create attack animation', e);
        }

        createAnimationFromSheet('player-dash', 'dash', { frameRate: 8, repeat: 0 });
        
        
    }
}
