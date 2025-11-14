    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    // Retina 디스플레이 대응
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    function update(dt) {
        // 이전 상태 저장
        sprite.isMoving = false;

        // 1) 마우스 위치를 기반으로 캐릭터 방향 설정 (항상 우선)
        const mx = mouse.worldX - sprite.worldX;
        const my = mouse.worldY - sprite.worldY;
        const distToMouse = Math.hypot(mx, my);
        if (distToMouse > 1) {
            const angle = Math.atan2(my, mx); // -PI..PI, 0 = right
            let deg = (angle * 180) / Math.PI;
            if (deg < 0) deg += 360;

            // 4방향 우선 매핑: right(315..45), down(45..135), left(135..225), up(225..315)
            if (deg >= 315 || deg < 45) {
                sprite.direction = 'right'; sprite.row = 2;
            } else if (deg >= 45 && deg < 135) {
                sprite.direction = 'down'; sprite.row = 0;
            } else if (deg >= 135 && deg < 225) {
                sprite.direction = 'left'; sprite.row = 3;
            } else {
                sprite.direction = 'up'; sprite.row = 1;
            }
        }

        // 2) 입력 기반 이동 처리
        let dx = 0, dy = 0;
        if (keys["ArrowRight"]) dx += 1;
        if (keys["ArrowLeft"]) dx -= 1;
        if (keys["ArrowUp"]) dy -= 1;
        if (keys["ArrowDown"]) dy += 1;

        // 대각선 정규화
        if (dx !== 0 && dy !== 0) {
            const n = 1 / Math.sqrt(2);
            dx *= n; dy *= n;
        }

        if (dx !== 0 || dy !== 0) {
            let appliedSpeed;
            if (typeof SkillManager !== 'undefined') {
                appliedSpeed = SkillManager.processDash(sprite, keys, true, dt);
            } else {
                if ((keys["Shift"] || keys["shift"]) && !sprite.isDashing && sprite.dashCooldownTimer <= 0) {
                    sprite.isDashing = true;
                    sprite.dashTimer = sprite.dashDuration;
                    sprite.dashCooldownTimer = sprite.dashCooldown;
                }
                appliedSpeed = sprite.baseSpeed * (sprite.isDashing ? sprite.dashMultiplier : 1);
                if (sprite.isDashing) {
                    sprite.dashTimer--;
                    if (sprite.dashTimer <= 0) { sprite.isDashing = false; sprite.dashTimer = 0; }
                }
                if (sprite.dashCooldownTimer > 0) sprite.dashCooldownTimer = Math.max(0, sprite.dashCooldownTimer - (dt || 0));
            }

            sprite.worldX += dx * appliedSpeed;
            sprite.worldY += dy * appliedSpeed;
            sprite.isMoving = true;

            // 카메라 목표 위치 업데이트
            camera.targetX = sprite.worldX - rect.width / (2 * dpr);
            camera.targetY = sprite.worldY - rect.height / (2 * dpr);

            camera.x += (camera.targetX - camera.x) * camera.smoothness;
            camera.y += (camera.targetY - camera.y) * camera.smoothness;

            sprite.x = sprite.worldX - camera.x;
            sprite.y = sprite.worldY - camera.y;
        }

        // 적 간단 AI
        for (const e of enemies) {
            if (!e.alive) continue;
            const ex = sprite.worldX - e.worldX;
            const ey = sprite.worldY - e.worldY;
            const dist = Math.hypot(ex, ey);
            if (dist > 1) {
                const nx = ex / dist, ny = ey / dist;
                const speed = e.speed || 0;
                e.worldX += nx * speed * (dt || 0);
                e.worldY += ny * speed * (dt || 0);
            }
        }

        // 파티클 업데이트
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.12;
            p.vx *= 0.99; p.vy *= 0.995;
            p.life -= 1;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }
        alive: true, // 생존 상태
        lastHitByAttackId: null
    });    
    

    // attack id 증가로 한 공격에서 중복 히트 방지
    sprite._attackId = sprite._attackId || 0;

    // 마우스 위치 추적
    const mouse = {
        x: 0,
        y: 0,
        worldX: 0,
        worldY: 0,
        targetedEnemy: null
    };

    // 마우스 이동 이벤트
    document.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        
        // 화면 좌표를 월드 좌표로 변환
        mouse.worldX = mouse.x / sprite.scale + camera.x;
        mouse.worldY = mouse.y / sprite.scale + camera.y;
    });

    // 떠다니는 데미지 텍스트
    const floatTexts = [];

    // 이펙트용 파티클
    const particles = [];

    function performAttackHit() {
    sprite._attackId = (sprite._attackId || 0) + 1;
    const attackId = sprite._attackId;
    const range = sprite.attackRange || 36;
    const damage = sprite.attackDamage || 1;

    // 1️⃣ 방향 벡터 계산
    let fx = 0, fy = 0;
    if (sprite.direction === 'right') fx = 1;
    else if (sprite.direction === 'left') fx = -1;
    else if (sprite.direction === 'up') fy = -1;
    else if (sprite.direction === 'down') fy = 1;

    const halfAngleRad = (Math.max(0, sprite.attackAngle || 90) * 0.5) * (Math.PI / 180);
    const cosHalf = Math.cos(halfAngleRad);
    const forwardLen = Math.hypot(fx, fy) || 1; // 방향 벡터 길이 (0 방지)

    let anyHit = false;

    for (const e of enemies) {
        if (!e.alive) continue;

        // 2️⃣ 거리 계산
        const dx = e.worldX - sprite.worldX;
        const dy = e.worldY - sprite.worldY;
        const dist = Math.hypot(dx, dy);
        if (dist > range) continue;

        // 3️⃣ 각도 검사 (내적 기반)
        let inFront = true;
        if (!(fx === 0 && fy === 0)) {
            const dot = (dx * fx + dy * fy) / (dist * forwardLen);
            inFront = dot >= cosHalf; // 내적값이 cos(θ/2) 이상이면 범위 내
        }

        // 4️⃣ 피격 처리
        if (inFront) {
            if (e.lastHitByAttackId === attackId) continue;
            e.lastHitByAttackId = attackId;
            e.hp -= damage;
            anyHit = true;

            // 💥 이펙트
            floatTexts.push({
                x: e.worldX - camera.x,
                y: e.worldY - camera.y - 10,
                t: 0,
                text: `-${damage}`
            });

            for (let p = 0; p < 10; p++) {
                const ang = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2.5;
                particles.push({
                    x: e.worldX - camera.x,
                    y: e.worldY - camera.y,
                    vx: Math.cos(ang) * speed,
                    vy: Math.sin(ang) * speed,
                    life: 30 + Math.random() * 20,
                    color: ['orange', 'yellow', 'white'][Math.floor(Math.random() * 3)],
                    size: 2 + Math.random() * 2
                });
            }

            // 💥 넉백
            const nx = dx / Math.max(1, dist);
            const ny = dy / Math.max(1, dist);
            const knock = 20;
            e.worldX += nx * knock;
            e.worldY += ny * knock;

            if (e.hp <= 0) e.alive = false;
        }
    }

    // 히트가 발생하면 화면 흔들림 및 사운드 재생
    if (anyHit) {
        camera.shakeTimer = 0.28;
        camera.shakeIntensity = 8;
        try {
            const s = new Audio('./sound/attack.wav');
            s.volume = 0.8;
            s.play().catch(()=>{});
        } catch (err) {}
    }

    return anyHit;
}

            // 타겟 정보 UI 업데이트
            function updateTargetUI() {
                const targetInfoEl = document.getElementById('target-info');
        
                if (mouse.targetedEnemy && mouse.targetedEnemy.alive) {
                    targetInfoEl.style.display = 'block';
            
                    document.getElementById('target-name').textContent = mouse.targetedEnemy.name;
                    document.getElementById('target-hp-text').textContent = 
                        `${Math.ceil(mouse.targetedEnemy.hp)}/${mouse.targetedEnemy.maxHp}`;
            
                    const hpPercent = (mouse.targetedEnemy.hp / mouse.targetedEnemy.maxHp) * 100;
                    const hpFill = document.getElementById('target-hp-fill');
                    hpFill.style.width = hpPercent + '%';
            
                    // HP에 따라 색상 변경
                    if (hpPercent > 50) {
                        hpFill.style.background = 'linear-gradient(90deg, #00ff00, #00aa00)';
                    } else if (hpPercent > 25) {
                        hpFill.style.background = 'linear-gradient(90deg, #ffaa00, #ff8800)';
                    } else {
                        hpFill.style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
                    }
                } else {
                    targetInfoEl.style.display = 'none';
                }
            }
        // 마우스 좌클릭 이벤트 (공격 + 적 타겟팅)
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // 좌클릭
                // 적 타겟팅 확인
                let hitTarget = false;
                for (const enemy of enemies) {
                    if (!enemy.alive) continue;
                    const dx = enemy.worldX - mouse.worldX;
                    const dy = enemy.worldY - mouse.worldY;
                    const dist = Math.hypot(dx, dy);
                
                    // 적의 반지름 범위 내에 클릭했으면 타겟팅
                    if (dist <= enemy.radius + 10) {
                        mouse.targetedEnemy = enemy;
                        hitTarget = true;
                        break;
                    }
                }
            
                // 타겟팅하지 못했으면 초기화
                if (!hitTarget) {
                    mouse.targetedEnemy = null;
                }
            
                // 공격 실행
                startAttackAction();
            }
        });

    

    // 초기 카메라 위치를 스프라이트 월드 위치 기준으로 맞춰 순간이동(점프) 방지
    // sprite.worldX/worldY는 월드 좌표, sprite.x/y는 화면(상대) 좌표
    camera.targetX = sprite.worldX - rect.width / (2 * dpr);
    camera.targetY = sprite.worldY - rect.height / (2 * dpr);
    camera.x = camera.targetX;
    camera.y = camera.targetY;

    // 화면상의 상대 좌표를 초기화
    sprite.x = sprite.worldX - camera.x;
    sprite.y = sprite.worldY - camera.y;

         

        const keys = {};

    document.addEventListener("keydown", (e) => (keys[e.key] = true));
    document.addEventListener("keyup", (e) => (keys[e.key] = false));

    // lastTimestamp는 requestAnimationFrame이 전달하는 타임스탬프를 저장합니다.
    let lastTimestamp = null;

    function update(dt) {
        // 이전 상태 저장
        sprite.isMoving = false;
        // 마우스 위치를 기반으로 캐릭터 방향 업데이트
        const mouseToPlayerX = mouse.worldX - sprite.worldX;
        const mouseToPlayerY = mouse.worldY - sprite.worldY;
        
        if (Math.hypot(mouseToPlayerX, mouseToPlayerY) > 0) {
            // 각도 계산 (라디안)
            const angle = Math.atan2(mouseToPlayerY, mouseToPlayerX);
            
            // 각도를 8방향으로 변환 (0도 = 오른쪽, 90도 = 아래쪽)
            // 각 방향은 45도 범위
            const deg = (angle * 180) / Math.PI;
            
            if (deg >= -22.5 && deg < 22.5) {
                sprite.direction = 'right';
                sprite.row = 2;
            } else if (deg >= 22.5 && deg < 67.5) {
                sprite.direction = 'down';
                sprite.row = 0;
            } else if (deg >= 67.5 && deg < 112.5) {
                sprite.direction = 'down';
                sprite.row = 0;
            } else if (deg >= 112.5 && deg < 157.5) {
                sprite.direction = 'left';
                sprite.row = 3;
            } else if (deg >= 157.5 || deg < -157.5) {
                sprite.direction = 'left';
                sprite.row = 3;
            } else if (deg >= -157.5 && deg < -112.5) {
                sprite.direction = 'left';
                sprite.row = 3;
            } else if (deg >= -112.5 && deg < -67.5) {
                sprite.direction = 'up';
                sprite.row = 1;
            } else if (deg >= -67.5 && deg < -22.5) {
                        // 마우스 위치를 기반으로 캐릭터 방향 업데이트
                        const mouseToPlayerX = mouse.worldX - sprite.worldX;
                        const mouseToPlayerY = mouse.worldY - sprite.worldY;
        
                        const distToMouse = Math.hypot(mouseToPlayerX, mouseToPlayerY);
                        if (distToMouse > 1) {
                            // 각도 계산 (atan2: 범위 -π ~ π, 0 = 오른쪽, π/2 = 아래, -π/2 = 위)
                            const angle = Math.atan2(mouseToPlayerY, mouseToPlayerX);
                            const deg = (angle * 180) / Math.PI;
            
                            // 8방향 판정 (45도씩 분할)
                            if (deg >= -22.5 && deg < 22.5) {
                                sprite.direction = 'right';
                                sprite.row = 2;
                            } else if (deg >= 22.5 && deg < 67.5) {
                                sprite.direction = 'down';
                                sprite.row = 0;
                            } else if (deg >= 67.5 && deg < 112.5) {
                                sprite.direction = 'down';
                                sprite.row = 0;
                            } else if (deg >= 112.5 && deg < 157.5) {
                                sprite.direction = 'left';
                                sprite.row = 3;
                            } else if (deg >= 157.5 || deg < -157.5) {
                                sprite.direction = 'left';
                                sprite.row = 3;
                            } else if (deg >= -157.5 && deg < -112.5) {
                                sprite.direction = 'left';
                                sprite.row = 3;
                            } else if (deg >= -112.5 && deg < -67.5) {
                                sprite.direction = 'up';
                                sprite.row = 1;
                            } else if (deg >= -67.5 && deg < -22.5) {
                                sprite.direction = 'up';
                                sprite.row = 1;
                            }
                        }
                sprite.direction = 'up';
                sprite.row = 1;
            }
        }


        // 이동 방향 계산
        let dx = 0;
        let dy = 0;

        if (keys["ArrowRight"]) dx += 1;
        if (keys["ArrowLeft"]) dx -= 1;
        if (keys["ArrowUp"]) dy -= 1;
        if (keys["ArrowDown"]) dy += 1;


        // 대각선 이동시 속도 정규화 (1.414배가 되지 않도록)
        if (dx !== 0 && dy !== 0) {
            const normalizer = 1 / Math.sqrt(2);
            dx *= normalizer;
            dy *= normalizer;
        }

        // 이동 적용
        if (dx !== 0 || dy !== 0) {
            // SkillManager가 있으면 대쉬 로직을 위임하고 적용 속도를 받습니다.
            let appliedSpeed;
            if (typeof SkillManager !== 'undefined') {
                appliedSpeed = SkillManager.processDash(sprite, keys, true, dt);
            } else {
                // 폴백: 기존 동작 유지(간단한 대쉬 체크)
                if ((keys["Shift"] || keys["shift"]) && !sprite.isDashing && sprite.dashCooldownTimer <= 0) {
                    sprite.isDashing = true;
                    sprite.dashTimer = sprite.dashDuration;
                    sprite.dashCooldownTimer = sprite.dashCooldown;
                }
                appliedSpeed = sprite.baseSpeed * (sprite.isDashing ? sprite.dashMultiplier : 1);
                // 폴백 타이머 감소(프레임/초 혼합일 수 있음)
                if (sprite.isDashing) {
                    sprite.dashTimer--;
                    if (sprite.dashTimer <= 0) {
                        sprite.isDashing = false;
                        sprite.dashTimer = 0;
                    }
                }
                if (sprite.dashCooldownTimer > 0) sprite.dashCooldownTimer = Math.max(0, sprite.dashCooldownTimer - (dt || 0));
            }

            sprite.worldX += dx * appliedSpeed;
            sprite.worldY += dy * appliedSpeed;
            sprite.isMoving = true;

            // 카메라 목표 위치 업데이트 (캐릭터의 월드 좌표를 따라감)
            camera.targetX = sprite.worldX - rect.width / (2 * dpr);
            camera.targetY = sprite.worldY - rect.height / (2 * dpr);

            // 부드러운 카메라 이동
            camera.x += (camera.targetX - camera.x) * camera.smoothness;
            camera.y += (camera.targetY - camera.y) * camera.smoothness;

            // 화면상의 상대 좌표 계산
            sprite.x = sprite.worldX - camera.x;
            sprite.y = sprite.worldY - camera.y;

            // 방향 결정 (8방향)
            if (dx > 0 && dy === 0) {
                sprite.direction = 'right';
                sprite.row = 2;
            } else if (dx < 0 && dy === 0) {
                sprite.direction = 'left';
                sprite.row = 3;
            } else if (dx === 0 && dy < 0) {
                sprite.direction = 'up';
                sprite.row = 1;
            } else if (dx === 0 && dy > 0) {
                sprite.direction = 'down';
                sprite.row = 0;
            } else if (dx > 0 && dy < 0) {
                sprite.direction = 'right'; // 우상
                sprite.row = 2;
            } else if (dx < 0 && dy < 0) {
                sprite.direction = 'left';  // 좌상
                sprite.row = 3;
            } else if (dx > 0 && dy > 0) {
                sprite.direction = 'right'; // 우하
                sprite.row = 2;
            } else if (dx < 0 && dy > 0) {
                sprite.direction = 'left';  // 좌하
                sprite.row = 3;
            }
        }

        // 대쉬 타이머/쿨다운은 SkillManager에서 처리합니다.
    // 적 AI: 
        for (const e of enemies) {
            if (!e.alive) continue;
            const dx = sprite.worldX - e.worldX;
            const dy = sprite.worldY - e.worldY;
            const dist = Math.hypot(dx, dy);
            if (dist > 1) {
                const nx = dx / dist;
                const ny = dy / dist;
                const speed = e.speed || 0; // 초당 이동 속도 (픽셀)
                e.worldX += nx * speed * (dt || 0);
                e.worldY += ny * speed * (dt || 0);
            }
        }

    // 파티클 업데이트
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12; // 약간의 중력 효과
            p.vx *= 0.99; p.vy *= 0.995;
            p.life -= 1;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 배경 그리드 그리기
    const gridSize = 32;
    // 카메라 흔들림용 오프셋
    const shakeX = (camera.shakeTimer > 0) ? (Math.random() * 2 - 1) * camera.shakeIntensity : 0;
    const shakeY = (camera.shakeTimer > 0) ? (Math.random() * 2 - 1) * camera.shakeIntensity : 0;
    const offsetX = -camera.x % gridSize + shakeX;
    const offsetY = -camera.y % gridSize + shakeY;

        // 배경 스타일 설정
        ctx.strokeStyle = '#cccccc9f';
        ctx.lineWidth = 1;

        // 수직선 그리기
        for (let x = offsetX; x <= rect.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, rect.height);
            ctx.stroke();
        }

        // 수평선 그리기
        for (let y = offsetY; y <= rect.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(rect.width, y);
            ctx.stroke();
        }

        // 움직일 때만 프레임 인덱스 업데이트
        if (sprite.isMoving) {
            // ping-pong 주기: 2 * totalFrames - 2 (totalFrames <=1 인 경우는 예외)
            const total = Math.max(1, sprite.totalFrames);
            const period = total <= 1 ? 1 : 2 * total - 2;
            // 대쉬 중이면 애니메이션 속도를 약간 증가시켜 빠르게 보이게 함
            const usedAnimSpeed = sprite.animationSpeed * (sprite.isDashing ? 1.5 : 1);
                // 공격 중이면 애니메이션 속도를 빠르게 해서 공격 모션처럼 보이게 함
                const attackAnimMul = sprite.isAttacking ? 2 : 1;
                sprite.frameIndex = (sprite.frameIndex + usedAnimSpeed * attackAnimMul) % period;
            sprite.currentFrame = getPingPongFrame(sprite.frameIndex, total);
        } else {
            sprite.frameIndex = 0;
            sprite.currentFrame = 0;
        }

        // 플레이어 그리기
        ctx.drawImage(
            playerImage,
            sprite.currentFrame * sprite.frameWidth, // X (프레임)
            sprite.row * sprite.frameHeight,         // Y (방향)
            sprite.frameWidth,
            sprite.frameHeight,
            sprite.x,
            sprite.y,
            sprite.frameWidth * sprite.scale,
            sprite.frameHeight * sprite.scale
        );
        
        // 🧭 공격 사거리 디버그 표시
        const px = sprite.x + (sprite.frameWidth * sprite.scale) / 2;
        const py = sprite.y + (sprite.frameHeight * sprite.scale) / 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,255,0,0.4)'; // 연한 초록색 원
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, sprite.attackRange, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 사거리 숫자도 표시
        ctx.fillStyle = 'lime';
        ctx.font = '12px monospace';
        ctx.fillText(`range: ${sprite.attackRange}px`, px - 20, py - sprite.attackRange - 5);

        // 공격 이펙트 (간단한 플래시/원형 범위)
        if (sprite.isAttacking) {
            const range = sprite.attackRange || 36;
            // 화면상의 플레이어 중심
            const px = sprite.x + (sprite.frameWidth * sprite.scale) / 2;
            const py = sprite.y + (sprite.frameHeight * sprite.scale) / 2;
            // 방향에 따른 오프셋
            let ox = 0, oy = 0;
            if (sprite.direction === 'right') ox = range * 0.7;
            else if (sprite.direction === 'left') ox = -range * 0.7;
            else if (sprite.direction === 'up') oy = -range * 0.7;
            else if (sprite.direction === 'down') oy = range * 0.7;
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(px + ox, py + oy, range, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 적 그리기
        for (const e of (typeof enemies !== 'undefined' ? enemies : [])) {
            const ex = e.worldX - camera.x;
            const ey = e.worldY - camera.y;
            if (!e.alive) {
                // 사망: 회색 원을 그리거나 건너뜀
                ctx.fillStyle = '#555';
                ctx.beginPath();
                ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.fillText('X', ex - 4, ey + 4);
                continue;
            }
            ctx.fillStyle = 'crimson';
            ctx.beginPath();
            ctx.arc(ex, ey, e.radius, 0, Math.PI * 2);
            ctx.fill();
            // hp bar
            ctx.fillStyle = 'black';
            ctx.fillRect(ex - 16, ey - e.radius - 10, 32, 6);
            ctx.fillStyle = 'limegreen';
            const hpFrac = Math.max(0, Math.min(1, e.hp / 5));
            ctx.fillRect(ex - 16, ey - e.radius - 10, 32 * hpFrac, 6);
        }

    // 떠다니는 데미지 텍스트
        for (let i = floatTexts.length - 1; i >= 0; i--) {
            const ft = floatTexts[i];
            // advance
            ft.t += 1;
            ft.y -= 0.6; // float up
            ctx.fillStyle = 'white';
            ctx.font = '14px sans-serif';
            ctx.fillText(ft.text, ft.x, ft.y);
            if (ft.t > 40) floatTexts.splice(i, 1);
        }

        // particles draw
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            ctx.fillStyle = p.color || 'orange';
            ctx.beginPath();
            ctx.arc(p.x + (camera.shakeTimer>0? (Math.random()*2-1)*camera.shakeIntensity:0), p.y, p.size || 2, 0, Math.PI*2);
            ctx.fill();
            if (p.life <= 0) particles.splice(i, 1);
        }

        // 타겟팅된 적 정보 표시
        if (mouse.targetedEnemy && mouse.targetedEnemy.alive) {
            const targetScreenX = mouse.targetedEnemy.worldX - camera.x;
            const targetScreenY = mouse.targetedEnemy.worldY - camera.y;

            // 적 위에 테두리 그리기
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(targetScreenX, targetScreenY, mouse.targetedEnemy.radius + 4, 0, Math.PI * 2);
            ctx.stroke();

            // 적 위에 정보 표시
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';

            // 이름 표시
            ctx.fillText(mouse.targetedEnemy.name, targetScreenX, targetScreenY - mouse.targetedEnemy.radius - 20);

            // HP 바 표시
            const barWidth = 40;
            const barHeight = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                targetScreenX - barWidth / 2,
                targetScreenY - mouse.targetedEnemy.radius - 30,
                barWidth,
                barHeight
            );

            const hpPercent = mouse.targetedEnemy.hp / mouse.targetedEnemy.maxHp;
            ctx.fillStyle = hpPercent > 0.5 ? 'limegreen' : (hpPercent > 0.25 ? 'orange' : 'red');
            ctx.fillRect(
                targetScreenX - barWidth / 2,
                targetScreenY - mouse.targetedEnemy.radius - 30,
                barWidth * hpPercent,
                barHeight
            );

            // HP 텍스트
            ctx.fillStyle = 'white';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${Math.ceil(mouse.targetedEnemy.hp)}/${mouse.targetedEnemy.maxHp}`,
                targetScreenX,
                targetScreenY - mouse.targetedEnemy.radius - 35
            );
        }
    }

    // 타겟 정보 UI 업데이트
    updateTargetUI();
// 게임 루프
function gameLoop(timestamp) {
    if (lastTimestamp === null) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000; // 초 단위
    lastTimestamp = timestamp;

    update(dt);
    // SkillManager가 있으면 per-frame 업데이트(쿨다운 감소 및 UI 갱신)를 수행
    if (typeof SkillManager !== 'undefined' && typeof SkillManager.update === 'function') {
        SkillManager.update(sprite, dt);
    }
    // camera shake timer decrease
    if (camera.shakeTimer > 0) camera.shakeTimer = Math.max(0, camera.shakeTimer - dt);
    draw();
    requestAnimationFrame(gameLoop);
}

// 게임 시작
requestAnimationFrame(gameLoop);
