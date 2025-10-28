// UI helper 요소는 런타임에 필요할 때 생성
// =========================
// 캘린더 및 일정 관리 JS
// =========================

// 일정 데이터 저장 및 불러오기 (배열로 변경: [{title, start, end, color}])
// 기존 localStorage 기반 저장을 서버 API 기반으로 변경
async function getSchedules() {
  try {
    const res = await fetch('/api/events');
    if (!res.ok) throw new Error('fetch error');
    const data = await res.json();
    // 서버는 id를 포함한 배열을 반환
    return data.map(d => ({ id: d.id, title: d.title, start: d.start, end: d.end, color: d.color }));
  } catch (e) {
    console.error('getSchedules failed', e);
    return [];
  }
}

async function createSchedule(sch) {
  const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sch) });
  if (!res.ok) throw new Error('create failed');
  return await res.json();
}

async function updateSchedule(id, sch) {
  const res = await fetch(`/api/events/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sch) });
  if (!res.ok) throw new Error('update failed');
  return await res.json();
}

async function deleteSchedule(id) {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('delete failed');
  return await res.json();
}

// --- UI 도우미: 로더와 토스트 ---
function ensureUIContainers() {
  if (!document.getElementById('global-loader')) {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;z-index:9999;display:none;';
    loader.innerHTML = '<div style="width:56px;height:56px;border-radius:50%;border:6px solid rgba(255,255,255,0.6);border-top-color:#1976d2;animation:spin 1s linear infinite"></div>';
    document.body.appendChild(loader);
  }
  if (!document.getElementById('toast-area')) {
    const ta = document.createElement('div');
    ta.id = 'toast-area';
    ta.style.cssText = 'position:fixed;top:18px;right:18px;z-index:10000;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(ta);
  }
  if (!document.getElementById('global-loader-style')) {
    const s = document.createElement('style');
    s.id = 'global-loader-style';
    s.textContent = '@keyframes spin {to {transform:rotate(360deg)}} .toast {padding:10px 14px;border-radius:8px;color:#fff;box-shadow:0 6px 18px rgba(0,0,0,0.12);font-weight:500} .toast.success{background:#2e7d32} .toast.error{background:#c62828}';
    document.head.appendChild(s);
  }
}

function showLoader() { ensureUIContainers(); document.getElementById('global-loader').style.display = 'flex'; }
function hideLoader() { const el = document.getElementById('global-loader'); if (el) el.style.display = 'none'; }

function showToast(message, type = 'success', timeout = 3500) {
  ensureUIContainers();
  const ta = document.getElementById('toast-area');
  // 토스트 큐: 추가 후 자동 제거, 수동 닫기 허용
  const node = document.createElement('div');
  node.className = `toast ${type === 'error' ? 'error' : 'success'}`;
  node.style.display = 'flex'; node.style.alignItems = 'center'; node.style.gap = '8px';
  const text = document.createElement('div'); text.textContent = message; node.appendChild(text);
  const btnClose = document.createElement('button'); btnClose.textContent = '닫기'; btnClose.style.cssText = 'background:transparent;border:none;color:#fff;cursor:pointer;font-weight:600;padding:6px 8px;border-radius:6px;';
  btnClose.onclick = () => { node.remove(); showNextToast(); };
  node.appendChild(btnClose);
  ta.appendChild(node);
  // 큐 처리: 4개 초과 시 가장 오래된 항목 제거
  if (ta.children.length > 4) ta.removeChild(ta.children[0]);
  const tid = setTimeout(() => { node.style.opacity = '0'; node.style.transform = 'translateX(10px)'; setTimeout(() => { node.remove(); showNextToast(); }, 300); }, timeout);
  // 타이머 저장(닫기 시 취소 가능)
  node._tid = tid;
}

function showNextToast() {
  // 향후 큐 동작을 위한 자리표시자(현재는 자동 제거)
}

// 버튼 스피너 도우미 (비차단 로더)
function showButtonSpinner(btn) {
  if (!btn) return;
  if (btn._spinner) return; // 이미 있음
  const sp = document.createElement('span');
  sp.className = 'btn-spinner';
  sp.style.cssText = 'display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,0.6);border-top-color:#fff;border-radius:50%;margin-left:8px;animation:spin 0.8s linear infinite;';
  btn.appendChild(sp);
  btn._spinner = sp;
}

function hideButtonSpinner(btn) {
  if (!btn || !btn._spinner) return;
  btn._spinner.remove();
  delete btn._spinner;
}

// 모달 도우미: 애니메이션으로 닫기, 포커스 트랩, ESC로 닫기
function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('modal-exit');
  setTimeout(() => {
    try { if (modalEl._previousActive && modalEl._previousActive.focus) modalEl._previousActive.focus(); } catch (e) {}
    modalEl.remove();
  }, 180);
}

function activateModalAccessibility(modalEl) {
  // 첫 입력 요소에 자동 포커스
  // 닫기 시 포커스를 복원하기 위해 이전 활성 요소 저장
  modalEl._previousActive = document.activeElement || null;
  // dialog 역할과 aria 속성 설정
  if (!modalEl.hasAttribute('role')) modalEl.setAttribute('role', 'dialog');
  if (!modalEl.hasAttribute('aria-modal')) modalEl.setAttribute('aria-modal', 'true');
  const focusable = modalEl.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])');
  const focusables = Array.prototype.filter.call(focusable, el => !el.disabled && el.offsetParent !== null);
  if (focusables.length) focusables[0].focus();
  // 모달 콘텐츠가 절대 위치의 닫기 버튼을 배치할 수 있도록 보장
  const modalContent = modalEl.querySelector('.modal-content');
  if (modalContent) modalContent.style.position = modalContent.style.position || 'relative';
  // aria-labelledby가 첫 번째 제목으로 설정되었는지 보장
  const heading = modalEl.querySelector('h1,h2,h3,h4,h5,h6');
  if (heading) {
    if (!heading.id) heading.id = 'modal-title-' + Math.random().toString(36).slice(2,8);
    modalEl.setAttribute('aria-labelledby', heading.id);
  }
  // 포커스 트랩
  modalEl.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(modalEl);
      return;
    }
    if (e.key === 'Tab') {
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });
  // 닫기 버튼(존재 시)
  const closeBtn = modalEl.querySelector('.modal-close');
  if (closeBtn) closeBtn.onclick = () => closeModal(modalEl);
}

// --- 캘린더 전역에서 사용하는 날짜 헬퍼 ---
function parseYMD(s) {
  // 안전한 Y-M-D 파서
  // - 'YYYY-MM-DD' 형태를 우선 파싱
  // - p[2]와 같은 부분이 없을 경우 slice 호출로 인한 예외를 방지
  // - 폴백으로 new Date(s)를 사용하되 유효하지 않으면 null 반환
  try {
    const str = String(s || '');
    const p = str.split('-');
    if (p.length >= 3 && p[0] && p[1] && p[2]) {
      const y = Number(p[0]);
      const m = Number(p[1]) - 1;
      const d = Number(String(p[2]).slice(0,2));
      if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) return new Date(y, m, d);
    }
  } catch (e) {
    // 의도적 무시, 아래 폴백 처리로 넘어감
  }
  const dObj = new Date(s);
  return isNaN(dObj) ? null : dObj;
}
function formatYMD(d) {
  if (!d) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isoToLocalDatetimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 리마인더 스케줄링 도우미 (페이지가 열려 있는 동안 동작하는 간단한 클라이언트 측 스케줄링)
window._reminderTimeouts = window._reminderTimeouts || {};
async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const p = await Notification.requestPermission();
  return p === 'granted';
}
function showReminderNotification(sch) {
  const title = sch.title || '일정 알림';
  const body = `${sch.start} ~ ${sch.end}`;
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body }); return; } catch (e) { /* fall back */ }
  }
  showToast(`리마인더: ${title} (${sch.start})`);
}
function scheduleSetReminder(sch) {
  try {
    if (!sch || !sch.remindAt) return;
    const when = new Date(sch.remindAt);
    const now = new Date();
    const ms = when - now;
    if (ms <= 0) return; // past
    // clear existing
    if (window._reminderTimeouts[sch.id]) clearTimeout(window._reminderTimeouts[sch.id]);
    window._reminderTimeouts[sch.id] = setTimeout(() => {
      showReminderNotification(sch);
      delete window._reminderTimeouts[sch.id];
    }, Math.min(ms, 2147483647)); // cap at max setTimeout
  } catch (e) { console.error('scheduleSetReminder failed', e); }
}
async function scheduleReminderScheduler() {
  try {
    const schedules = await getSchedules();
    if (!schedules || !schedules.length) return;
    // request permission proactively if any reminders exist
    const any = schedules.some(s => s.remindAt);
    if (any) requestNotificationPermission();
    schedules.forEach(s => scheduleSetReminder(s));
  } catch (e) { console.error(e); }
}


async function makeCalendar(date) {
  // 오늘/선택 날짜 일정 리스트 패널 렌더링 (기본: 오늘)
  await renderScheduleListPanel();
  // 달력 렌더링 함수: 전달받은 날짜 기준으로 달력 표를 만듦
  const today = new Date();
  // 오늘 날짜 객체
  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
  const schedules = await getSchedules();

  // 달력에 표시할 주(week) 배열 생성

  // table 구조로 tbody 생성
  let weeks = [];
  let week = [];
  let dayNum = 1;
  let startDay = firstDay; // ㅣ일요일 시작(0:월~6:일)
  // 첫 주 빈칸
  for (let i = 0; i < startDay; i++) week.push(null);
  while (dayNum <= lastDay) {
    week.push(dayNum);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    dayNum++;
  }
  // 마지막 주 빈칸
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // 최소 5주 보장
  while (weeks.length < 5) {
    weeks.push([null, null, null, null, null, null, null]);
  }

  // tbody HTML 생성
  let tbodyHtml = '';
  // 공휴일 예시(확장 가능, 필요시 추가)
  const holidays = [
    '2025-01-01' // 신정 
    , '2025-01-20' // 설날 연휴
    , '2025-01-21' // 설날 연휴
    , '2025-01-22' // 설날 연휴
    , '2025-02-11' // 대체공휴일
    , '2025-03-24' // 석가탄신일
    , '2025-05-01' // 근로자의 날
    , '2025-03-01' // 삼일절
    , '2025-05-05' // 어린이날
    , '2025-06-06' // 현충일
    , '2025-08-15' // 광복절
    , '2025-10-03' // 개천절
    , '2025-10-09' // 한글날
    , '2025-12-25' // 성탄절
    , '2025-09-17' // 추석 연휴
    , '2025-09-18' // 추석 연휴
    , '2025-09-19' // 추석 연휴
    , '2025-09-22' // 대체공휴일
    , '2025-12-31' // 임시공휴일
    // 추가 공휴일이나 임의 지정일은 여기에 계속 추가 가능
    // 'YYYY-MM-DD' 형식으로 추가 가능
  ];
  // 각 주/요일별로 셀(td) 생성
  weeks.forEach((weekArr, weekIdx) => {
    tbodyHtml += '<tr>';
    weekArr.forEach((d, i) => {
      if (d === null) {
        // 빈칸(해당 월이 아닌 날짜)
        tbodyHtml += '<td class="day day--disabled"></td>';
      } else {
        // 실제 날짜 셀
  // YYYY-MM-DD 형식의 날짜 문자열 생성
  const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  // 오늘 날짜인지 여부
  let isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d);
  // 요일별 클래스(sun, sat, weekday)
  let dayNumClass = '';
        if (i === 0) dayNumClass = 'sun';
        else if (i === 6) dayNumClass = 'sat';
        else dayNumClass = 'weekday';
  if (holidays.includes(dateStr)) dayNumClass += ' h-day'; // 공휴일 표시
        if (isToday) dayNumClass += ' today';
  // 일정이 있는 날에 제목+종료일 표기, 배경색 적용
  // 이 날짜를 포함하는 일정 수집
  let eventsForCell = [];
  schedules.forEach((sch) => {
          const toDateStr = (dt) => {
            // 시간대 변화 문제를 피하기 위해 로컬 Y-M-D로 파싱
            const parts = String(dt).split('-');
            if (parts.length >= 3) {
              const y = Number(parts[0]);
              const m = Number(parts[1]);
              const dd = Number(parts[2].slice(0,2));
              const dObj = new Date(y, m-1, dd);
              return dObj.getFullYear() + '-' + String(dObj.getMonth()+1).padStart(2,'0') + '-' + String(dObj.getDate()).padStart(2,'0');
            }
            const dObj = new Date(dt);
            return dObj.getFullYear() + '-' + String(dObj.getMonth()+1).padStart(2,'0') + '-' + String(dObj.getDate()).padStart(2,'0');
          };
          const startStr = toDateStr(sch.start);
          // 종료일도 로컬 Y-M-D로 파싱
          const parseYMD = (s) => {
            const p = String(s).split('-');
            if (p.length >= 3) return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2].slice(0,2)));
            return new Date(s);
          };
          const endObj = parseYMD(sch.end);
          const curStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          // 기간 표시: 시작/중간/종료에 따라 시각적 바를 추가
          // 시작일에는 제목(다중일인 경우 종료 라벨 포함)
          const startDateObj = parseYMD(sch.start);
          const endDateObj = parseYMD(sch.end);
          const curDateObj = new Date(currentYear, currentMonth, d);
          if (curDateObj >= startDateObj && curDateObj <= endDateObj) {
            // push event metadata for later rendering
            eventsForCell.push({ sch, startDateObj, endDateObj });
          }
        });
  // 이벤트를 쌓아 보여주고 오버플로우 처리
        const VISIBLE_MAX = 1;
        let cellEventsHtml = '';
  // 오버레이가 레이아웃에 영향을 주지 않도록 제목 블록과 오버레이 바를 분리 수집
        let titleBlocks = '';
        let overlayBars = '';
        if (eventsForCell.length > 0) {
          for (let idx = 0; idx < Math.min(eventsForCell.length, VISIBLE_MAX); idx++) {
            const { sch, startDateObj, endDateObj } = eventsForCell[idx];
            const curDateObj = new Date(currentYear, currentMonth, d);
            const isStart = (curDateObj.getFullYear() === startDateObj.getFullYear() && curDateObj.getMonth() === startDateObj.getMonth() && curDateObj.getDate() === startDateObj.getDate());
            const isEnd = (curDateObj.getFullYear() === endDateObj.getFullYear() && curDateObj.getMonth() === endDateObj.getMonth() && curDateObj.getDate() === endDateObj.getDate());
            const isSameDay = (sch.start === sch.end);
            if (isStart) {
                let endLabel = '';
              if (!isSameDay) {
                if (endDateObj.getFullYear() === currentYear && endDateObj.getMonth() === currentMonth) endLabel = ` (~${endDateObj.getDate()})`;
                else endLabel = ` (~${sch.end})`;
              }
                // 리마인더 정보를 data-attr로 포함
                const remindAttr = sch.remindAt ? ` data-remind="${sch.remindAt}"` : '';
                titleBlocks += `<div class="schedule-title" data-id="${sch.id}"${remindAttr} draggable="true" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;min-width:80px;margin-top:6px;">
                  <span class="event-dot" style="width:10px;height:10px;background:${sch.color};border-radius:50%;display:inline-block;flex:0 0 auto;"></span>
                  <span class="event-title-text" style="color:#222;font-size:13px;">${sch.title}${endLabel}</span>
                </div>`;
            }
            if (!isSameDay) {
              // 다중일 이벤트에 대해 오버레이 바를 항상 추가(절대 위치)
              const barClass = isStart && isEnd ? 'sch-single' : isStart ? 'sch-start' : isEnd ? 'sch-end' : 'sch-mid';
              overlayBars += `<div class="schedule-bar ${barClass}" data-id="${sch.id}" style="background:${sch.color};opacity:0.28;"></div>`;
            }
          }
          if (titleBlocks) cellEventsHtml += `<div class="schedule-wrapper">${titleBlocks}</div>`;
          if (overlayBars) cellEventsHtml += `<div class="cell-bar-overlay">${overlayBars}</div>`;
          // 초과(더보기) 배지
          if (eventsForCell.length > VISIBLE_MAX) {
            const more = eventsForCell.length - VISIBLE_MAX;
            cellEventsHtml += `<div class="more-badge" data-date="${dateStr}" style="margin-left:8px;cursor:pointer;font-size:12px;color:black;font-weight;">+${more}</div>`;
          }
        }
        tbodyHtml += `<td class="day${isToday ? ' day--today' : ''}" data-date="${dateStr}"><span class="day-num${dayNumClass ? ' ' + dayNumClass : ''}">${d}</span>${cellEventsHtml}</td>`;
      }
    });
  tbodyHtml += '</tr>'; // 한 주 끝
  });
  // 달력 tbody에 HTML 삽입
  document.getElementById('calendar-tbody').innerHTML = tbodyHtml;
  // 더보기(badge) 클릭 바인딩: 이벤트 리스트 모달 표시
  setTimeout(() => {
    document.querySelectorAll('.more-badge').forEach(b => {
      b.onclick = function(e) {
        // 클릭이 부모 .day로 버블되어 입력 모달이 열리는 것을 방지
        if (e && e.stopPropagation) e.stopPropagation();
        const dateStr = this.getAttribute('data-date');
        showDayEventsModal(dateStr);
      };
    });
  }, 0);

// 날짜 박스 클릭 시 띄우는 '일정 보여주기' 모달
async function showDayEventsModal(dateStr) {
  const old = document.getElementById('day-events-modal'); if (old) old.remove();
  const schedules = await getSchedules();
  // 안전한 Y-M-D 파서: 'YYYY-MM-DD' 형태를 우선 파싱하고, 실패하면 Date 생성으로 폴백
  const parseYMD = (s) => {
    const p = String(s || '').split('-');
    if (p.length >= 3 && p[0] && p[1] && p[2]) {
      const y = Number(p[0]);
      const m = Number(p[1]) - 1;
      const d = Number(String(p[2]).slice(0,2));
      if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) return new Date(y, m, d);
    }
    const dObj = new Date(s);
    return isNaN(dObj) ? null : dObj;
  };
  const parts = dateStr.split('-');
  const cur = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const list = schedules.filter(sch => {
    const s = parseYMD(sch.start);
    const e = parseYMD(sch.end);
    // 시작/종료가 유효하지 않으면 해당 일정은 대상에서 제외
    if (!s || !e) return false;
    return cur >= s && cur <= e;
  });

  const modal = document.createElement('div'); modal.id = 'day-events-modal'; modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true">
      <h4 style="margin:0 0 8px 0;">${dateStr} 일정</h4>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <input id="day-events-search" placeholder="검색(제목)" style="flex:1;padding:6px;border-radius:6px;border:1px solid #ddd;" aria-label="일정 검색">
        <select id="day-events-sort" aria-label="정렬 기준" style="padding:6px;border-radius:6px;border:1px solid #ddd;">
          <option value="start">시간순</option>
          <option value="title">제목순</option>
          <option value="color">색상순</option>
        </select>
      </div>
      <ul id="day-events-ul" style="list-style:none;padding:0;margin:0;max-height:320px;overflow:auto;" aria-live="polite"></ul>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
        <div><button id="day-events-add" class="modal-btn save">추가</button></div>
        <div><button id="day-events-close" class="modal-btn close">닫기</button></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  activateModalAccessibility(modal);
  const btnCloseTop2 = document.createElement('button'); btnCloseTop2.className = 'modal-close'; btnCloseTop2.textContent = '✕'; btnCloseTop2.style.cssText = 'position:absolute;right:10px;top:10px;border:none;background:transparent;font-size:16px;cursor:pointer;';
  modal.querySelector('.modal-content').appendChild(btnCloseTop2);

  // === 드래그 기능 (기본 커서 + 투명도 + 애니메이션) ===
(() => {
  const modalContent = modal.querySelector('.modal-content');

  // 초기 위치 및 스타일 설정
  modalContent.style.position = 'absolute';
  modalContent.style.left = '50%';
  modalContent.style.top = '50%';
  modalContent.style.transform = 'translate(-50%, -50%)';
  modalContent.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  modalContent.style.cursor = 'default'; // 기본 커서 유지
  modalContent.addEventListener('mousedown', () => { modalContent.style.cursor = 'grabbing'; });// 드래그 중 커서 변경
  modalContent.addEventListener('mouseup', () => { modalContent.style.cursor = 'default'; });// 드래그 종료 시 커서 복원
  modalContent.style.userSelect = 'none'; // 드래그 중 텍스트 선택 방지

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  // 마우스 클릭 시작
  modalContent.addEventListener('mousedown', (e) => {
    // 버튼, 입력창 같은 요소는 드래그 무시
    if (['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

    isDragging = true;

    const rect = modalContent.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // 중앙 정렬 해제 후 현재 위치 고정
    modalContent.style.left = rect.left + 'px';
    modalContent.style.top = rect.top + 'px';
    modalContent.style.transform = '';
    modalContent.style.transition = 'none'; // 드래그 중엔 애니메이션 제거
    modalContent.style.opacity = '0.8'; // 드래그 중 약간 투명하게
  });

  // 마우스 이동
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const newLeft = e.clientX - offsetX;
    const newTop = e.clientY - offsetY;

    // 화면 경계 제한
    const maxLeft = window.innerWidth - modalContent.offsetWidth;
    const maxTop = window.innerHeight - modalContent.offsetHeight;

    modalContent.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
    modalContent.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
  });

  // 마우스 떼면 드래그 종료
  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;

    // 부드럽게 원래 불투명도로 복귀
    modalContent.style.transition = 'opacity 0.2s ease';
    modalContent.style.opacity = '1';
  });
})();


  // 아이콘과 툴팁을 포함하여 리스트 렌더링 및 정렬/검색 적용
  function renderDayList() {
    const ul = document.getElementById('day-events-ul'); if (!ul) return;
    const q = (document.getElementById('day-events-search') && document.getElementById('day-events-search').value || '').trim().toLowerCase();
    const sortBy = (document.getElementById('day-events-sort') && document.getElementById('day-events-sort').value) || 'start';
    let arr = list.slice();
    if (q) arr = arr.filter(sch => (sch.title||'').toLowerCase().includes(q));
    if (sortBy === 'title') arr.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
    else if (sortBy === 'color') arr.sort((a,b)=> (a.color||'').localeCompare(b.color||''));
    else arr.sort((a,b)=> new Date(a.start) - new Date(b.start));
    ul.innerHTML = '';
    if (arr.length === 0) { ul.innerHTML = '<li style="padding:8px 0;color:#666;text-align:center;">일정이 없습니다.</li>'; return; }
    arr.forEach(sch => {
      const li = document.createElement('li');
      li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center'; li.style.padding = '8px 0'; li.style.borderBottom = '1px solid #eee';
      // left: color dot + title + meta
      const left = document.createElement('div'); left.style.display = 'flex'; left.style.gap = '8px'; left.style.alignItems = 'center';
      const dot = document.createElement('span'); dot.style.cssText = `display:inline-block;width:12px;height:12px;background:${sch.color};border-radius:50%;`; dot.setAttribute('aria-hidden','true');
      const titleWrap = document.createElement('div');
      const titleEl = document.createElement('b'); titleEl.textContent = sch.title; titleEl.title = sch.title; titleEl.style.cursor = 'default';
      const meta = document.createElement('div'); meta.style.fontSize = '12px'; meta.style.color = '#666'; meta.textContent = `${sch.start} ~ ${sch.end}` + (sch.remindAt? ' · 리마인더':'' );
      titleWrap.appendChild(titleEl); titleWrap.appendChild(meta);
      left.appendChild(dot); left.appendChild(titleWrap);
      // right: icons + buttons
      const right = document.createElement('div'); right.style.display = 'flex'; right.style.gap = '8px'; right.style.alignItems = 'center';
      // icons with tooltips
      if (sch.remindAt) {
        const bell = document.createElement('span'); bell.textContent = '🔔'; bell.title = '리마인더 설정됨'; bell.setAttribute('aria-label','리마인더'); right.appendChild(bell);
      }
      if (sch.recurrence) {
        const rep = document.createElement('span'); rep.textContent = '🔁'; rep.title = '반복 일정'; rep.setAttribute('aria-label','반복'); right.appendChild(rep);
      }
      // edit/delete buttons
      const editBtn = document.createElement('button'); editBtn.className = 'day-edit-btn'; editBtn.textContent = '수정'; editBtn.setAttribute('data-id', String(sch.id));
      const delBtn = document.createElement('button'); delBtn.className = 'day-delete-btn'; delBtn.textContent = '삭제'; delBtn.setAttribute('data-id', String(sch.id));
      right.appendChild(editBtn); right.appendChild(delBtn);
      li.appendChild(left); li.appendChild(right);
      // tooltips and aria
      li.setAttribute('role','listitem');
      ul.appendChild(li);
      // bindings
      editBtn.onclick = function(e) { if (e && e.stopPropagation) e.stopPropagation(); const id = Number(this.getAttribute('data-id')); closeModal(modal); showScheduleEditModal(id); };
      delBtn.onclick = async function(e) { if (e && e.stopPropagation) e.stopPropagation(); const id = Number(this.getAttribute('data-id')); if (!id) return; if (!confirm('정말 삭제하시겠습니까?')) return; try { await deleteSchedule(id); showToast('삭제되었습니다.'); closeModal(modal); await makeCalendar(currentDate); } catch (err) { showToast('삭제 실패', 'error'); } };
    });
  }
  // initial render and handlers
  document.getElementById('day-events-sort').addEventListener('change', renderDayList);
  document.getElementById('day-events-search').addEventListener('input', renderDayList);
  renderDayList();
  document.getElementById('day-events-close').onclick = () => closeModal(modal);
  document.querySelector('.modal-close').onclick = () => closeModal(modal);
  document.getElementById('day-events-add').onclick = () => { closeModal(modal); showScheduleInputModal(dateStr); };
  // prevent underlying calendar clicks
  modal.addEventListener('click', function(e) { if (e.target === modal) { closeModal(modal); e.stopPropagation(); return; } e.stopPropagation(); });
}
  // 월/연도 라벨 갱신
  document.querySelector('.month-label').innerText = `${currentMonth+1}월`;
  document.querySelector('.year-label').innerText = `${currentYear}`;

  // 일정 입력(추가) 이벤트 바인딩
  setTimeout(() => {
    document.querySelectorAll('.day').forEach(dayEl => {
      if (!dayEl.classList.contains('day--disabled')) {
        // 날짜 셀 클릭 시 해당 날짜의 일정을 보여주는 모달을 띄우고
        // 모달에서 '추가' 또는 각 일정의 '수정' 버튼으로 기존 모달을 연다
        dayEl.onclick = function(e) {
          e.stopPropagation();
          const dateKey = this.getAttribute('data-date');
          showDayEventsModal(dateKey);
          renderScheduleListPanel(dateKey);
        };
        // 날짜 셀 마우스 클릭 시 일정 리스트 패널 날짜 변경만(우클릭 등)
        dayEl.oncontextmenu = function(e) {
          e.preventDefault();
          const dateKey = this.getAttribute('data-date');
          renderScheduleListPanel(dateKey);
        };
      } else {
        dayEl.onclick = null;
        dayEl.oncontextmenu = null;
      }
    });
    // 일정 제목 클릭 시 수정 모달 표시
    // (자식 요소 클릭이 부모 .day의 클릭으로 전파되어 '추가' 모달이 열리는 것을 방지)
    document.querySelectorAll('.schedule-title').forEach(titleEl => {
      titleEl.style.cursor = 'pointer';
  // 클릭 -> 해당 일정의 시작일에 해당하는 일별 이벤트 모달 열기 (편집은 일별 모달에서만)
      titleEl.onclick = async function(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const id = Number(this.getAttribute('data-id'));
        if (!id) return;
        const schedules = await getSchedules();
        const sch = schedules.find(s => s.id === id);
        if (sch) showDayEventsModal(sch.start);
      };
  // 드래그 앤 드롭: 이벤트를 다른 날짜 셀로 드래그하여 시작/종료일을 이동 허용
      titleEl.addEventListener('dragstart', function(e) {
        e.dataTransfer.setData('text/event-id', String(this.getAttribute('data-id')));
        // visual
        e.dataTransfer.effectAllowed = 'move';
      });
    });
  // 날짜 셀을 드롭 대상으로 설정
    document.querySelectorAll('.day').forEach(dayEl => {
      dayEl.addEventListener('dragover', function(e) {
        if (this.classList.contains('day--disabled')) return;
        e.preventDefault();
        this.classList.add('drop-target');
      });
      dayEl.addEventListener('dragleave', function(e) { this.classList.remove('drop-target'); });
      dayEl.addEventListener('drop', async function(e) {
        e.preventDefault(); this.classList.remove('drop-target');
        const id = Number(e.dataTransfer.getData('text/event-id'));
        if (!id) return;
        const targetDate = this.getAttribute('data-date');
        try {
          showLoader();
          // 일정 정보를 가져와 시작~종료 기간(일수)을 계산하고 시작일을 대상 날짜로 옮기되 기간은 유지
          const schedules = await getSchedules();
          const sch = schedules.find(s => s.id === id);
          if (!sch) return;
          const oldStart = parseYMD(sch.start);
          const oldEnd = parseYMD(sch.end);
          const durationDays = Math.round((oldEnd - oldStart) / (1000*60*60*24));
          const newStart = parseYMD(targetDate);
          const newEnd = new Date(newStart.getTime() + durationDays*(1000*60*60*24));
          await updateSchedule(id, { title: sch.title, start: formatYMD(newStart), end: formatYMD(newEnd), color: sch.color, remindAt: sch.remindAt });
          showToast('일정이 이동되었습니다.');
          await makeCalendar(currentDate);
        } catch (err) {
          console.error(err);
          showToast('일정 이동에 실패했습니다.', 'error');
        } finally { hideLoader(); }
      });
    });
    // 일정 span(종료일 표기 등) 클릭 시 수정 모달 표시 (레거시 핸들러 유지)
    document.querySelectorAll('.schedule-end-date').forEach(endEl => {
      endEl.style.cursor = 'pointer';
      endEl.onclick = async function(e) {
        e.stopPropagation();
        const id = Number(this.getAttribute('data-id'));
        if (!id) return;
        const schedules = await getSchedules();
        const sch = schedules.find(s => s.id === id);
        if (sch) showDayEventsModal(sch.start);
      };
    });
  }, 0);
// 일정 수정 모달
async function showScheduleEditModal(id) {
// 일정 수정 모달 생성 및 동작
  const schedules = await getSchedules();
  const sch = schedules.find(s => s.id === id);
  if (!sch) return;

  const colors = [
    '#FFCDD2', // 연한 레드
    '#FFB6C1', // 연한 핑크
    '#FFA07A', // 연한 오렌지
    '#FFFFE0', // 연한 옐로우
    '#98FB98', // 연한 그린
    '#AFEEEE', // 연한 시안
    '#DDA0DD', // 연한 바이올렛
    '#D3D3D3'  // 연한 그레이
  ];

  const modal = document.createElement('div');
  modal.id = 'schedule-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 style="margin-top:0" >일정 수정</h3>
      <label><input type="text" id="sch-title-edit" style="width:90%" maxlength="20" value="${sch.title}"></label><br><br>
      <div style="display: flex; gap: 12px; align-items: center;">
        <label>시작 <br>
          <input id="sch-start-edit" type="date" value="${sch.start}">
        </label> &nbsp; &nbsp;
        <label>종료 <br>
          <input id="sch-end-edit" type="date" value="${sch.end}">
        </label>
      </div>
      <br>
      <label style="display:block;margin-top:8px;">리마인더 (선택)<br>
        <input id="sch-remind-edit" type="datetime-local" value="${isoToLocalDatetimeInput(sch.remindAt)}" style="width:100%">
      </label>
      <br>
      <div>
        ${colors.map((c,i)=>`
          <label style="margin-right:8px;cursor:pointer;">
            <input type="radio" name="sch-color" value="${c}" ${(sch.color === c) ? 'checked' : ''} style="display:none;">
            <span class="color-dot" style="background:${c};"></span>
          </label>
        `).join('')}
      </div><br>
      <div style="margin-top:16px;text-align:right;">
        <button id="sch-delete-edit" class="modal-btn delete">삭제</button>
        <button id="sch-save-edit" class="modal-btn save">저장</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  // 접근성 및 포커스 트랩 활성화
  activateModalAccessibility(modal);
  const btnCloseTop3 = document.createElement('button'); btnCloseTop3.className = 'modal-close'; btnCloseTop3.textContent = '✕'; btnCloseTop3.style.cssText = 'position:absolute;right:10px;top:10px;border:none;background:transparent;font-size:16px;cursor:pointer;';
  modal.querySelector('.modal-content').appendChild(btnCloseTop3);
  // 엔터키로 저장 (모달 append 후에만 바인딩)
  // Enter 또는 Ctrl+Enter로 저장
  modal.querySelector('.modal-content').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      if (e.ctrlKey) document.getElementById('sch-save-edit').click();
      else {
        // 기본 Enter는 폼 내에서 제출 동작 대신 입력용
      }
    }
    if (e.key === 'Escape') closeModal(modal);
  });
  // 인라인 에러 영역 추가
  const errArea = document.createElement('div'); errArea.id = 'sch-err-edit'; errArea.style.cssText = 'color:#c62828;margin-bottom:8px;min-height:18px;';
  modal.querySelector('.modal-content').insertBefore(errArea, modal.querySelector('.modal-content').children[2]);
  // 색상 클릭 UX: 클릭하면 해당 radio 체크 및 스타일 토글
  modal.querySelectorAll('.color-dot').forEach((dot, idx) => {
    dot.addEventListener('click', function() {
      const r = modal.querySelectorAll('input[name="sch-color"]')[idx];
      if (r) { r.checked = true; modal.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('selected')); dot.classList.add('selected'); }
    });
    if (modal.querySelectorAll('input[name="sch-color"]')[idx].checked) dot.classList.add('selected');
  });
  document.getElementById('sch-save-edit').onclick = async () => {
  const title = document.getElementById('sch-title-edit').value.trim();
  const start = document.getElementById('sch-start-edit').value;
  const end = document.getElementById('sch-end-edit').value;
  const color = modal.querySelector('input[name="sch-color"]:checked').value;
  const remindVal = document.getElementById('sch-remind-edit').value;
  const remindAt = remindVal ? new Date(remindVal).toISOString() : null;
  // inline validation
  errArea.textContent = '';
  if (!title) { errArea.textContent = '제목을 입력하세요.'; return; }
  if (!start || !end) { errArea.textContent = '시작/종료 날짜를 입력하세요.'; return; }
  if (start > end) { errArea.textContent = '종료일이 시작일보다 빠를 수 없습니다.'; return; }
    try {
      const btn = document.getElementById('sch-save-edit');
      btn.disabled = true; btn.style.opacity = '0.6';
      showButtonSpinner(btn);
  await updateSchedule(id, { title, start, end, color, remindAt });
      hideButtonSpinner(btn);
      showToast('일정이 수정되었습니다.');
      closeModal(modal);
      await makeCalendar(currentDate);
  // schedule client-side reminder
  if (remindAt) { await requestNotificationPermission(); scheduleSetReminder({ id, title, start, end, color, remindAt }); }
      btn.disabled = false; btn.style.opacity = '';
    } catch (e) {
      hideButtonSpinner(document.getElementById('sch-save-edit'));
      showToast('일정 수정에 실패했습니다.', 'error');
      console.error(e);
    }
  };
  document.getElementById('sch-delete-edit').onclick = async () => {
    if (confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      try {
  const btn = document.getElementById('sch-delete-edit');
  btn.disabled = true; btn.style.opacity = '0.6';
  showButtonSpinner(btn);
  await deleteSchedule(id);
  hideButtonSpinner(btn);
  showToast('일정이 삭제되었습니다.');
  closeModal(modal);
  await makeCalendar(currentDate);
  btn.disabled = false; btn.style.opacity = '';
      } catch (e) {
        hideLoader();
        showToast('삭제에 실패했습니다.', 'error');
      }
    }
  };
}
}

// 일정 입력 모달 생성
function showScheduleInputModal(startDateStr) {
// 일정 입력(추가) 모달 생성 및 동작
  // 모달이 이미 있으면 제거
  const old = document.getElementById('schedule-modal');
  if (old) old.remove();

  const colors = [
    '#FFCDD2', // 연한 레드
    '#FFB6C1', // 연한 핑크
    '#FFA07A', // 연한 오렌지
    '#FFFFE0', // 연한 옐로우
    '#98FB98', // 연한 그린
    '#AFEEEE', // 연한 시안
    '#DDA0DD', // 연한 바이올렛
    '#D3D3D3'  // 연한 그레이
  ];
  const modal = document.createElement('div');
  modal.id = 'schedule-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <h3 style="margin-top:0" >일정 입력</h3>
      <label><input type="text" placeholder="일정 제목" id="sch-title" style="width:90%" maxlength="20"></label><br><br>
    
      <div style="display: flex; gap: 12px; align-items: center;">
        <label>시작 <br>
          <input id="sch-start" type="date" value="${startDateStr}">
        </label> &nbsp; &nbsp;
        <label>종료 <br>
          <input id="sch-end" type="date" value="${startDateStr}">
        </label>
      </div>
      <br>
      <div>
        ${colors.map((c,i)=>`
          <label style="margin-right:8px;cursor:pointer;">
            <input type="radio" name="sch-color" value="${c}" ${i===0?'checked':''} style="display:none;">
            <span class="color-dot" style="background:${c};"></span>
          </label>
        `).join('')}
      </div>
      <br>
      <label style="display:block;margin-top:8px;">리마인더 (선택)<br>
        <input id="sch-remind" type="datetime-local" value="" style="width:100%">
      </label>
      <div style="margin-top:16px;text-align:right;">
        <button id="sch-cancel" class="modal-btn delete" style="background:#aaa;">취소</button>
        <button id="sch-save" class="modal-btn save">저장</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  // 접근성 및 포커스 트랩 활성화
  activateModalAccessibility(modal);
  const btnCloseTop4 = document.createElement('button'); btnCloseTop4.className = 'modal-close'; btnCloseTop4.textContent = '✕'; btnCloseTop4.style.cssText = 'position:absolute;right:10px;top:10px;border:none;background:transparent;font-size:16px;cursor:pointer;';
  modal.querySelector('.modal-content').appendChild(btnCloseTop4);
  // 엔터키로 저장 (모달 append 후에만 바인딩)
  modal.querySelector('.modal-content').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('sch-save').click();
    }
  });
  document.getElementById('sch-cancel').onclick = () => closeModal(modal);
  // input validation inline area
  const errAreaInput = document.createElement('div'); errAreaInput.id = 'sch-err-input'; errAreaInput.style.cssText = 'color:#c62828;margin-bottom:8px;min-height:18px;';
  modal.querySelector('.modal-content').insertBefore(errAreaInput, modal.querySelector('.modal-content').children[2]);
  // color-dot click handling
  modal.querySelectorAll('.color-dot').forEach((dot, idx) => {
    dot.addEventListener('click', function() {
      const r = modal.querySelectorAll('input[name="sch-color"]')[idx];
      if (r) { r.checked = true; modal.querySelectorAll('.color-dot').forEach(x=>x.classList.remove('selected')); dot.classList.add('selected'); }
    });
    if (modal.querySelectorAll('input[name="sch-color"]')[idx].checked) dot.classList.add('selected');
  });
  // Ctrl+Enter 저장
  modal.querySelector('.modal-content').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) document.getElementById('sch-save').click();
    if (e.key === 'Escape') closeModal(modal);
  });
  document.getElementById('sch-save').onclick = () => {
    const title = document.getElementById('sch-title').value.trim();
    const start = document.getElementById('sch-start').value;
    const end = document.getElementById('sch-end').value;
    const color = document.querySelector('input[name="sch-color"]:checked').value;
  const remindVal = document.getElementById('sch-remind').value;
  const remindAt = remindVal ? new Date(remindVal).toISOString() : null;
  // inline validation
  errAreaInput.textContent = '';
  if (!title) { errAreaInput.textContent = '제목을 입력하세요.'; return; }
  if (!start || !end) { errAreaInput.textContent = '시작/종료 날짜를 입력하세요.'; return; }
  if (start > end) { errAreaInput.textContent = '종료일이 시작일보다 빠를 수 없습니다.'; return; }
    // 일정 저장 (서버로)
    (async () => {
      const btn = document.getElementById('sch-save');
      try {
        btn.disabled = true; btn.style.opacity = '0.6';
        showButtonSpinner(btn);
  const created = await createSchedule({ title, start, end, color, remindAt });
        hideButtonSpinner(btn);
        showToast('일정이 저장되었습니다.');
        closeModal(modal);
        await makeCalendar(currentDate);
  // schedule client-side reminder using returned id when available
  if (remindAt) { await requestNotificationPermission(); scheduleSetReminder({ id: created && created.id ? created.id : null, title, start, end, color, remindAt }); }
      } catch (e) {
        hideButtonSpinner(btn);
        showToast('일정 저장에 실패했습니다.', 'error');
        console.error(e);
      } finally {
        btn.disabled = false; btn.style.opacity = '';
      }
    })();
  };
}

// 미니 달력(이전/다음달) 간단 안내 텍스트 렌더링 (JS에서 실제 달력 렌더링 가능)
function renderMiniCalendars(currentDate) {
// 미니 달력(이전/다음달) 렌더링
  // 미니 달력 렌더 함수
  function miniCalHTML(date, label) {
    const today = new Date();
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const lastDay = new Date(y, m + 1, 0).getDate();
    // 월요일 시작(0:월~6:일)로 맞추기
    let startDay = (firstDay + 6) % 7;
    let weeks = [];
    let week = [];
    let dayNum = 1;
    for (let i = 0; i < startDay; i++) week.push(null);
    while (dayNum <= lastDay) {
      week.push(dayNum);
      if (week.length === 7) { weeks.push(week); week = []; }
      dayNum++;
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
    // 헤더(월/연도)
    let html = `<div style="text-align:center;font-weight:600;font-size:16px;margin-bottom:2px;">${y}. ${m+1}</div>`;
    html += '<table style="width:100%;font-size:13px;table-layout:fixed;border-collapse:collapse;">';
    html += '<thead><tr>';
    ['일','월','화','수','목','금','토'].forEach((d,i)=>{
      let c = i===0?'#e53935':i===6?'#1976d2':'#888';
      html += `<th style="color:${c};font-weight:500;padding:2px 0;">${d}</th>`;
    });
    html += '</tr></thead><tbody>';
    weeks.forEach(weekArr => {
      html += '<tr>';
      weekArr.forEach((d,i)=>{
        if(d===null) html+='<td></td>';
        else {
          let isToday = (today.getFullYear()===y && today.getMonth()===m && today.getDate()===d);
          const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          let isSelected = (miniSelectedDate === dateStr);
          let c = i===0?'#e53935':i===6?'#1976d2':'#222';
          let bg = isToday? 'background:#e3f2fd;border-radius:6px;border:1.5px solid #2196f3;':'background:none;';
          if (isSelected) bg = 'background:#fff3e0;border-radius:6px;border:1.5px solid #fb8c00;';
          html += `<td data-mini-date="${dateStr}" class="mini-day-cell" style="text-align:center;padding:2px 0;color:${c};${bg}font-weight:${isToday?'bold':'normal'};">${d}</td>`;
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }
  // 이전달, 다음달 객체
  const prev = new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1);
  const next = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
  document.getElementById('mini-prev').innerHTML = miniCalHTML(prev, '이전달');
  document.getElementById('mini-next').innerHTML = miniCalHTML(next, '다음달');
  // 바인딩: 미니 달력의 날짜 클릭 시 메인 캘린더로 이동 및 하이라이트
  [document.getElementById('mini-prev'), document.getElementById('mini-next')].forEach(container => {
    if (!container) return;
    container.querySelectorAll('.mini-day-cell').forEach(td => {
      td.addEventListener('click', function(e) {
        const d = this.getAttribute('data-mini-date');
        if (!d) return;
        // 선택 날짜 저장 및 메인 캘린더 월로 이동
        miniSelectedDate = d;
        const parts = d.split('-');
        currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        renderAndBindCalendar();
        // 선택한 특정 날짜로 스케줄 리스트 동기화
        renderScheduleListPanel(d);
      });
    });
  });
}

// 초기 날짜 상태
let currentDate = new Date();
// 미니 캘린더에서 선택된 날짜(YYYY-MM-DD) — 렌더 시 하이라이트에 사용
let miniSelectedDate = null;
function renderAndBindCalendar() {
// 달력 및 미니달력 렌더링, 월 이동 버튼 이벤트 바인딩
  makeCalendar(currentDate);
  renderMiniCalendars(currentDate);
  // 월 이동 버튼 이벤트 항상 재연결
  document.querySelector('.prevDay').onclick = () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    renderAndBindCalendar();
  };
  document.querySelector('.nextDay').onclick = () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    renderAndBindCalendar();
  };
}

// DOMContentLoaded: DOM이 완전히 준비된 후 달력 렌더링 시작
document.addEventListener('DOMContentLoaded', function() {
  renderAndBindCalendar();
  // schedule any reminders that exist on load
  scheduleReminderScheduler();
});


// 오늘 날짜 강조 및 색상 선택 스타일 추가
const style = document.createElement('style');
style.innerHTML = `
.day--today { background: #e3f2fd !important; border: 2px solid #2196f3; color: #1565c0 !important; }
.day .day-num { font-weight: bold; }
.schedule-text { font-size: 13px; color: #333; margin-top: 4px; word-break: break-all; }
.color-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #bbb;
  vertical-align: middle;
  position: relative;
  transition: border 0.2s;
}
input[type="radio"][name="sch-color"]:checked + .color-dot {
  border: 3px solid #333;
}
/* modal animation */
.modal-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); z-index:9998; }
.modal-overlay .modal-content { background:#fff; padding:18px; border-radius:10px; min-width:360px; box-shadow:0 10px 30px rgba(0,0,0,0.12); transform:translateY(6px); opacity:0; transition: all 180ms ease; }
.modal-overlay.modal-exit .modal-content { transform:translateY(12px); opacity:0; }
.modal-overlay:not(.modal-exit) .modal-content { transform:translateY(0); opacity:1; }
.btn-spinner { vertical-align:middle; }
/* schedule visual bars */
.schedule-wrapper { display:flex; flex-direction:column; gap:4px; }
.schedule-bar { height:8px; border-radius:4px; width:100%; margin-top:6px; }
.sch-start { border-top-left-radius:8px; border-bottom-left-radius:8px; }
.sch-end { border-top-right-radius:8px; border-bottom-right-radius:8px; }
.sch-single { border-radius:8px; height:12px; }
.schedule-title { font-size:13px; }
/* color selection focus */
.color-dot { width:22px; height:22px; border:2px solid #bbb; display:inline-block; border-radius:6px; }
.color-dot.selected { outline:3px solid rgba(0,0,0,0.12); border-color:#333; }
.color-label { display:inline-block; cursor:pointer; }
/* stack and more badge */
.schedule-wrapper { display:flex; gap:6px; align-items:center; }
.more-badge { color:#1976d2; font-weight:700; }
.more-badge:hover { text-decoration:underline; }
/* event dot and title */
.event-dot { width:10px; height:10px; border-radius:50%; display:inline-block; }
.event-title-text { font-size:13px; color:#222; }
/* overlay container for non-layout affecting event bars */
.cell-bar-overlay { position: absolute; left: 6px; right: 6px; top: 26px; height: 12px; pointer-events: none; display:flex; gap:6px; align-items:center; }
.day { position: relative; }
.schedule-bar { position: relative; }
.cell-bar-overlay .schedule-bar { position: absolute; left: 0; right: 0; height: 8px; border-radius:6px; opacity: 0.28; pointer-events: auto; }
.cell-bar-overlay .sch-start { border-top-left-radius:6px; border-bottom-left-radius:6px; }
.cell-bar-overlay .sch-end { border-top-right-radius:6px; border-bottom-right-radius:6px; }
.cell-bar-overlay .sch-single { height:10px; border-radius:6px; }
.drop-target { outline: 2px dashed rgba(25,118,210,0.6); background: rgba(25,118,210,0.04); }
.mini-day-cell { cursor: pointer; border-radius:4px; }
.mini-day-cell:hover { background: rgba(0,0,0,0.03); }
`;
document.head.appendChild(style);
  

// 일정 범례(색상별 설명) 렌더링
async function renderScheduleLegend() {
  const legendEl = document.getElementById('schedule-legend');
  if (!legendEl) return;
  const schedules = await getSchedules();
  // 색상별로 대표 일정 제목 추출
  const colorMap = {};
  schedules.forEach(sch => {
    if (!colorMap[sch.color]) {
      colorMap[sch.color] = sch.title;
    }
  });
  // 범례 HTML 생성
  let html = '';
  Object.keys(colorMap).forEach(color => {
    const title = colorMap[color];
    html += `<div style="display:inline-block;margin-right:12px;margin-bottom:6px;">
      <span class="color-dot" style="background:${color};"></span>
      <span class="schedule-text">${title}</span>
    </div>`;
  });
  if (!html) html = '오늘의 일정';
  legendEl.innerHTML = html;
} 
// 오늘/선택 날짜 일정 리스트 패널 렌더링
async function renderScheduleListPanel(selectedDateStr = null) {
  await renderScheduleLegend();
  const schedules = await getSchedules();
  let targetDate;
  if (selectedDateStr) {
    targetDate = selectedDateStr;
  } else {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth()+1).padStart(2,'0');
    const d = String(today.getDate()).padStart(2,'0');
    targetDate = `${y}-${m}-${d}`;
  }
  const list = schedules.filter(sch => {
    // 시작~종료일 범위 내에 targetDate가 포함되는 일정도 표시
    const start = new Date(sch.start);
    const end = new Date(sch.end);
    const t = new Date(targetDate);
    return t >= start && t <= end;
  });
  const ul = document.getElementById('schedule-list-ul');
  if (!ul) return;
  // add search + sort control above list if not already present
  const sortWrapId = 'schedule-list-sort-wrap';
  let sortWrap = document.getElementById(sortWrapId);
  if (!sortWrap) {
    sortWrap = document.createElement('div'); sortWrap.id = sortWrapId; sortWrap.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;';
    sortWrap.innerHTML = '<div style="font-weight:600;display:flex;gap:8px;align-items:center;"><span>일정 목록</span><input id="schedule-list-search" placeholder="검색(제목)" style="padding:6px;border-radius:6px;border:1px solid #ddd;" aria-label="일정 목록 검색"></div><div><select id="schedule-list-sort" aria-label="일정 목록 정렬"><option value="start">시작일순</option><option value="title">제목순</option><option value="color">색상순</option></select></div>';
    ul.parentNode.insertBefore(sortWrap, ul);
    document.getElementById('schedule-list-sort').addEventListener('change', function() { renderScheduleListPanel(selectedDateStr); });
    document.getElementById('schedule-list-search').addEventListener('input', function() { renderScheduleListPanel(selectedDateStr); });
  }
  ul.innerHTML = '';
  // apply sort
  const sortBy = (document.getElementById('schedule-list-sort') && document.getElementById('schedule-list-sort').value) || 'start';
  if (sortBy === 'title') list.sort((a,b)=> a.title.localeCompare(b.title));
  else if (sortBy === 'color') list.sort((a,b)=> (a.color||'').localeCompare(b.color||''));
  else list.sort((a,b)=> new Date(a.start) - new Date(b.start));

  list.forEach(sch => {
    const q = (document.getElementById('schedule-list-search') && document.getElementById('schedule-list-search').value || '').trim().toLowerCase();
    if (q && !(sch.title||'').toLowerCase().includes(q)) return; // filter by search
    const li = document.createElement('li');
    li.style.marginBottom = '8px'; li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center';
    const left = document.createElement('div'); left.style.display = 'flex'; left.style.alignItems = 'center'; left.style.gap = '8px';
    const colorDot = document.createElement('span'); colorDot.style.cssText = `display:inline-block;width:14px;height:14px;background:${sch.color};border-radius:50%;`; colorDot.setAttribute('aria-hidden','true');
    const titleEl = document.createElement('b'); titleEl.textContent = sch.title; titleEl.style.marginRight = '6px';
    const meta = document.createElement('span'); meta.style.fontSize = '12px'; meta.style.color = '#888'; meta.textContent = `(${sch.start}~${sch.end})`;
    left.appendChild(colorDot); left.appendChild(titleEl); left.appendChild(meta);
    const right = document.createElement('div'); right.style.display = 'flex'; right.style.gap = '6px'; right.style.alignItems = 'center';
    if (sch.remindAt) { const bell = document.createElement('span'); bell.textContent = '🔔'; bell.title = '리마인더 설정됨'; bell.setAttribute('aria-label','리마인더'); right.appendChild(bell); }
    if (sch.recurrence) { const rep = document.createElement('span'); rep.textContent = '🔁'; rep.title = '반복 일정'; rep.setAttribute('aria-label','반복'); right.appendChild(rep); }
    // clickable area opens day modal
    li.appendChild(left); li.appendChild(right);
    li.style.cursor = 'pointer';
    li.onclick = function(e) { if (e && e.stopPropagation) e.stopPropagation(); showDayEventsModal(sch.start); };
    ul.appendChild(li);
  });
}
// 상단 +일정 추가 버튼 클릭 시 일정 입력 모달 표시
document.addEventListener('DOMContentLoaded', function() {
  const addBtn = document.getElementById('add-schedule-btn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      // 오늘 날짜를 기본값으로 전달
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth()+1).padStart(2,'0');
      const d = String(today.getDate()).padStart(2,'0');
      showScheduleInputModal(`${y}-${m}-${d}`);
    });
  }
});