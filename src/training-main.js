/*
 * training-main.js - DEPRECATED
 * This entry is now replaced by single SPA entry `/src/main.js`.
 * Left as a compatibility placeholder.
 */

// Deprecated wrapper — do not use in new SPA flows
import './main.js';

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

// Deprecated. Expose nothing; main.js should handle game creation.
export default null;
