# ModeManager

ModeManager는 게임 모드를 in-memory로 관리하는 싱글톤입니다. `normal`(메인 게임)과 `training`(훈련 모드) 두 가지 모드를 지원합니다.

주요 특징
- `ModeManager.setMode(mode)`로 모드를 변경할 수 있습니다.
- `ModeManager.on('modeChanged', cb)`에서 모드 변경을 수신할 수 있습니다.
- `ModeManager.initFromUrl(defaultMode)`로 URL 기반 초기 모드 설정을 수행합니다.
- `ModeManager.enableUrlSync({ pushHistory: true })`로 모드 변경 시 URL(query param `mode`)을 동기화할 수 있습니다.

API 예시

```js
import ModeManager from './src/state/ModeManager.js';

// 초기화: URL 파라미터 기반으로 초기 모드 결정
ModeManager.initFromUrl('normal');

// 모드 변경 시 URL 업데이트 (pushState) 활성화
ModeManager.enableUrlSync({ pushHistory: true });

// 모드 변경
ModeManager.setMode('training');
// If you want to reset the player's stats when switching modes, pass options
ModeManager.setMode('training', { options: { resetPlayerState: true } });


// 모드 변경 수신
ModeManager.on('modeChanged', (mode, prev) => {
  console.log('mode changed', mode, 'prev', prev);
});
```

유의사항
- SPA에서 동작하도록 `main.js`가 ModeManager를 초기화하고 `BootScene`을 시작하므로, 다른 진입점이 있을 때는 ModeManager 초기화를 확인하세요.
- `enableUrlSync()`는 브라우저 `history`를 조작하므로 일반적인 SPA 구조에서 사용하시길 권장합니다.
