(function(global){
    // SkillManager: 게임의 스킬(현재는 Dash)을 분리 관리합니다.
    const SkillManager = {
        attachDash(sprite, options = {}){
            // 기본값 설정 (기존 Canvas.js에서 사용하던 이름/형태 유지)
            sprite.dashMultiplier = options.dashMultiplier ?? sprite.dashMultiplier ?? 3;
            sprite.dashDuration = options.dashDuration ?? sprite.dashDuration ?? 12; // 프레임 단위
            sprite.dashCooldown = options.dashCooldown ?? sprite.dashCooldown ?? 0.5; // 초 단위

            sprite.dashTimer = sprite.dashTimer ?? 0; // 프레임 단위 남은 시간
            sprite.dashCooldownTimer = sprite.dashCooldownTimer ?? 0; // 초 단위 남은 쿨다운
            sprite.isDashing = sprite.isDashing ?? false;

            // baseSpeed는 Canvas에서 설정될 수도 있으므로 기본값만 보장
            sprite.baseSpeed = sprite.baseSpeed ?? 2;
        },

        /**
         * 대쉬 상태를 업데이트하고 적용 속도를 반환합니다.
         * @param {object} sprite
         * @param {object} keys - 키 상태 객체
         * @param {boolean} isMoving
         * @param {number} dt - 프레임 간 시간 간격(초)
         * @returns {number} 적용할 속도 (픽셀/프레임)
         */
        processDash(sprite, keys, isMoving, dt){
            // 시작 조건: 이동 중, Shift 누름, 쿨다운 끝남, 현재 대쉬 중 아님
            if (isMoving && (keys['Shift'] || keys['shift']) && !sprite.isDashing && (sprite.dashCooldownTimer <= 0)){
                sprite.isDashing = true;
                sprite.dashTimer = Math.max(0|0, sprite.dashDuration || 12);
                sprite.dashCooldownTimer = sprite.dashCooldown || 0.5;
            }

            // 적용 속도 계산
            const appliedSpeed = sprite.baseSpeed * (sprite.isDashing ? (sprite.dashMultiplier || 1) : 1);

            // 대쉬 지속시간(프레임 단위) 감소
            if (sprite.isDashing){
                sprite.dashTimer--;
                if (sprite.dashTimer <= 0){
                    sprite.isDashing = false;
                    sprite.dashTimer = 0;
                }
            }

            // 쿨다운은 초 단위로 감소 (dt 필요)
            const delta = dt || 0;
            if (sprite.dashCooldownTimer > 0){
                sprite.dashCooldownTimer = Math.max(0, sprite.dashCooldownTimer - delta);
            }

            return appliedSpeed;
        },

        // UI 등록: 대쉬 쿨다운 오버레이와 타이머 요소를 등록합니다.
        registerDashUI(overlayEl, timerEl) {
            // overlayEl/timerEl은 DOM 엘리먼트 또는 id 문자열이 될 수 있습니다.
            function resolve(el) {
                if (!el) return null;
                if (typeof el === 'string') return document.getElementById(el);
                return el;
            }
            this._dashUI = this._dashUI || {};
            this._dashUI.overlay = resolve(overlayEl);
            this._dashUI.timer = resolve(timerEl);
        },

        // 공격(Attack) 관련 등록/처리
        attachAttack(sprite, options = {}){
            sprite.attackCooldown = options.attackCooldown ?? sprite.attackCooldown ?? 1.0; // 초 단위
            sprite.attackDuration = options.attackDuration ?? sprite.attackDuration ?? 6; // 프레임 단위 (애니메이션/이펙트 길이)
            sprite.attackDamage = options.attackDamage ?? sprite.attackDamage ?? 5; // 기본 데미지
            sprite.attackRange = options.attackRange ?? sprite.attackRange ?? 36; // 픽셀 단위 사거리
            // 공격 각도(도 단위) - 공격이 원호 형태라면 이 값의 절반 각도 내에 있어야 히트
            sprite.attackAngle = options.attackAngle ?? sprite.attackAngle ?? 90; // 도(각도 단위)
            sprite.attackTimer = sprite.attackTimer ?? 0; // 프레임 단위 남은 공격 시간
            sprite.attackCooldownTimer = sprite.attackCooldownTimer ?? 0; // 초 단위 남은 쿨다운
            sprite.isAttacking = sprite.isAttacking ?? false;
        },

        registerAttackUI(overlayEl, timerEl) {
            function resolve(el) {
                if (!el) return null;
                if (typeof el === 'string') return document.getElementById(el);
                return el;
            }
            this._attackUI = this._attackUI || {};
            this._attackUI.overlay = resolve(overlayEl);
            this._attackUI.timer = resolve(timerEl);
        },

        // 공격 시작(외부 트리거: 키 또는 클릭)
        startAttack(sprite) {
            if (!sprite) return false;
            if (sprite.attackCooldownTimer > 0) return false;
            sprite.isAttacking = true;
            sprite.attackTimer = Math.max(0|0, sprite.attackDuration || 6);
            sprite.attackCooldownTimer = sprite.attackCooldown || 1.0;
            return true;
        },

        // 프레임마다 SkillManager가 처리해야 할 업데이트를 수행합니다.
        // (쿨다운 감소 및 UI 갱신)
        update(sprite, dt) {
            if (!sprite) return;
            // 쿨다운 감소(초 단위)
            const delta = dt || 0;
            if (sprite.dashCooldownTimer > 0) {
                sprite.dashCooldownTimer = Math.max(0, sprite.dashCooldownTimer - delta);
            }

            // 공격 쿨다운 감소
            if (sprite.attackCooldownTimer > 0) {
                sprite.attackCooldownTimer = Math.max(0, sprite.attackCooldownTimer - delta);
            }

            // 공격 지속시간(프레임 단위) 감소
            if (sprite.isAttacking) {
                sprite.attackTimer--;
                if (sprite.attackTimer <= 0) {
                    sprite.isAttacking = false;
                    sprite.attackTimer = 0;
                }
            }

            // UI 갱신
            if (this._dashUI) {
                const overlay = this._dashUI.overlay;
                const timer = this._dashUI.timer;
                const cooldown = sprite.dashCooldown || 0;
                const remaining = sprite.dashCooldownTimer || 0;
                if (overlay && timer && cooldown > 0 && remaining > 0) {
                    const frac = remaining / cooldown;
                    overlay.style.height = (frac * 100) + "%";
                    timer.textContent = Math.ceil(remaining).toString();
                } else if (overlay && timer) {
                    overlay.style.height = "0%";
                    timer.textContent = "";
                }
            }

            // 공격 UI 갱신
            if (this._attackUI) {
                const overlay = this._attackUI.overlay;
                const timer = this._attackUI.timer;
                const cooldown = sprite.attackCooldown || 0;
                const remaining = sprite.attackCooldownTimer || 0;
                if (overlay && timer && cooldown > 0 && remaining > 0) {
                    const frac = remaining / cooldown;
                    overlay.style.height = (frac * 100) + "%";
                    timer.textContent = Math.ceil(remaining).toString();
                } else if (overlay && timer) {
                    overlay.style.height = "0%";
                    timer.textContent = "";
                }
            }
        },
        // 외부에서 강제 발동 (예: 클릭으로 스킬 사용)
        startDash(sprite) {
            if (!sprite) return false;
            if (sprite.dashCooldownTimer > 0) return false;
            sprite.isDashing = true;
            sprite.dashTimer = Math.max(0|0, sprite.dashDuration || 12);
            sprite.dashCooldownTimer = sprite.dashCooldown || 0.5;
            return true;
        },

        // 편의 함수: 쿨다운 여유 비율(0..1)
        getDashCooldownFraction(sprite){
            if (!sprite.dashCooldown || sprite.dashCooldown <= 0) return 0;
            return Math.max(0, Math.min(1, sprite.dashCooldownTimer / sprite.dashCooldown));
        }
        ,
        getAttackCooldownFraction(sprite){
            if (!sprite.attackCooldown || sprite.attackCooldown <= 0) return 0;
            return Math.max(0, Math.min(1, sprite.attackCooldownTimer / sprite.attackCooldown));
        }
    };

    global.SkillManager = SkillManager;
})(window);
