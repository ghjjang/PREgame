/**
 * UIScene.js
 * UI 오버레이 Scene (HTML DOM 사용)
 */

import Phaser from 'phaser';
import ModeManager from '../state/ModeManager.js';

export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // 현재 모드 감지 (in-memory ModeManager 기반)
        this.modeManager = ModeManager;
        this.isTrainingMode = this.modeManager.isTraining();
        // mode 변경 리스너 등록
        // Use subscribe helper so that newly created UI will immediately be notified of current mode
        this.modeManager.subscribeModeChange(this.handleModeChanged, this);
        this.events.on('shutdown', () => this.modeManager.off('modeChanged', this.handleModeChanged, this));
        console.log('[UIScene] Mode detected:', this.isTrainingMode ? 'Training' : 'Normal');
        
        // GameScene 또는 TrainingScene 참조
        try {
            this.gameScene = this.scene.get('GameScene');
        } catch (e) {
            // ignore
        }
        if (!this.gameScene) {
            try {
                this.gameScene = this.scene.get('TrainingScene');
            } catch (e) {
                // ignore
            }
        }

        // HTML UI 생성
        this.createHTMLUI();

        // 이벤트 리스너 바인딩
        if (this.gameScene) {
            const gameScene = this.gameScene;
            gameScene.events.on('playerStatsChanged', this.updateStats, this);
            gameScene.events.on('playerDamaged', this.updateStats, this);
            gameScene.events.on('playerXPGained', this.updateStats, this);
            gameScene.events.on('playerLevelUp', this.updateStats, this);
            gameScene.events.on('inventoryToggled', this.toggleInventoryUI, this);
            gameScene.events.on('targetChanged', this.updateTargetInfo, this);
            gameScene.events.on('enemyTargeted', this.updateEnemyHP, this);
            gameScene.events.on('openStatEditor', this.openStatEditor, this);
        }

        // 초기 스탯 업데이트
        this.time.delayedCall(100, () => {
            if (this.gameScene && this.gameScene.player) {
                this.updateStats(this.gameScene.player.stats);
            }
        });

        // UI pause flag
        this._isPausedByUI = false;

        // 첫 진입 시 메인 메뉴 자동 오픈
        this.time.delayedCall(200, () => {
            this.openMainMenu();
        });
    }

    createHTMLUI() {
        // CSS 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            #game-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                font-family: 'Courier New', monospace;
                z-index: 1000;
            }

            /* 좌측 상단 HUD  */
            #character-panel {
                position: absolute;
                top: 10px;
                left: 10px;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(20, 20, 20, 0.85));
                border: 3px solid rgba(100, 100, 100, 0.8);
                border-radius: 0px;
                padding: 8px 12px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.9);
                min-width: 250px;
            }

            .stat-row {
                display: flex;
                align-items: center;
                gap: 6px;
                margin: 4px 0;
            }

            .stat-bar {
                flex: 1;
                height: 14px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 0px;
                overflow: hidden;
                position: relative;
                border: 2px solid rgba(100, 100, 100, 0.6);
            }

            .stat-bar-fill {
                height: 100%;
                transition: width 0.2s ease;
            }

            .hp-bar { background: linear-gradient(90deg, #ff3366, #cc0033); }
            .sp-bar { background: linear-gradient(90deg, #33ccff, #0099ff); }
            .xp-bar { background: linear-gradient(90deg, #ffcc00, #ff9900); }

            .stat-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-size: 11px;
                font-weight: bold;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                pointer-events: none;
            }

            /* 인벤토리 UI */
            #inventory-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 2000;
                pointer-events: auto;
            }

            #inventory-overlay.active {
                display: flex;
            }

            #inventory-panel {
                background: rgba(30, 30, 40, 0.95);
                border: 3px solid rgba(100, 100, 100, 0.8);
                border-radius: 16px;
                padding: 30px;
                min-width: 800px;
                max-width: 90%;
            }

            #inventory-title {
                color: #fff;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            }

            #character-stats {
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(100, 116, 139, 0.4);
                border-radius: 12px;
                padding: 20px;
            }

            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid rgba(100, 116, 139, 0.2);
                color: #e2e8f0;
                font-size: 14px;
            }

            .stat-name {
                color: #94a3b8;
            }

            .stat-value {
                color: #60a5fa;
                font-weight: bold;
            }

            /* 미니맵 (우측 상단) */
            #minimap-container {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 180px;
                height: 180px;
                background: rgba(0, 0, 0, 0.85);
                border: 3px solid rgba(200, 50, 50, 0.8);
                border-radius: 0px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.9);
            }

            #minimap-canvas {
                width: 100%;
                height: 100%;
                background: rgba(20, 30, 20, 0.9);
            }

            /* 스킬바 (하단 중앙) */
            #hotbar-container {
                position: absolute;
                bottom: 10px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 4px;
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid rgba(100, 100, 100, 0.6);
                padding: 6px;
            }

            .hotbar-slot {
                width: 50px;
                height: 50px;
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid rgba(100, 100, 100, 0.6);
                border-radius: 0px;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                cursor: pointer;
                transition: all 0.15s;
            }

            .hotbar-slot:hover {
                border-color: rgba(255, 255, 255, 0.8);
                background: rgba(50, 50, 50, 0.9);
                transform: scale(1.05);
            }

            .hotbar-number {
                position: absolute;
                bottom: 2px;
                right: 4px;
                font-size: 11px;
                color: #fff;
                font-weight: bold;
                text-shadow: 1px 1px 2px #000;
            }

            .hotbar-slot-icon {
                font-size: 24px;
            }

            /* 메인 메뉴 (게임 시작 시) */
            #main-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 5000;
                pointer-events: auto;
            }

            #main-menu-overlay.active {
                display: flex;
            }

            /* 일시정지 메뉴 (ESC 키) */
            #pause-menu-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 4000;
                pointer-events: auto;
            }

            #pause-menu-overlay.active {
                display: flex;
            }

            #menu-panel {
                background: rgba(30, 30, 40, 0.95);
                border: 3px solid rgba(100, 100, 100, 0.8);
                padding: 50px 80px;
                text-align: center;
                min-width: 400px;
            }

            #menu-title {
                color: #fff;
                font-size: 52px;
                font-weight: bold;
                margin-bottom: 40px;
                text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
            }

            .menu-button {
                width: 100%;
                padding: 15px 30px;
                margin: 10px 0;
                background: rgba(60, 60, 80, 0.8);
                border: 2px solid rgba(100, 100, 100, 0.6);
                color: #fff;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Courier New', monospace;
            }

            .menu-button:hover {
                background: rgba(80, 80, 120, 0.9);
                border-color: rgba(150, 150, 200, 0.8);
                transform: translateX(5px);
            }

            .menu-button.primary {
                background: rgba(200, 100, 0, 0.8);
                border-color: rgba(255, 150, 0, 0.8);
            }

            .menu-button.primary:hover {
                background: rgba(255, 130, 0, 0.9);
            }

            /* 적 HP바 (하단 위쪽) */
            #enemy-hp-container {
                position: absolute;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.85);
                border: 2px solid rgba(100, 100, 100, 0.6);
                padding: 8px 16px;
                min-width: 400px;
                display: none;
            }

            #enemy-hp-container.active {
                display: block;
            }

            #enemy-name {
                color: #ff6666;
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 4px;
            }

            #enemy-hp-bar {
                width: 100%;
                height: 16px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid rgba(100, 100, 100, 0.6);
                position: relative;
            }

            #enemy-hp-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff3366, #cc0033);
                transition: width 0.3s;
            }

            #enemy-hp-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-size: 11px;
                font-weight: bold;
                text-shadow: 1px 1px 2px #000;
            }

            /* 설정 메뉴 */
            #settings-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 3000;
                pointer-events: auto;
            }

            #settings-overlay.active {
                display: flex;
            }

            #settings-panel {
                background: rgba(30, 30, 40, 0.95);
                border: 3px solid rgba(100, 100, 100, 0.8);
                border-radius: 16px;
                padding: 40px;
                min-width: 500px;
            }

            #settings-title {
                color: #fff;
                font-size: 32px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            }

            .settings-close-btn {
                width: 100%;
                padding: 12px;
                margin-top: 20px;
                background: rgba(100, 100, 100, 0.5);
                border: 2px solid rgba(150, 150, 150, 0.6);
                color: #fff;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Courier New', monospace;
            }

            .settings-close-btn:hover {
                background: rgba(120, 120, 120, 0.7);
                border-color: rgba(200, 200, 200, 0.8);
            }

            .settings-section {
                margin-bottom: 25px;
            }

            .settings-section h4 {
                color: #60a5fa;
                font-size: 18px;
                margin-bottom: 10px;
                border-bottom: 1px solid rgba(100, 116, 139, 0.3);
                padding-bottom: 5px;
            }

            .control-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.3);
                margin: 5px 0;
                border-radius: 6px;
                color: #e2e8f0;
                font-size: 14px;
            }

            .control-key {
                background: rgba(59, 130, 246, 0.3);
                padding: 4px 12px;
                border-radius: 4px;
                font-weight: bold;
                color: #60a5fa;
                border: 1px solid rgba(59, 130, 246, 0.5);
            }

            /* 스탯 에디터 */
            #stat-editor-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 3500;
                pointer-events: auto;
            }

            #stat-editor-overlay.active {
                display: flex;
            }

            #stat-editor-panel {
                background: rgba(30, 30, 40, 0.95);
                border: 3px solid rgba(100, 100, 100, 0.8);
                border-radius: 12px;
                padding: 30px;
                min-width: 400px;
                max-width: 500px;
            }

            #stat-editor-title {
                color: #fff;
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 20px;
            }

            .stat-editor-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid rgba(100, 100, 100, 0.3);
            }

            .stat-editor-label {
                color: #94a3b8;
                font-size: 16px;
            }

            .stat-editor-input {
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(100, 100, 100, 0.6);
                color: #fff;
                padding: 6px 12px;
                font-size: 16px;
                width: 120px;
                text-align: right;
                font-family: 'Courier New', monospace;
            }

            .stat-editor-input:focus {
                outline: none;
                border-color: #60a5fa;
            }

            .stat-editor-close {
                width: 100%;
                padding: 12px;
                margin-top: 20px;
                background: rgba(100, 100, 100, 0.5);
                border: 2px solid rgba(150, 150, 150, 0.6);
                color: #fff;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            }

            .stat-editor-close:hover {
                background: rgba(120, 120, 120, 0.7);
            }
        `;
        document.head.appendChild(style);

        // UI 컨테이너
        const uiContainer = document.createElement('div');
        uiContainer.id = 'game-ui';
        uiContainer.innerHTML = `
            <div id="character-panel">
                <div class="stat-row">
                    <div style="color: #fff; font-size: 12px; font-weight: bold; min-width: 55px;" id="hp-text">100/100</div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill hp-bar" id="hp-bar" style="width: 100%"></div>
                    </div>
                </div>
                <div class="stat-row">
                    <div style="color: #6cf; font-size: 12px; font-weight: bold; min-width: 55px;" id="sp-text">100/100</div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill sp-bar" id="sp-bar" style="width: 100%"></div>
                    </div>
                </div>
            </div>

            <div id="inventory-overlay">
                <div id="inventory-panel">
                    <div id="inventory-title">인벤토리</div>
                    <div id="character-stats">
                        <div class="stat-item">
                            <span class="stat-name">레벨</span>
                            <span class="stat-value" id="inv-level">1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">HP</span>
                            <span class="stat-value" id="inv-hp">100 / 100</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">SP</span>
                            <span class="stat-value" id="inv-sp">100 / 100</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">경험치</span>
                            <span class="stat-value" id="inv-xp">0 / 100</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">공격력</span>
                            <span class="stat-value" id="inv-attack">10</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">방어력</span>
                            <span class="stat-value" id="inv-defense">5</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-name">이동속도</span>
                            <span class="stat-value" id="inv-speed">200</span>
                        </div>
                    </div>
                </div>
            </div>

            <div id="settings-overlay">
                <div id="settings-panel">
                    <div id="settings-title">⚙️ 게임 설정</div>
                    
                    <div class="settings-section">
                        <h4>조작법</h4>
                        <div class="control-row">
                            <span>이동</span>
                            <span class="control-key">W A S D</span>
                        </div>
                        <div class="control-row">
                            <span>대시</span>
                            <span class="control-key">Shift</span>
                        </div>
                        <div class="control-row">
                            <span>공격</span>
                            <span class="control-key">마우스 클릭</span>
                        </div>
                        <div class="control-row">
                            <span>인벤토리</span>
                            <span class="control-key">I</span>
                        </div>
                        <div class="control-row">
                            <span>설정</span>
                            <span class="control-key">ESC</span>
                        </div>
                        <div class="control-row">
                            <span>디버그</span>
                            <span class="control-key">F3</span>
                        </div>
                    </div>

                    <button class="settings-close-btn" id="settings-close-btn">닫기</button>
                </div>
            </div>

            <div id="minimap-container">
                <canvas id="minimap-canvas" width="180" height="180"></canvas>
            </div>

            <div id="hotbar-container">
                <div class="hotbar-slot" title="대시 (Shift)">
                    <span class="hotbar-slot-icon">💨</span>
                    <span class="hotbar-number">Shift</span>
                </div>
                <div class="hotbar-slot" title="공격 (클릭)">
                    <span class="hotbar-slot-icon">⚔️</span>
                    <span class="hotbar-number">Click</span>
                </div>
            </div>

            <div id="enemy-hp-container">
                <div id="enemy-name">Enemy</div>
                <div id="enemy-hp-bar">
                    <div id="enemy-hp-fill" style="width: 100%"></div>
                    <div id="enemy-hp-text">100/100</div>
                </div>
            </div>

            <!-- 메인 메뉴 (게임 시작 시) -->
            <div id="main-menu-overlay">
                <div id="menu-panel">
                    <div id="menu-title">GAME START</div>
                    
                    <div style="margin: 10px 0 20px 0;">
                        <div style="color:#fff; font-size:18px; font-weight:bold; margin-bottom:8px;">모드 선택</div>
                        <div style="display:flex; gap:8px; justify-content:center;">
                            <button class="menu-button" style="width:auto; padding:12px 24px;" id="mode-game-btn">일반 모드</button>
                            <button class="menu-button" style="width:auto; padding:12px 24px;" id="mode-training-btn">훈련 모드</button>
                        </div>
                    </div>

                    <button class="menu-button primary" id="start-btn">게임 시작</button>
                </div>
            </div>

            <!-- 일시정지 메뉴 (ESC 키) -->
            <div id="pause-menu-overlay">
                <div id="menu-panel">
                    <div id="menu-title">PAUSE</div>
                    
                    <button class="menu-button primary" id="resume-btn">계속하기</button>
                    <button class="menu-button" id="settings-btn">설정</button>
                    <button class="menu-button" id="restart-btn">재시작</button>
                    <button class="menu-button" id="main-menu-btn">메인 메뉴</button>
                </div>
            </div>

            <div id="stat-editor-overlay">
                <div id="stat-editor-panel">
                    <div id="stat-editor-title">스탯 편집</div>
                    <div id="stat-editor-content"></div>
                    <button class="stat-editor-close" id="stat-editor-close-btn">닫기</button>
                </div>
            </div>
        `;

        document.body.appendChild(uiContainer);
        
        // 미니맵 초기화
        this.initMinimap();

        // 메뉴 버튼 이벤트 초기화
        this.initMenuButtons();
    }

    updateStats(stats) {
        const hpPercent = (stats.hp / stats.maxHp) * 100;
        const hpBar = document.getElementById('hp-bar');
        const hpText = document.getElementById('hp-text');
        if (hpBar) hpBar.style.width = hpPercent + '%';
        if (hpText) hpText.textContent = `${Math.floor(stats.hp)}/${stats.maxHp}`;

        const spPercent = (stats.sp / stats.maxSp) * 100;
        const spBar = document.getElementById('sp-bar');
        const spText = document.getElementById('sp-text');
        if (spBar) spBar.style.width = spPercent + '%';
        if (spText) spText.textContent = `${Math.floor(stats.sp)}/${stats.maxSp}`;
    }

    toggleInventoryUI(isOpen) {
        const overlay = document.getElementById('inventory-overlay');
        if (overlay) {
            if (isOpen) {
                overlay.classList.add('active');
                if (this.gameScene && this.gameScene.player && this.gameScene.player.stats) {
                    this.updateInventoryStats(this.gameScene.player.stats);
                }
            } else {
                overlay.classList.remove('active');
            }
        }
    }

    updateInventoryStats(stats) {
        if (!stats) return;
        const invLevel = document.getElementById('inv-level');
        const invHp = document.getElementById('inv-hp');
        const invSp = document.getElementById('inv-sp');
        const invXp = document.getElementById('inv-xp');
        const invAttack = document.getElementById('inv-attack');
        const invDefense = document.getElementById('inv-defense');
        const invSpeed = document.getElementById('inv-speed');

        if (invLevel) invLevel.textContent = stats.level || 1;
        if (invHp) invHp.textContent = `${Math.floor(stats.hp || 0)} / ${stats.maxHp || 100}`;
        if (invSp) invSp.textContent = `${Math.floor(stats.sp || 0)} / ${stats.maxSp || 100}`;
        if (invXp) invXp.textContent = `${Math.floor(stats.xp || 0)} / ${stats.maxXp || 100}`;
        if (invAttack) invAttack.textContent = stats.attack || 0;
        if (invDefense) invDefense.textContent = stats.defense || 0;
        if (invSpeed) invSpeed.textContent = stats.speed || 0;
    }

    updateTargetInfo(target) {
        // placeholder
    }

    initMinimap() {
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas?.getContext('2d');
        this.events.on('update', this.updateMinimap, this);
    }

    updateMinimap() {
        if (!this.minimapCtx) return;
        if (!this.gameScene || !this.gameScene.player || !this.gameScene.player.active) return;
        if (!this.gameScene.enemies || !this.gameScene.enemies.children) return;

        // 훈련모드에서는 미니맵 숨김
        const minimapContainer = document.getElementById('minimap-container');
        if (this.isTrainingMode) {
            if (minimapContainer) minimapContainer.style.display = 'none';
            return;
        } else {
            if (minimapContainer) minimapContainer.style.display = 'block';
        }

        const ctx = this.minimapCtx;
        const mapSize = 180;
        const scale = 0.05;

        ctx.fillStyle = '#1a2a1a';
        ctx.fillRect(0, 0, mapSize, mapSize);

        const centerX = mapSize / 2;
        const centerY = mapSize / 2;
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        const player = this.gameScene.player;
        this.gameScene.enemies.children.entries.forEach(enemy => {
            if (!enemy || !enemy.active) return;
            const dx = (enemy.x - player.x) * scale;
            const dy = (enemy.y - player.y) * scale;
            const mapX = centerX + dx;
            const mapY = centerY + dy;

            if (mapX >= 0 && mapX <= mapSize && mapY >= 0 && mapY <= mapSize) {
                ctx.fillStyle = '#d11721';
                ctx.beginPath();
                ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    handleModeChanged(mode, prev, options = {}) {
        this.isTrainingMode = (mode === 'training');

        // 미니맵 보이기/숨기기
        const minimapContainer = document.getElementById('minimap-container');
        if (minimapContainer) {
            minimapContainer.style.display = this.isTrainingMode ? 'none' : 'block';
        }

        // 버튼 텍스트/상태 업데이트
        const modeGameBtn = document.getElementById('mode-game-btn');
        const modeTrainingBtn = document.getElementById('mode-training-btn');
        if (this.isTrainingMode) {
            if (modeTrainingBtn) {
                modeTrainingBtn.style.opacity = '0.5';
                modeTrainingBtn.style.cursor = 'default';
                modeTrainingBtn.textContent = '훈련 모드 (현재)';
            }
            if (modeGameBtn) {
                modeGameBtn.style.opacity = null;
                modeGameBtn.style.cursor = 'pointer';
                modeGameBtn.textContent = '일반 모드';
            }
            // 씬 전환
            try { this.switchToMode('TrainingScene'); } catch (e) { console.warn('Failed to switch to TrainingScene:', e); }
        } else {
            if (modeGameBtn) {
                modeGameBtn.style.opacity = '0.5';
                modeGameBtn.style.cursor = 'default';
                modeGameBtn.textContent = '일반 모드 (현재)';
            }
            if (modeTrainingBtn) {
                modeTrainingBtn.style.opacity = null;
                modeTrainingBtn.style.cursor = 'pointer';
                modeTrainingBtn.textContent = '훈련 모드';
            }
            try { this.switchToMode('GameScene'); } catch (e) { console.warn('Failed to switch to GameScene:', e); }
        }
    }

    initMenuButtons() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || e.code === 'Escape') {
                e.preventDefault();
                this.handleEscapeKey();
            }
        });

        // 메인 메뉴 버튼
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.closeMainMenu();
            });
        }

        const modeGameBtn = document.getElementById('mode-game-btn');
        if (modeGameBtn) {
            modeGameBtn.addEventListener('click', (e) => {
                // 일반 모드로 전환 (in-memory, 기존 페이지 리다이렉트 대신)
                if (this.modeManager.getMode() === 'training') {
                    const options = { resetPlayerState: !!e.shiftKey };
                    this.modeManager.setMode('normal', { options });
                }
            });
        }
        
        const modeTrainingBtn = document.getElementById('mode-training-btn');
        if (modeTrainingBtn) {
            modeTrainingBtn.addEventListener('click', (e) => {
                // 훈련 모드로 전환 (in-memory)
                if (this.modeManager.getMode() !== 'training') {
                    const options = { resetPlayerState: !!e.shiftKey };
                    this.modeManager.setMode('training', { options });
                }
            });
        }

        // 현재 모드 표시 업데이트
        if (this.modeManager.isTraining()) {
            if (modeTrainingBtn) {
                modeTrainingBtn.style.opacity = '0.5';
                modeTrainingBtn.style.cursor = 'default';
                modeTrainingBtn.textContent = '훈련 모드 (현재)';
            }
        } else {
            if (modeGameBtn) {
                modeGameBtn.style.opacity = '0.5';
                modeGameBtn.style.cursor = 'default';
                modeGameBtn.textContent = '일반 모드 (현재)';
            }
        }

        // 일시정지 메뉴 버튼
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.closePauseMenu();
            });
        }

        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        const settingsCloseBtn = document.getElementById('settings-close-btn');
        if (settingsCloseBtn) {
            settingsCloseBtn.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (this.gameScene && this.gameScene.scene) {
                    this.gameScene.scene.restart();
                }
                this.closePauseMenu();
            });
        }

        const mainMenuBtn = document.getElementById('main-menu-btn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                this.closePauseMenu();
                this.openMainMenu();
            });
        }
        // 스탯 에디터 닫기
        const statEditorCloseBtn = document.getElementById('stat-editor-close-btn');
        if (statEditorCloseBtn) {
            statEditorCloseBtn.addEventListener('click', () => {
                this.closeStatEditor();
            });
        }
    }

    handleEscapeKey() {
        const settingsOpen = document.getElementById('settings-overlay')?.classList.contains('active');
        const inventoryOpen = document.getElementById('inventory-overlay')?.classList.contains('active');
        const pauseMenuOpen = document.getElementById('pause-menu-overlay')?.classList.contains('active');
        const mainMenuOpen = document.getElementById('main-menu-overlay')?.classList.contains('active');

        if (settingsOpen) {
            this.closeSettings();
        } else if (inventoryOpen) {
            if (this.gameScene && this.gameScene.player && this.gameScene.player.toggleInventory) {
                this.gameScene.player.toggleInventory();
            }
        } else if (mainMenuOpen) {
            // 메인 메뉴가 열려있으면 닫지 않음 (게임 시작 전)
            return;
        } else if (pauseMenuOpen) {
            this.closePauseMenu();
        } else {
            this.openPauseMenu();
        }
    }

    openMainMenu() {
        const overlay = document.getElementById('main-menu-overlay');
        if (overlay) {
            overlay.classList.add('active');
            if (this.gameScene && this.gameScene.scene) {
                this.gameScene.scene.pause();
                this._isPausedByUI = true;
            }
        }
    }

    closeMainMenu() {
        const overlay = document.getElementById('main-menu-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            if (this.gameScene && this.gameScene.scene) {
                this.gameScene.scene.resume();
                this._isPausedByUI = false;
            }
        }
    }

    openPauseMenu() {
        const overlay = document.getElementById('pause-menu-overlay');
        if (overlay) {
            overlay.classList.add('active');
            if (this.gameScene && this.gameScene.scene) {
                this.gameScene.scene.pause();
                this._isPausedByUI = true;
            }
        }
    }

    closePauseMenu() {
        const overlay = document.getElementById('pause-menu-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            if (this.gameScene && this.gameScene.scene) {
                this.gameScene.scene.resume();
                this._isPausedByUI = false;
            }
        }
    }

    openSettings() {
        document.getElementById('pause-menu-overlay')?.classList.remove('active');
        document.getElementById('settings-overlay')?.classList.add('active');
    }

    closeSettings() {
        document.getElementById('settings-overlay')?.classList.remove('active');
        document.getElementById('pause-menu-overlay')?.classList.add('active');
    }

    // Close any open menus/overlays and resume the game scene if paused
    closeMenu() {
        try {
            // Close known overlays
            document.getElementById('settings-overlay')?.classList.remove('active');
            document.getElementById('pause-menu-overlay')?.classList.remove('active');
            document.getElementById('main-menu-overlay')?.classList.remove('active');
            document.getElementById('inventory-overlay')?.classList.remove('active');
            document.getElementById('stat-editor-overlay')?.classList.remove('active');

            // Ensure the game scene is resumed if necessary. Only resume if the pause/main menu
            // was responsible for pausing (this._isPausedByUI) and none of those overlays remain active.
            if (this.gameScene && this.gameScene.scene) {
                const stillPaused = document.getElementById('pause-menu-overlay')?.classList.contains('active') ||
                    document.getElementById('main-menu-overlay')?.classList.contains('active');
                if (this._isPausedByUI && !stillPaused) {
                    try { this.gameScene.scene.resume(); } catch (e) { /* ignore */ }
                    this._isPausedByUI = false;
                }
            }
        } catch (e) {
            console.warn('[UIScene] closeMenu error:', e);
        }
    }

    updateEnemyHP(enemy) {
        const container = document.getElementById('enemy-hp-container');
        if (!container) return;
        
        if (!enemy || !enemy.active) {
            container.classList.remove('active');
            return;
        }

        try {
            container.classList.add('active');
            const nameEl = document.getElementById('enemy-name');
            const fillEl = document.getElementById('enemy-hp-fill');
            const textEl = document.getElementById('enemy-hp-text');

            const data = enemy.enemyData || enemy;
            if (!data) {
                container.classList.remove('active');
                return;
            }
            
            const hp = Math.max(0, Math.floor(data.hp || 0));
            const maxHp = data.maxHp || 100;
            const level = data.level || 1;

            if (nameEl) nameEl.textContent = `Lv.${level} Enemy`;
            if (fillEl) fillEl.style.width = `${(hp / maxHp) * 100}%`;
            if (textEl) textEl.textContent = `${hp}/${maxHp}`;
        } catch (e) {
            console.warn('Failed to update enemy HP UI:', e);
            container.classList.remove('active');
        }
    }

    switchToMode(sceneKey) {
        console.log('[UIScene] switchToMode called:', sceneKey);
        const currentKey = this.gameScene?.scene?.key;
        console.log('[UIScene] Current scene key:', currentKey);
        
        if (currentKey === sceneKey) {
            console.log('[UIScene] Already in target scene, closing menu');
            this.closeMenu();
            return;
        }

        // 메뉴 먼저 닫기
        this.closeMenu();

        // 기존 씬 정리
        if (currentKey) {
            try { 
                console.log('[UIScene] Stopping scene:', currentKey);
                // 이벤트 언바인딩
                if (this.gameScene) {
                    const gs = this.gameScene;
                    gs.events.off('playerStatsChanged', this.updateStats, this);
                    gs.events.off('playerDamaged', this.updateStats, this);
                    gs.events.off('playerXPGained', this.updateStats, this);
                    gs.events.off('playerLevelUp', this.updateStats, this);
                    gs.events.off('inventoryToggled', this.toggleInventoryUI, this);
                    gs.events.off('targetChanged', this.updateTargetInfo, this);
                    gs.events.off('enemyTargeted', this.updateEnemyHP, this);
                    gs.events.off('openStatEditor', this.openStatEditor, this);
                }
                this.scene.stop(currentKey); 
            } catch (e) {
                console.warn('Failed to stop scene:', e);
            }
        }
        
        // 새 씬 시작 (충분한 딜레이 확보)
        this.time.delayedCall(150, () => {
            try { 
                console.log('[UIScene] Starting scene:', sceneKey);
                this.scene.start(sceneKey); 
                console.log('[UIScene] scene.start() called successfully');
            } catch (e) { 
                console.error('[UIScene] Failed to start scene:', sceneKey, e); 
            }

            // 이벤트 재바인딩
            this.time.delayedCall(200, () => {
                console.log('[UIScene] Rebinding events to:', sceneKey);
                this.bindToGameScene(sceneKey);
            });
        });
    }

    bindToGameScene(sceneKey) {
        // 기존 이벤트 해제는 switchToMode에서 이미 처리됨
        
        // 새 참조 획득 (최대 3번 재시도)
        let retryCount = 0;
        const tryBind = () => {
            console.log('[UIScene] bindToGameScene - attempting to get scene:', sceneKey, 'retry:', retryCount);
            try { 
                this.gameScene = this.scene.get(sceneKey); 
                console.log('[UIScene] scene.get result:', this.gameScene ? 'success' : 'null');
            } catch (e) { 
                console.warn('[UIScene] scene.get error:', e);
                this.gameScene = null; 
            }
            
            if (!this.gameScene && retryCount < 3) {
                retryCount++;
                console.log('[UIScene] Scene not ready, retrying...');
                this.time.delayedCall(100, tryBind);
                return;
            }
            
            if (!this.gameScene) {
                console.error('[UIScene] Failed to bind to game scene after retries:', sceneKey);
                return;
            }
            
            console.log('[UIScene] Successfully got scene reference:', sceneKey);

            // 이벤트 재등록
            const gs = this.gameScene;
            gs.events.on('playerStatsChanged', this.updateStats, this);
            gs.events.on('playerDamaged', this.updateStats, this);
            gs.events.on('playerXPGained', this.updateStats, this);
            gs.events.on('playerLevelUp', this.updateStats, this);
            gs.events.on('inventoryToggled', this.toggleInventoryUI, this);
            gs.events.on('targetChanged', this.updateTargetInfo, this);
            gs.events.on('enemyTargeted', this.updateEnemyHP, this);
            gs.events.on('openStatEditor', this.openStatEditor, this);

            // 인벤토리/상태 갱신
            this.time.delayedCall(100, () => {
                if (gs.player && gs.player.stats) {
                    this.updateStats(gs.player.stats);
                    this.updateInventoryStats(gs.player.stats);
                }
            });
        };
        
        tryBind();
    }

    openStatEditor(type, target) {
        const overlay = document.getElementById('stat-editor-overlay');
        const title = document.getElementById('stat-editor-title');
        const content = document.getElementById('stat-editor-content');
        
        if (!overlay || !title || !content) return;

        this.statEditorTarget = target;
        this.statEditorType = type;

        if (type === 'player') {
            title.textContent = '플레이어 스탯 편집';
            const stats = target.stats;
            content.innerHTML = `
                <div class="stat-editor-row">
                    <span class="stat-editor-label">HP</span>
                    <input type="number" class="stat-editor-input" id="edit-hp" value="${Math.floor(stats.hp)}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">Max HP</span>
                    <input type="number" class="stat-editor-input" id="edit-maxhp" value="${stats.maxHp}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">SP</span>
                    <input type="number" class="stat-editor-input" id="edit-sp" value="${Math.floor(stats.sp)}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">Max SP</span>
                    <input type="number" class="stat-editor-input" id="edit-maxsp" value="${stats.maxSp}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">공격력</span>
                    <input type="number" class="stat-editor-input" id="edit-attack" value="${stats.attack}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">방어력</span>
                    <input type="number" class="stat-editor-input" id="edit-defense" value="${stats.defense}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">이동속도</span>
                    <input type="number" class="stat-editor-input" id="edit-speed" value="${stats.speed}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">대시속도</span>
                    <input type="number" class="stat-editor-input" id="edit-dashspeed" value="${stats.dashSpeed}">
                </div>
            `;
        } else if (type === 'bot') {
            title.textContent = '훈련 봇 스탯 편집';
            const data = target.enemyData;
            content.innerHTML = `
                <div class="stat-editor-row">
                    <span class="stat-editor-label">HP</span>
                    <input type="number" class="stat-editor-input" id="edit-bot-hp" value="${Math.floor(data.hp)}">
                </div>
                <div class="stat-editor-row">
                    <span class="stat-editor-label">Max HP</span>
                    <input type="number" class="stat-editor-input" id="edit-bot-maxhp" value="${data.maxHp}">
                </div>
            `;
        }

        overlay.classList.add('active');
    }

    closeStatEditor() {
        const overlay = document.getElementById('stat-editor-overlay');
        if (!overlay) return;

        // 값 적용
        if (this.statEditorTarget && this.statEditorType) {
            if (this.statEditorType === 'player') {
                const stats = this.statEditorTarget.stats;
                const hp = parseFloat(document.getElementById('edit-hp')?.value) || stats.hp;
                const maxHp = parseFloat(document.getElementById('edit-maxhp')?.value) || stats.maxHp;
                const sp = parseFloat(document.getElementById('edit-sp')?.value) || stats.sp;
                const maxSp = parseFloat(document.getElementById('edit-maxsp')?.value) || stats.maxSp;
                const attack = parseFloat(document.getElementById('edit-attack')?.value) || stats.attack;
                const defense = parseFloat(document.getElementById('edit-defense')?.value) || stats.defense;
                const speed = parseFloat(document.getElementById('edit-speed')?.value) || stats.speed;
                const dashSpeed = parseFloat(document.getElementById('edit-dashspeed')?.value) || stats.dashSpeed;

                stats.hp = hp;
                stats.maxHp = maxHp;
                stats.sp = sp;
                stats.maxSp = maxSp;
                stats.attack = attack;
                stats.defense = defense;
                stats.speed = speed;
                stats.dashSpeed = dashSpeed;

                this.updateStats(stats);
            } else if (this.statEditorType === 'bot') {
                const data = this.statEditorTarget.enemyData;
                const hp = parseFloat(document.getElementById('edit-bot-hp')?.value) || data.hp;
                const maxHp = parseFloat(document.getElementById('edit-bot-maxhp')?.value) || data.maxHp;

                data.hp = hp;
                data.maxHp = maxHp;

                if (this.gameScene) {
                    this.gameScene.events.emit('enemyTargeted', this.statEditorTarget);
                }
            }
        }

        overlay.classList.remove('active');
        this.statEditorTarget = null;
        this.statEditorType = null;
    }
}
