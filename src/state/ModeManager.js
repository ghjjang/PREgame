import Phaser from 'phaser';

/**
 * ModeManager
 * ----------------
 * A singleton in-memory mode controller used to determine whether the game runs
 * in 'normal' (GameScene) or 'training' (TrainingScene) mode. It extends
 * Phaser.Events.EventEmitter so scenes and systems can subscribe to mode changes.
 *
 * Usage:
 *  - ModeManager.initFromUrl('normal') // optional: set initial mode from URL
 *  - ModeManager.enableUrlSync({ pushHistory: true }) // optional: keep URL in sync
 *  - ModeManager.setMode('training') // switch mode and notify listeners
 *  - ModeManager.on('modeChanged', (mode, prev) => { /* update UI / scenes */ 
 /**
  * 
  */
 
class ModeManager extends Phaser.Events.EventEmitter {
    constructor() {
        super();
        this.mode = 'normal'; // 'normal' | 'training'
        this.urlSyncEnabled = false;
        this._ignoreNextPop = false;
        this._playerSnapshot = null; // { stats, x, y, preserve }
        this._originalPlayerSnapshot = null; // used when reset behavior requested
    }

    // parse current URL to a mode (training if pathname contains training.html or ?mode=training)
    /**
     * parseUrlToMode
     * Analyze the current window.location and url query params to determine
     * the mode encoded in the URL if present.
     * Returns 'training' | null
     */
    parseUrlToMode() {
        try {
            const params = new URLSearchParams(window.location.search);
            const modeParam = (params.get('mode') || '').toLowerCase();
            if (modeParam === 'training') return 'training';
            if (window.location.pathname && window.location.pathname.includes('training.html')) return 'training';
        } catch (e) {
            // ignore
        }
        return null;
    }

    /**
     * initFromUrl
     * Initialize the manager's mode from the URL. This is helpful when the
     * app directly loads a URL with 'mode=training' or 'training.html' path.
     * It sets the internal mode silently (no events triggered) and returns
     * the chosen mode.
     */
    initFromUrl(defaultMode = 'normal') {
        const parsed = this.parseUrlToMode();
        const initial = parsed || defaultMode || 'normal';
        // set initial mode silently
        this.mode = initial;
        return this.mode;
    }

    /**
     * enableUrlSync
     * Keep the URL query param `mode` in sync with ModeManager state. When true,
     * mode changes will push history entries (or replaceState), and popstate
     * events will update the in-memory mode.
     */
    enableUrlSync({ pushHistory = true } = {}) {
        if (this.urlSyncEnabled) return;
        this.urlSyncEnabled = true;
        // push initial state
        if (pushHistory) this.updateUrlFromMode(this.mode, true);

        // on mode changed, update history
        this.on('modeChanged', (mode) => {
            this.updateUrlFromMode(mode, pushHistory);
        });

        // listen to popstate
        window.addEventListener('popstate', (ev) => {
            if (this._ignoreNextPop) {
                this._ignoreNextPop = false;
                return;
            }
            const parsed = this.parseUrlToMode();
            if (parsed && parsed !== this.mode) {
                this.setMode(parsed);
            }
        });
    }

    /**
     * Subscribe to mode changes and immediately invoke the callback with the current mode.
     * Useful for scenes that are created after the mode has been set and need an initial event.
     */
    subscribeModeChange(callback, context) {
        try {
            // Immediately notify with current mode; prev unknown
            callback.call(context, this.mode, null, {});
        } catch (e) {
            // ignore
        }
        this.on('modeChanged', callback, context);
    }

    /**
     * updateUrlFromMode(mode, pushHistory) - update the URL from the given mode
     */
    updateUrlFromMode(mode, pushHistory = true) {
        try {
            const url = new URL(window.location.href);
            // prefer using query param to avoid breaking path structure
            url.searchParams.set('mode', mode);
            if (pushHistory) {
                this._ignoreNextPop = true;
                window.history.pushState({ mode }, '', url.toString());
            } else {
                window.history.replaceState({ mode }, '', url.toString());
            }
        } catch (e) {
            // ignore
        }
    }

    /**
     * setMode(mode, { silent })
     * Set the current mode in-memory. If silent=false it emits the 'modeChanged'
     * event with (mode, prevMode). Use silent to change mode without firing listeners.
     */
    setMode(mode, { silent = false, options = {} } = {}) {
        if (!mode) return;
        if (mode === this.mode) return;
        const prev = this.mode;
        this.mode = mode;
        if (!silent) this.emit('modeChanged', mode, prev, options);
    }

    getMode() {
        return this.mode;
    }

    isTraining() {
        return this.mode === 'training';
    }

    setPlayerSnapshot(snapshot) {
        this._playerSnapshot = snapshot;
    }

    getPlayerSnapshot() {
        return this._playerSnapshot;
    }

    consumePlayerSnapshot() {
        const s = this._playerSnapshot;
        this._playerSnapshot = null;
        return s;
    }
    setOriginalPlayerSnapshot(snapshot) {
        this._originalPlayerSnapshot = snapshot;
    }
    consumeOriginalPlayerSnapshot() {
        const s = this._originalPlayerSnapshot;
        this._originalPlayerSnapshot = null;
        return s;
    }
}

const manager = new ModeManager();
export default manager;
