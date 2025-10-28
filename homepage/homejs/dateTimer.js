// dateTimer.js
import { showToast } from './toast.js';

/**
 * 입대일로부터 경과 일수 계산
 * @param {string} birthDateStr - 입대일 (YYYY-MM-DD)
 * @param {string} elementId - 표시할 DOM ID (기본값: 'days-since-birth')
 */
export function startBirthCounter(birthDateStr, elementId = 'days-since-birth') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate)) {
    console.error('⚠️ Invalid birthDate:', birthDateStr);
    el.textContent = '날짜 오류';
    return;
  }

  function update() {
    const today = new Date();
    const timeDifference = today - birthDate;
    const daysSinceBirth = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    el.textContent = daysSinceBirth;
  }

  update();

  // 자정마다 자동 업데이트
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  setTimeout(() => {
    update();
    setInterval(update, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}


/**
 * 전역일까지 남은 시간 카운트다운
 * @param {string} dischargeDateStr - 전역일 (YYYY-MM-DD)
 * @param {string} displayId - 표시할 DOM ID
 * @param {object} opts - 옵션 (alertDays 등)
 */
export function startDischargeTimer(dischargeDateStr, displayId = 'time-until-discharge', opts = {}) {
  const el = document.getElementById(displayId);
  if (!el) return null;

  const dischargeDate = new Date(dischargeDateStr);
  if (isNaN(dischargeDate)) {
    console.error('⚠️ Invalid dischargeDate:', dischargeDateStr);
    el.textContent = '날짜 오류';
    return;
  }

  // 남은 날짜별 알림 설정
  const alertDays = opts.alertDays || [100, 90, 60, 59, 50, 40, 30, 20, 10, 5, 4, 3, 2, 1];
  const alertStatus = {};
  alertDays.forEach(d => alertStatus[d] = false);

  let timer = null;
  let prevDaysLeft = null;

  function checkAlertDays(daysLeft) {
    if (alertDays.includes(daysLeft) && !alertStatus[daysLeft]) {
      showToast(`🎉 전역까지 ${daysLeft}일 남았습니다!`);
      alertStatus[daysLeft] = true;
    }
  }

  function update() {
    const now = new Date();
    const diff = dischargeDate - now;

    if (diff <= 0) {
      el.textContent = '🎖️ D-day!!! 축하합니다!';
      clearInterval(timer);
      showToast('전역을 진심으로 축하합니다! 🎊');
      return;
    }

    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));

    // ✅ 날짜 변경 감지 (자정 넘어가면 알림 체크)
    if (daysLeft !== prevDaysLeft) {
      checkAlertDays(daysLeft);
      prevDaysLeft = daysLeft;
    }

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    el.textContent = `${daysLeft} 일 ${hours} 시간 ${minutes} 분 ${seconds} 초`;
  }

  update();
  timer = setInterval(update, 1000);
  return () => clearInterval(timer);
}
