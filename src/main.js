/**
 * main.js
 * Phaser 3 게임 진입점
 */

import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import GameScene from './scenes/GameScene.js';
import UIScene from './scenes/UIScene.js';

// URL 파라미터로 스케일 모드 선택: ?scale=fit|envelop|resize
function getScaleMode() {
    const params = new URLSearchParams(window.location.search);
    const m = (params.get('scale') || '').toLowerCase();
    switch (m) {
        case 'fit':
            return Phaser.Scale.FIT;
        case 'resize':
            return Phaser.Scale.RESIZE;
        case 'envelop':
        default:
            return Phaser.Scale.ENVELOP;
    }
}

const config = {
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    parent: 'game-container',
    // 고정 기준 해상도 (16:9)
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a1a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        // 기본: ENVELOP. URL로 ?scale=fit | envelop | resize 선택 가능
        mode: getScaleMode(),
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    render: {
        pixelArt: true,
        antialias: false,
        mipmapFilter: 'NEAREST'
    },
    scene: [BootScene, GameScene, UIScene]
};

const game = new Phaser.Game(config);

// Training mode removed: no in-memory mode manager needed

// Start BootScene to handle asset loading and further startup
game.scene.start('BootScene');

// ENVELOP 모드에서는 Phaser가 자동 스케일링 처리 (정수배 강제 확대 비활성화)

export default game;
