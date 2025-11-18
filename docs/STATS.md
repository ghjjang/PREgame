# 스탯 설계 제안

본 문서는 현재 플레이어 스탯을 확장하기 위한 추가 스탯과 운영 가이드를 정리합니다. 아이템/버프/레벨업과 자연스럽게 연동되도록 범주별로 구성했습니다.

## 현재 스탯 (Player.js 기준)
- level, xp, maxXp
- hp, maxHp
- sp, maxSp
- attack, defense
- speed, dashSpeed
- 상태/타이머: isDashing, isAttacking, invincible, dashCooldown, dashDuration, invincibleTimer

## 추가 스탯 제안

### 공격
- critChance: 치명타 확률 (0~1)
- critDamage: 치명타 배율 (기본 1.5~2.0)
- attackSpeed: 공격 속도 배율 (모션/쿨 간격 단축)
- cooldownReduction: 스킬/행동 쿨다운 감소 (0~0.4 권장)
- armorPenetration: 방어 무시 (고정/비율 옵션)
- elementalDamageX: 속성 추가 피해 (fire/ice/lightning 등)
- onHitDOT: 출혈/화상 등 초당 피해 부여

### 방어/생존
- dodgeChance: 회피 확률 (0~0.3)
- blockChance, blockValue: 일정 피해 흡수
- damageReduction: 최종 피해 감소 비율
- resistX: 속성 저항 (fire/ice/lightning 등)
- thorns: 반사 피해
- shield, shieldRegen: 재생형 보호막 (HP와 분리)
- hpRegen: 초당 체력 회복 (비전투 5초 후 활성화 권장)

### 자원/유지력
- spRegen: 초당 SP 회복량 증가
- spOnHit: 적 타격 시 SP 회복
- spCostReduction: 스킬 SP 소모 감소
- lifeSteal: 준 피해 비율만큼 HP 흡혈

### 이동/기동성
- moveSpeedPct: 이동 속도 %
- dashDistancePct: 대시 거리 증가
- dashCooldownMult: 대시 쿨다운 배율
- dashIFrame: 대시 무적 시간 증가

### 제어/투사체/범위
- knockbackPower: 넉백 강도
- stunChance, stunDuration: 기절 부여
- slowOnHitPct, slowDuration: 둔화 부여
- pierceCount: 관통 수
- projectileSpeed: 투사체 속도
- range: 근접/스킬 사거리 증가
- aoeSize: 범위 스킬 크기 증가

### 진행/메타
- xpGainPct: 경험치 획득 증가
- dropRatePct: 드랍률 증가
- pickupRadius: 아이템 자석 범위 증가

### 시너지형 (현재 시스템 특화)
- dashAttackBonus: 대시 중 공격 피해 증가
- damageTakenWhileDashing: 대시 중 받는 피해 감소
- healOnKill, spOnKill: 처치 시 회복
- outOfCombatDelayReduction: 비전투 판정 지연(5초) 단축

## 스탯 설계 가이드
- 명확한 타입: 확률/비율(0.0~1.0), 배율(기본 1.0), 고정치(정수)
- 합성 규칙: 고정치(flat) 합산 → 비율(%) 합산/곱산 → 최종 배율 적용
- 캡(cap) 설정: 예) cooldownReduction ≤ 0.5, dodgeChance ≤ 0.6 등
- 명명 규칙: `attackFlat`, `attackPct`처럼 평증/퍼증 구분 권장
- 비전투 회복: hpRegen은 "마지막 피해 후 5초 경과" 조건과 연동

## 스타터 세트 제안
- 전투감 업: critChance, critDamage, attackSpeed
- 유지력 업: spRegen, lifeSteal, hpRegen
- 대시 특화: dashCooldownMult, dashIFrame, dashAttackBonus

## 데이터 구조 예시 (JS)
```js
const baseStats = {
  // 기본
  level: 1, xp: 0, maxXp: 100,
  hp: 100, maxHp: 100,
  sp: 100, maxSp: 100,
  attack: 10, defense: 5,
  speed: 200, dashSpeed: 400,

  // 공격
  critChance: 0.05,
  critDamage: 1.5,
  attackSpeed: 1.0,
  cooldownReduction: 0.0,
  armorPenetration: 0,

  // 방어/생존
  dodgeChance: 0.0,
  damageReduction: 0.0,
  hpRegen: 0.0,
  shield: 0, shieldRegen: 0,

  // 자원
  spRegen: 0.0,
  spOnHit: 0.0,
  spCostReduction: 0.0,
  lifeSteal: 0.0,

  // 이동/기동성
  moveSpeedPct: 0.0,
  dashDistancePct: 0.0,
  dashCooldownMult: 1.0,
  dashIFrame: 0.0,

  // 제어/투사체/범위
  knockbackPower: 0,
  stunChance: 0.0, stunDuration: 0.0,
  slowOnHitPct: 0.0, slowDuration: 0.0,
  pierceCount: 0,
  projectileSpeed: 1.0,
  range: 1.0,
  aoeSize: 1.0,

  // 진행/메타
  xpGainPct: 0.0,
  dropRatePct: 0.0,
  pickupRadius: 0,

  // 시너지형 예시
  dashAttackBonus: 0.0,
  damageTakenWhileDashing: 0.0,
  outOfCombatDelayReduction: 0.0,
};
```

## 적용 메모
- UI/툴팁 가시성을 위해 확률은 %로 표기, 내부 계산은 0~1 유지
- 밸런스 단계에서는 변화가 체감되는 구간(작지만 의미 있는 차이)을 우선 제공
- 시스템 반영 우선순위: (1) crit/공속 → (2) spRegen/흡혈 → (3) 대시 특화
